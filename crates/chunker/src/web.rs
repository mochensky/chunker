//! Web interface: embedded static UI + JSON API + server-sent progress events.

use std::convert::Infallible;
use std::path::PathBuf;
use std::sync::Arc;
use std::sync::atomic::{AtomicU64, Ordering};

use parking_lot::RwLock;
use std::time::Duration;

use anyhow::{Context, Result};
use axum::Router;
use axum::body::Body;
use axum::extract::{Query, Request, State};
use axum::http::{HeaderMap, HeaderValue, StatusCode, header};
use axum::middleware::{self, Next};
use axum::response::sse::{Event, KeepAlive, Sse};
use axum::response::{IntoResponse, Json, Response};
use axum::routing::{get, post};
use chunker_data::Identifier;
use chunker_worldgen::job::JobSpec;
use chunker_worldgen::{World, WorldOptions};

use crate::discover;
use futures_util::stream::Stream;
use serde::Deserialize;
use serde_json::json;

const INDEX_HTML: &str = include_str!("../web/index.html");
const APP_JS: &str = include_str!("../web/app.js");
const STYLE_CSS: &str = include_str!("../web/style.css");

/// The world being worked on; the web UI can switch it while no task runs.
pub struct WorldSlot {
    engine: RwLock<Option<Arc<World>>>,
    /// Bumped on every switch so open pages notice and reload.
    generation: AtomicU64,
    /// Template for opening worlds (jar, cache, download policy); `path` is replaced.
    options: WorldOptions,
}

impl WorldSlot {
    pub fn new(engine: Option<Arc<World>>, options: WorldOptions) -> Arc<Self> {
        Arc::new(Self {
            engine: RwLock::new(engine),
            generation: AtomicU64::new(1),
            options,
        })
    }

    fn current(&self) -> Option<Arc<World>> {
        self.engine.read().clone()
    }
}

#[derive(Clone)]
struct AppState {
    slot: Arc<WorldSlot>,
    token: Option<Arc<str>>,
    /// Limits concurrent preview rendering from region files (CPU heavy, competes with jobs).
    render_permits: Arc<tokio::sync::Semaphore>,
}

fn random_token() -> String {
    let mut bytes = [0u8; 18];
    getrandom::fill(&mut bytes).expect("system randomness");
    bytes.iter().map(|b| format!("{b:02x}")).collect()
}

impl AppState {
    /// The open world.
    fn engine(&self) -> Option<Arc<World>> {
        self.slot.current()
    }
}

/// The answer while no world is open.
fn no_world() -> Response {
    (
        StatusCode::CONFLICT,
        Json(json!({"error": "no world is open", "code": "no_world"})),
    )
        .into_response()
}

/// The open world, or returns `409 no_world` from the handler.
macro_rules! engine {
    ($s:expr) => {
        match $s.engine() {
            Some(e) => e,
            None => return no_world(),
        }
    };
}

fn load_or_create_token(cache_dir: &std::path::Path) -> Result<String> {
    let path: PathBuf = cache_dir.join("token");
    if let Ok(t) = std::fs::read_to_string(&path) {
        let t = t.trim().to_owned();
        if !t.is_empty() {
            return Ok(t);
        }
    }
    let t = random_token();
    std::fs::create_dir_all(path.parent().unwrap())?;
    std::fs::write(&path, &t)?;
    Ok(t)
}

pub async fn serve(
    slot: Arc<WorldSlot>,
    host: String,
    port: u16,
    token: Option<String>,
    no_auth: bool,
) -> Result<()> {
    let token: Option<Arc<str>> = if no_auth {
        None
    } else {
        Some(
            token
                .map(Ok)
                .unwrap_or_else(|| load_or_create_token(&slot.options.cache_dir))?
                .into(),
        )
    };
    let state = AppState {
        slot,
        token: token.clone(),
        render_permits: Arc::new(tokio::sync::Semaphore::new(3)),
    };
    let api = Router::new()
        .route("/api/world", get(world))
        .route("/api/world/open", post(open_world))
        .route("/api/worlds", get(worlds))
        .route("/api/fs", get(browse))
        .route("/api/job", get(job).post(start_job))
        .route("/api/estimate", post(estimate))
        .route("/api/job/pause", post(pause))
        .route("/api/job/resume", post(resume))
        .route("/api/job/cancel", post(cancel))
        .route("/api/events", get(events))
        .route("/api/map/regions", get(map_regions))
        .route("/api/map/tile", get(map_tile))
        .route_layer(middleware::from_fn_with_state(state.clone(), auth));
    let app = Router::new()
        .route("/", get(index))
        .route(
            "/app.js",
            get(|| async { ([(header::CONTENT_TYPE, "text/javascript; charset=utf-8")], APP_JS) }),
        )
        .route(
            "/style.css",
            get(|| async { ([(header::CONTENT_TYPE, "text/css; charset=utf-8")], STYLE_CSS) }),
        )
        .merge(api)
        .with_state(state);
    let addr = format!("{host}:{port}");
    let listener = tokio::net::TcpListener::bind(&addr)
        .await
        .with_context(|| format!("binding {addr}"))?;
    let shown_host = if host == "0.0.0.0" {
        "localhost".to_owned()
    } else {
        host.clone()
    };
    match &token {
        Some(t) => tracing::info!("web UI: http://{shown_host}:{port}/?token={t}"),
        None => tracing::warn!("web UI without authentication: http://{shown_host}:{port}/"),
    }
    if host == "0.0.0.0" {
        tracing::info!(
            "listening on all interfaces; use the token above (or --host 127.0.0.1) to restrict access"
        );
    }
    axum::serve(listener, app)
        .with_graceful_shutdown(async {
            let _ = tokio::signal::ctrl_c().await;
        })
        .await?;
    Ok(())
}

/// The token of a request: from the URL first (a login link must win over a stale cookie of an
/// earlier run), then the `Authorization` header, then the session cookie.
fn token_from(headers: &HeaderMap, query: Option<&str>) -> Option<String> {
    if let Some(t) = query.and_then(|q| q.split('&').find_map(|kv| kv.strip_prefix("token="))) {
        return Some(t.to_owned());
    }
    if let Some(v) = headers.get(header::AUTHORIZATION).and_then(|v| v.to_str().ok())
        && let Some(t) = v.strip_prefix("Bearer ")
    {
        return Some(t.to_owned());
    }
    let cookies = headers.get(header::COOKIE).and_then(|v| v.to_str().ok())?;
    cookies
        .split(';')
        .find_map(|c| c.trim().strip_prefix("chunker_token="))
        .map(str::to_owned)
}

fn constant_time_eq(a: &str, b: &str) -> bool {
    a.len() == b.len() && a.bytes().zip(b.bytes()).fold(0u8, |acc, (x, y)| acc | (x ^ y)) == 0
}

async fn auth(State(state): State<AppState>, req: Request, next: Next) -> Response {
    let Some(expected) = &state.token else {
        return next.run(req).await;
    };
    match token_from(req.headers(), req.uri().query()) {
        Some(t) if constant_time_eq(&t, expected) => next.run(req).await,
        _ => (StatusCode::UNAUTHORIZED, Json(json!({"error": "unauthorized"}))).into_response(),
    }
}

/// Serves the UI; a valid `?token=` sets the session cookie.
async fn index(State(state): State<AppState>, req: Request) -> Response {
    let mut resp = ([(header::CONTENT_TYPE, "text/html; charset=utf-8")], INDEX_HTML).into_response();
    if let Some(expected) = &state.token
        && let Some(t) = token_from(req.headers(), req.uri().query())
        && constant_time_eq(&t, expected)
    {
        let cookie = format!("chunker_token={t}; Path=/; HttpOnly; SameSite=Strict; Max-Age=31536000");
        if let Ok(v) = HeaderValue::from_str(&cookie) {
            resp.headers_mut().insert(header::SET_COOKIE, v);
        }
    }
    resp
}

fn err(e: anyhow::Error) -> Response {
    (StatusCode::BAD_REQUEST, Json(json!({"error": format!("{e:#}")}))).into_response()
}

async fn world(State(s): State<AppState>) -> Response {
    let engine = engine!(s);
    let generation = s.slot.generation.load(Ordering::SeqCst);
    let result = tokio::task::spawn_blocking(move || {
        let palette = engine.biome_palette();
        let biomes: Vec<serde_json::Value> = palette
            .iter()
            .enumerate()
            .map(|(i, c)| {
                let name = engine.biomes.name(chunker_worldgen::biome::BiomeId(i as u16));
                json!({ "id": name.as_str(), "color": format!("#{:02x}{:02x}{:02x}", c[0], c[1], c[2]) })
            })
            .collect();
        let mut v = serde_json::to_value(engine.summary()).unwrap_or_default();
        v["biomes"] = json!(biomes);
        v["threads"] = json!(std::thread::available_parallelism().map_or(1, |n| n.get()));
        v["generation"] = json!(generation);
        v
    })
    .await;
    match result {
        Ok(v) => Json(v).into_response(),
        Err(e) => err(e.into()),
    }
}

async fn job(State(s): State<AppState>) -> Response {
    let engine = engine!(s);
    Json(json!({ "job": engine.job_snapshot() })).into_response()
}

async fn start_job(State(s): State<AppState>, Json(spec): Json<JobSpec>) -> Response {
    let engine = engine!(s);
    match tokio::task::spawn_blocking(move || engine.start(spec)).await {
        Ok(Ok(j)) => Json(json!({ "job": j.snapshot() })).into_response(),
        Ok(Err(e)) => err(e),
        Err(e) => err(e.into()),
    }
}

/// Bytes per chunk a job with this spec will write (measured on sample chunks).
async fn estimate(State(s): State<AppState>, Json(spec): Json<JobSpec>) -> Response {
    let engine = engine!(s);
    match tokio::task::spawn_blocking(move || engine.estimate_chunk_bytes(&spec)).await {
        Ok(Ok(bytes)) => Json(json!({ "bytes_per_chunk": bytes })).into_response(),
        Ok(Err(e)) => err(e),
        Err(e) => err(e.into()),
    }
}

async fn pause(State(s): State<AppState>) -> Response {
    match engine!(s).pause() {
        Ok(()) => Json(json!({"ok": true})).into_response(),
        Err(e) => err(e),
    }
}

async fn resume(State(s): State<AppState>) -> Response {
    let engine = engine!(s);
    match tokio::task::spawn_blocking(move || engine.resume()).await {
        Ok(Ok(())) => Json(json!({"ok": true})).into_response(),
        Ok(Err(e)) => err(e),
        Err(e) => err(e.into()),
    }
}

async fn cancel(State(s): State<AppState>) -> Response {
    match engine!(s).cancel() {
        Ok(()) => Json(json!({"ok": true})).into_response(),
        Err(e) => err(e),
    }
}

#[derive(Deserialize)]
struct EventsQuery {
    dimension: Option<String>,
    /// Tile sequence number the client already has (from `/api/map/regions`).
    since: Option<u64>,
}

/// Progress stream; with `dimension`, also reports the preview tiles that changed. Every event
/// carries the world generation so pages notice when another tab switched the world.
async fn events(
    State(s): State<AppState>,
    Query(q): Query<EventsQuery>,
) -> Sse<impl Stream<Item = Result<Event, Infallible>>> {
    let slot = s.slot.clone();
    let engine = slot.current();
    let previews = engine.as_ref().and_then(|e| {
        q.dimension
            .as_deref()
            .and_then(Identifier::parse)
            .map(|id| e.previews(&id))
    });
    let start = (slot, engine, previews, q.since.unwrap_or(0), 0u64);
    let stream = futures_util::stream::unfold(start, |(slot, engine, previews, since, tick)| async move {
        if tick > 0 {
            tokio::time::sleep(Duration::from_millis(500)).await;
        }
        let (since, tiles) = match &previews {
            Some(p) => {
                let (now, changed) = p.changes_since(since);
                (
                    now,
                    changed
                        .into_iter()
                        .map(|(pos, v)| json!([pos.x, pos.z, v]))
                        .collect::<Vec<_>>(),
                )
            }
            None => (since, Vec::new()),
        };
        let payload = json!({
            "job": engine.as_ref().and_then(|e| e.job_snapshot()),
            "tiles": tiles,
            "generation": slot.generation.load(Ordering::SeqCst),
        });
        let event = Event::default().event("progress").data(payload.to_string());
        Some((Ok(event), (slot, engine, previews, since, tick + 1)))
    });
    Sse::new(stream).keep_alive(KeepAlive::default())
}

#[derive(Deserialize)]
struct OpenQuery {
    path: String,
}

/// Opens another world. Refused while a task of the current world is active.
async fn open_world(State(s): State<AppState>, Json(q): Json<OpenQuery>) -> Response {
    if let Some(current) = s.slot.current()
        && current
            .job()
            .is_some_and(|j| j.is_active() && j.state() != chunker_worldgen::job::JobState::Paused)
    {
        return err(anyhow::anyhow!(
            "a task is running in the current world; pause or cancel it first"
        ));
    }
    let slot = s.slot.clone();
    let result = tokio::task::spawn_blocking(move || -> Result<()> {
        let options = WorldOptions {
            path: PathBuf::from(q.path.trim()),
            ..slot.options.clone()
        };
        let engine = World::open(options)?;
        let previous = slot.engine.write().replace(engine);
        if let Some(previous) = previous {
            // A paused task keeps its job file and can be resumed when the world is opened again.
            if let Some(job) = previous.job()
                && job.is_active()
            {
                job.cancel_for_switch();
            }
            previous.wait();
        }
        slot.generation.fetch_add(1, Ordering::SeqCst);
        Ok(())
    })
    .await;
    match result {
        Ok(Ok(())) => Json(json!({"ok": true})).into_response(),
        Ok(Err(e)) => err(e),
        Err(e) => err(e.into()),
    }
}

/// Worlds found in the usual places (plus the open one).
async fn worlds(State(s): State<AppState>) -> Response {
    let current = s.slot.current().map(|e| {
        let w = e.files.lock();
        w.server_dir.clone().unwrap_or_else(|| w.dir.clone())
    });
    let result = tokio::task::spawn_blocking(move || {
        let extra: Vec<PathBuf> = current.iter().cloned().collect();
        let found = discover::discover(&extra);
        let current = current.and_then(|p| discover::probe(&p)).map(|c| c.path);
        json!({ "current": current, "worlds": found })
    })
    .await;
    match result {
        Ok(v) => Json(v).into_response(),
        Err(e) => err(e.into()),
    }
}

#[derive(Deserialize)]
struct BrowseQuery {
    path: Option<String>,
}

/// Folder browser for choosing a world on the machine chunker runs on.
async fn browse(Query(q): Query<BrowseQuery>) -> Response {
    let result = tokio::task::spawn_blocking(move || {
        let path = q.path.filter(|p| !p.trim().is_empty()).map(PathBuf::from);
        discover::list_dir(path.as_deref())
    })
    .await;
    match result {
        Ok(Ok(listing)) => Json(listing).into_response(),
        Ok(Err(e)) => err(e.into()),
        Err(e) => err(e.into()),
    }
}

#[derive(Deserialize)]
struct DimQuery {
    dimension: String,
}

async fn map_regions(State(s): State<AppState>, Query(q): Query<DimQuery>) -> Response {
    let engine = engine!(s);
    let result = tokio::task::spawn_blocking(move || -> Result<serde_json::Value> {
        let id = Identifier::parse(&q.dimension).context("bad dimension")?;
        let previews = engine.previews(&id);
        let (seq, _) = previews.changes_since(u64::MAX);
        let regions: Vec<serde_json::Value> = previews
            .regions()
            .into_iter()
            .map(|(pos, count)| json!([pos.x, pos.z, count, previews.version(pos)]))
            .collect();
        let completed = engine
            .job()
            .filter(|j| j.spec.dimension == id.as_str())
            .map(|j| j.completed_regions())
            .unwrap_or_default();
        Ok(json!({ "regions": regions, "completed": completed, "seq": seq }))
    })
    .await;
    match result {
        Ok(Ok(v)) => Json(v).into_response(),
        Ok(Err(e)) => err(e),
        Err(e) => err(e.into()),
    }
}

#[derive(Deserialize)]
struct TileQuery {
    dimension: String,
    x: i32,
    z: i32,
    /// `surface` (default) or `biome`.
    layer: Option<String>,
    /// Overview level: the tile covers `2^level` x `2^level` regions starting at region
    /// `(x << level, z << level)`.
    #[serde(default)]
    level: u8,
}

async fn map_tile(State(s): State<AppState>, Query(q): Query<TileQuery>) -> Response {
    let Some(id) = Identifier::parse(&q.dimension) else {
        return StatusCode::BAD_REQUEST.into_response();
    };
    let engine = engine!(s);
    let Ok(_permit) = s.render_permits.clone().acquire_owned().await else {
        return StatusCode::SERVICE_UNAVAILABLE.into_response();
    };
    let biome = q.layer.as_deref() == Some("biome");
    let png = tokio::task::spawn_blocking(move || {
        let tile = engine.previews(&id).overview(q.level, q.x, q.z)?;
        Some(if biome {
            tile.biome_png(&engine.biome_palette())
        } else {
            tile.surface_png()
        })
    })
    .await
    .ok()
    .flatten();
    match png {
        Some(bytes) => Response::builder()
            .header(header::CONTENT_TYPE, "image/png")
            .header(header::CACHE_CONTROL, "no-cache")
            .body(Body::from(bytes))
            .unwrap(),
        None => StatusCode::NOT_FOUND.into_response(),
    }
}
