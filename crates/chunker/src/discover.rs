//! Finding worlds to open: probing folders, searching likely locations, browsing directories.

use std::fs;
use std::path::{Path, PathBuf};

use chunker_data::McVersion;
use serde::Serialize;

/// A folder chunker can open (a server folder or a world folder).
#[derive(Clone, Debug, Serialize)]
pub struct WorldCandidate {
    /// The folder to pass to `Engine::open`.
    pub path: String,
    /// `server` (has `server.properties`) or `world` (has `level.dat`).
    pub kind: &'static str,
    pub name: String,
    /// Game version name from `level.dat` (`Data.Version.Name`), if any.
    pub version: Option<String>,
    pub data_version: i32,
    /// Whether this chunker build can generate for the world's version.
    pub supported: bool,
    /// `Data.LastPlayed` in milliseconds since the epoch.
    pub last_played: i64,
    /// Server folders whose world was not created yet have no `level.dat`.
    pub has_level: bool,
}

/// Removes the Windows `\\?\` verbatim prefix added by `canonicalize`.
fn display_path(p: &Path) -> String {
    let p = fs::canonicalize(p).unwrap_or_else(|_| p.to_path_buf());
    let s = p.to_string_lossy();
    match s.strip_prefix(r"\\?\") {
        Some(rest) if !rest.starts_with("UNC") => rest.to_owned(),
        _ => s.into_owned(),
    }
}

fn server_level_name(server: &Path) -> String {
    fs::read_to_string(server.join("server.properties"))
        .ok()
        .and_then(|t| {
            t.lines()
                .filter(|l| !l.trim_start().starts_with('#'))
                .filter_map(|l| l.split_once('='))
                .find(|(k, _)| k.trim() == "level-name")
                .map(|(_, v)| v.trim().to_owned())
        })
        .filter(|v| !v.is_empty())
        .unwrap_or_else(|| "world".into())
}

/// Reads the interesting bits of `level.dat` (`(name, version name, data version, last played)`).
fn read_level(dir: &Path) -> Option<(String, Option<String>, i32, i64)> {
    let level = chunker_nbt::read_compressed(fs::File::open(dir.join("level.dat")).ok()?).ok()?;
    let data = level.get_compound("Data")?;
    let name = data.get_str("LevelName").unwrap_or("world").to_owned();
    let version = data
        .get_compound("Version")
        .and_then(|v| v.get_str("Name"))
        .map(str::to_owned);
    Some((
        name,
        version,
        data.get_i32("DataVersion").unwrap_or(0),
        data.get_i64("LastPlayed").unwrap_or(0),
    ))
}

/// Describes `path` if it is a server folder or a world folder.
pub fn probe(path: &Path) -> Option<WorldCandidate> {
    let (kind, level_dir) = if path.join("server.properties").is_file() {
        ("server", path.join(server_level_name(path)))
    } else if path.join("level.dat").is_file() {
        ("world", path.to_path_buf())
    } else {
        return None;
    };
    let level = read_level(&level_dir);
    let fallback_name = path
        .file_name()
        .map(|n| n.to_string_lossy().into_owned())
        .unwrap_or_default();
    let data_version = level.as_ref().map_or(0, |l| l.2);
    Some(WorldCandidate {
        path: display_path(path),
        kind,
        // Servers are recognised by their folder; the level name is usually just "world".
        name: if kind == "server" {
            fallback_name
        } else {
            level.as_ref().map_or(fallback_name, |l| l.0.clone())
        },
        version: level.as_ref().and_then(|l| l.1.clone()),
        data_version,
        supported: McVersion::from_data_version(data_version).is_some(),
        last_played: level.as_ref().map_or(0, |l| l.3),
        has_level: level.is_some(),
    })
}

/// Folders never worth descending into while searching.
fn skip_dir(name: &str) -> bool {
    name.starts_with('.') && name != ".minecraft"
        || matches!(
            name,
            "region"
                | "entities"
                | "poi"
                | "dimensions"
                | "data"
                | "playerdata"
                | "advancements"
                | "stats"
                | "datapacks"
                | "libraries"
                | "versions"
                | "logs"
                | "crash-reports"
                | "cache"
                | "plugins"
                | "mods"
                | "config"
                | "node_modules"
                | "target"
                | "Windows"
                | "Program Files"
                | "Program Files (x86)"
                | "ProgramData"
                | "$Recycle.Bin"
                | "AppData"
                | "System Volume Information"
        )
}

fn search(dir: &Path, depth: u32, out: &mut Vec<WorldCandidate>, budget: &mut u32) {
    if *budget == 0 {
        return;
    }
    *budget -= 1;
    if let Some(c) = probe(dir) {
        let is_server = c.kind == "server";
        out.push(c);
        if is_server {
            return; // its world is part of the server candidate
        }
    }
    if depth == 0 {
        return;
    }
    let Ok(entries) = fs::read_dir(dir) else { return };
    let mut dirs: Vec<PathBuf> = entries
        .flatten()
        .filter(|e| e.file_type().is_ok_and(|t| t.is_dir()))
        .filter(|e| !skip_dir(&e.file_name().to_string_lossy()))
        .map(|e| e.path())
        .collect();
    dirs.sort();
    for d in dirs {
        search(&d, depth - 1, out, budget);
    }
}

/// Searches the usual places: `extra` folders, the working directory, the executable's folder and
/// the Minecraft launcher's `saves`. Results are deduplicated, most recently played first.
pub fn discover(extra: &[PathBuf]) -> Vec<WorldCandidate> {
    let mut roots: Vec<(PathBuf, u32)> = extra.iter().map(|p| (p.clone(), 0)).collect();
    if let Ok(cwd) = std::env::current_dir() {
        roots.push((cwd, 3));
    }
    if let Some(exe_dir) = std::env::current_exe()
        .ok()
        .and_then(|p| p.parent().map(Path::to_path_buf))
    {
        roots.push((exe_dir, 3));
    }
    if let Some(appdata) = std::env::var_os("APPDATA") {
        roots.push((PathBuf::from(appdata).join(".minecraft").join("saves"), 1));
    }
    if let Some(profile) = std::env::var_os("USERPROFILE") {
        let profile = PathBuf::from(profile);
        for sub in ["Desktop", "Documents", "Downloads"] {
            roots.push((profile.join(sub), 2));
        }
    }
    if let Some(home) = std::env::var_os("HOME").filter(|_| !cfg!(windows)) {
        let home = PathBuf::from(home);
        roots.push((home.join(".minecraft").join("saves"), 1));
        roots.push((home.join("Library/Application Support/minecraft/saves"), 1));
        roots.push((home, 2));
    }
    let mut out = Vec::new();
    for (root, depth) in roots {
        if root.is_dir() {
            let mut budget = 4000;
            search(&root, depth, &mut out, &mut budget);
        }
    }
    let mut seen = std::collections::HashSet::new();
    out.retain(|c| seen.insert(c.path.to_lowercase()));
    out.sort_by(|a, b| {
        b.last_played
            .cmp(&a.last_played)
            .then_with(|| a.path.cmp(&b.path))
    });
    out
}

/// One entry of a directory listing for the folder browser.
#[derive(Clone, Debug, Serialize)]
pub struct DirEntry {
    pub name: String,
    pub path: String,
    /// `server`, `world` or `null` (plain folder).
    pub kind: Option<&'static str>,
}

#[derive(Clone, Debug, Serialize)]
pub struct DirListing {
    /// The listed folder (`null` for the list of roots).
    pub path: Option<String>,
    pub parent: Option<String>,
    pub entries: Vec<DirEntry>,
    /// The listed folder itself, if it can be opened.
    pub candidate: Option<WorldCandidate>,
}

fn kind_of(path: &Path) -> Option<&'static str> {
    if path.join("server.properties").is_file() {
        Some("server")
    } else if path.join("level.dat").is_file() {
        Some("world")
    } else {
        None
    }
}

/// Filesystem roots: drive letters on Windows, `/` elsewhere.
fn roots() -> Vec<DirEntry> {
    if cfg!(windows) {
        (b'A'..=b'Z')
            .map(|l| format!("{}:\\", l as char))
            .filter(|p| Path::new(p).is_dir())
            .map(|p| DirEntry {
                name: p.clone(),
                path: p,
                kind: None,
            })
            .collect()
    } else {
        vec![DirEntry {
            name: "/".into(),
            path: "/".into(),
            kind: None,
        }]
    }
}

/// Lists the sub-folders of `path` (or the filesystem roots when `None`).
pub fn list_dir(path: Option<&Path>) -> std::io::Result<DirListing> {
    let Some(path) = path else {
        return Ok(DirListing {
            path: None,
            parent: None,
            entries: roots(),
            candidate: None,
        });
    };
    let mut entries: Vec<DirEntry> = fs::read_dir(path)?
        .flatten()
        .filter(|e| e.file_type().is_ok_and(|t| t.is_dir()))
        .filter_map(|e| {
            let name = e.file_name().to_string_lossy().into_owned();
            if name.starts_with('$') || name == "System Volume Information" {
                return None;
            }
            let p = e.path();
            Some(DirEntry {
                kind: kind_of(&p),
                path: display_path(&p),
                name,
            })
        })
        .collect();
    entries.sort_by(|a, b| {
        b.kind
            .is_some()
            .cmp(&a.kind.is_some())
            .then_with(|| a.name.to_lowercase().cmp(&b.name.to_lowercase()))
    });
    let shown = display_path(path);
    // A drive root's parent is the list of roots (`None`).
    let parent = Path::new(&shown)
        .parent()
        .map(|p| p.to_string_lossy().into_owned());
    Ok(DirListing {
        candidate: probe(path),
        path: Some(shown),
        parent,
        entries,
    })
}
