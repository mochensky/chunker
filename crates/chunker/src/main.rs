//! chunker: fast Minecraft world pre-generator with a web UI.

#[global_allocator]
static GLOBAL: mimalloc::MiMalloc = mimalloc::MiMalloc;

mod compare;
mod discover;
mod web;

use std::path::PathBuf;
use std::sync::Arc;
use std::time::Duration;

use anyhow::{Context, Result};
use chunker_worldgen::job::{JobSpec, JobState, Shape};
use chunker_worldgen::{World, WorldOptions};
use clap::{Parser, Subcommand, ValueEnum};

#[derive(Parser)]
#[command(
    name = "chunker",
    version,
    about = "Fast Minecraft world pre-generator with a web UI"
)]
struct Cli {
    /// Server folder (with server.properties) or world folder (with level.dat). The web UI can also
    /// pick a world itself; other commands default to the current folder.
    #[arg(short, long, global = true)]
    path: Option<PathBuf>,
    /// Explicit Minecraft server jar (vanilla, bundler or a Paper `cache/mojang_*.jar`).
    #[arg(long, global = true)]
    server_jar: Option<PathBuf>,
    /// Cache folder for downloaded server jars.
    #[arg(long, global = true)]
    cache_dir: Option<PathBuf>,
    /// Never download the server jar from Mojang.
    #[arg(long, global = true)]
    offline: bool,
    #[command(subcommand)]
    command: Option<Command>,
}

#[derive(Clone, Copy, ValueEnum)]
enum ShapeArg {
    Square,
    Circle,
    /// `--radius` along X, `--radius-z` along Z.
    Rectangle,
}

#[derive(Subcommand)]
enum Command {
    /// Start the web interface (default).
    Serve {
        /// Address to bind. Use 127.0.0.1 to allow local access only.
        #[arg(long, default_value = "0.0.0.0")]
        host: String,
        #[arg(long, default_value_t = 8730)]
        port: u16,
        /// Access token for the web UI (random if omitted; kept in the cache folder).
        #[arg(long, env = "CHUNKER_TOKEN")]
        token: Option<String>,
        /// Disable authentication (only for trusted networks!).
        #[arg(long)]
        no_auth: bool,
    },
    /// Generate without the web interface.
    Generate {
        #[arg(long, default_value = "minecraft:overworld")]
        dimension: String,
        /// Center in blocks: X,Z.
        #[arg(long, default_value = "0,0", value_parser = parse_center)]
        center: (i32, i32),
        /// Radius in blocks (along X for a rectangle).
        #[arg(long)]
        radius: i32,
        /// Radius along Z of a rectangle (default: the same as --radius).
        #[arg(long)]
        radius_z: Option<i32>,
        #[arg(long, value_enum, default_value = "square")]
        shape: ShapeArg,
        /// Worker threads (0 = all CPUs).
        #[arg(long, default_value_t = 0)]
        threads: usize,
        /// Only terrain (saved at `terrain`; the server places features and structures).
        #[arg(long)]
        terrain_only: bool,
    },
    /// Print world information.
    Info,
    /// Debug: compare the blocks of the same chunks in this world and another world folder.
    Compare {
        /// The other world folder (with level.dat).
        #[arg(long)]
        other: PathBuf,
        #[arg(long, default_value = "minecraft:overworld")]
        dimension: String,
        #[arg(long, value_parser = parse_center)]
        from: (i32, i32),
        #[arg(long, value_parser = parse_center)]
        to: (i32, i32),
        /// Print up to N differing blocks per chunk.
        #[arg(long, default_value_t = 5)]
        verbose: usize,
    },
    /// Debug: print the NBT of one stored chunk.
    DumpChunk {
        #[arg(long, default_value = "minecraft:overworld")]
        dimension: String,
        /// Chunk coordinates: X,Z.
        #[arg(long, value_parser = parse_center)]
        chunk: (i32, i32),
    },
}

fn parse_center(s: &str) -> Result<(i32, i32), String> {
    let (x, z) = s.split_once(',').ok_or("expected X,Z")?;
    Ok((
        x.trim().parse().map_err(|e| format!("{e}"))?,
        z.trim().parse().map_err(|e| format!("{e}"))?,
    ))
}

fn default_cache_dir() -> PathBuf {
    if let Some(base) = std::env::var_os("LOCALAPPDATA").or_else(|| std::env::var_os("XDG_CACHE_HOME")) {
        return PathBuf::from(base).join("chunker");
    }
    if let Some(home) = std::env::var_os("HOME") {
        return PathBuf::from(home).join(".cache").join("chunker");
    }
    PathBuf::from(".chunker-cache")
}

fn main() -> Result<()> {
    tracing_subscriber::fmt()
        .with_env_filter(
            tracing_subscriber::EnvFilter::try_from_default_env().unwrap_or_else(|_| "info".into()),
        )
        .init();
    let cli = Cli::parse();
    let options = WorldOptions {
        path: cli.path.clone().unwrap_or_else(|| PathBuf::from(".")),
        server_jar: cli.server_jar.clone(),
        cache_dir: cli.cache_dir.clone().unwrap_or_else(default_cache_dir),
        allow_download: !cli.offline,
    };
    let command = cli.command.unwrap_or(Command::Serve {
        host: "0.0.0.0".into(),
        port: 8730,
        token: None,
        no_auth: false,
    });
    if let Command::Serve {
        host,
        port,
        token,
        no_auth,
    } = command
    {
        // Without --path, open the current folder if it is a world or server; otherwise the UI asks.
        let engine = match &cli.path {
            Some(_) => Some(World::open(options.clone()).context("opening world")?),
            None if crate::discover::probe(&options.path).is_some() => match World::open(options.clone()) {
                Ok(e) => Some(e),
                Err(e) => {
                    tracing::warn!("could not open the current folder: {e:#}");
                    None
                }
            },
            None => None,
        };
        if engine.is_none() {
            tracing::info!("no world opened yet: choose one in the web UI");
        }
        let slot = web::WorldSlot::new(engine, options);
        let runtime = tokio::runtime::Builder::new_multi_thread()
            .worker_threads(2)
            .enable_all()
            .build()?;
        return runtime.block_on(web::serve(slot, host, port, token, no_auth));
    }
    let engine = World::open(options).context("opening world")?;

    match command {
        Command::Info => {
            println!("{}", serde_json::to_string_pretty(&engine.summary())?);
            Ok(())
        }
        Command::Compare {
            other,
            dimension,
            from,
            to,
            verbose,
        } => {
            let ours = engine.files.lock().dir.clone();
            compare::compare(
                &compare::region_dir_of(&ours, &dimension)?,
                &compare::region_dir_of(&other, &dimension)?,
                from,
                to,
                verbose,
            )
        }
        Command::DumpChunk { dimension, chunk } => {
            let id = chunker_data::Identifier::parse(&dimension).context("bad dimension")?;
            let dir = engine.files.lock().region_dir(&id);
            let pos = chunker_anvil::RegionPos::of_chunk(chunk.0, chunk.1);
            let region = chunker_anvil::Region::load(&dir, pos)?;
            let raw = region
                .get(chunker_anvil::local_index(chunk.0, chunk.1))
                .context("chunk not present")?;
            println!("{:#?}", raw.decode_nbt()?);
            Ok(())
        }
        Command::Generate {
            dimension,
            center,
            radius,
            radius_z,
            shape,
            threads,
            terrain_only,
        } => run_headless(
            engine,
            JobSpec {
                dimension,
                center_x: center.0,
                center_z: center.1,
                radius,
                radius_z,
                shape: match shape {
                    ShapeArg::Square => Shape::Square,
                    ShapeArg::Circle => Shape::Circle,
                    ShapeArg::Rectangle => Shape::Rectangle,
                },
                skip_existing: true,
                threads,
                decorate: !terrain_only,
            },
        ),
        Command::Serve { .. } => unreachable!("handled above"),
    }
}

fn run_headless(engine: Arc<World>, spec: JobSpec) -> Result<()> {
    let job = engine.start(spec)?;
    let mut last_log = std::time::Instant::now();
    loop {
        std::thread::sleep(Duration::from_millis(50));
        let finished = !job.is_active();
        if !finished && last_log.elapsed() < Duration::from_secs(2) {
            continue;
        }
        last_log = std::time::Instant::now();
        let s = job.snapshot();
        let done = s.generated_chunks + s.skipped_chunks;
        let pct = if s.total_chunks > 0 {
            done as f64 * 100.0 / s.total_chunks as f64
        } else {
            100.0
        };
        tracing::info!(
            "{:.1}% {done}/{} chunks ({} generated, {} skipped), {:.0} chunks/s, regions {}/{}{}",
            pct,
            s.total_chunks,
            s.generated_chunks,
            s.skipped_chunks,
            s.chunks_per_second,
            s.completed_regions,
            s.total_regions,
            s.eta_seconds
                .map(|e| format!(", ETA {}", format_duration(e)))
                .unwrap_or_default()
        );
        if !matches!(
            s.state,
            JobState::Running | JobState::Paused | JobState::Cancelling
        ) {
            if let Some(e) = s.error {
                anyhow::bail!(e);
            }
            tracing::info!(
                "finished: {:?} in {}",
                s.state,
                format_duration(s.elapsed_seconds)
            );
            break;
        }
    }
    engine.wait();
    Ok(())
}

pub fn format_duration(secs: f64) -> String {
    let s = secs as u64;
    if s >= 3600 {
        format!("{}h {:02}m", s / 3600, (s % 3600) / 60)
    } else if s >= 60 {
        format!("{}m {:02}s", s / 60, s % 60)
    } else {
        format!("{s}s")
    }
}
