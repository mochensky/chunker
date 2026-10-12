"use strict";

// ---------------------------------------------------------------------------------------------
// i18n

const I18N = {
  en: {
    dim_overworld: "Overworld", dim_the_nether: "Nether", dim_the_end: "The End",
    server_free: "Server stopped", server_busy: "Server running",
    state_idle: "idle", state_running: "running", state_paused: "paused", state_cancelling: "cancelling",
    state_cancelled: "cancelled", state_finished: "finished", state_failed: "failed",
    time_at: "at {rate}/s", copied: "Seed copied", all_threads: "all ({n})", no_job: "No task yet",
    content_hint_full: "Terrain, structures with their mobs, trees, ores and the rest of the features, like a vanilla world. " +
      "The server only adds light and the first animals when the chunks load.",
    content_hint_terrain: "About a third faster. The server generates structures, trees and ores itself the first " +
      "time each chunk loads, so it works harder while players explore the pre-generated area.",
    region: "region", chunk: "chunk", unknown_biome: "—", none: "none",
    kind_server: "server", kind_world: "world", not_supported: "{v} — not supported yet",
    no_level: "world not created yet", nothing_found: "Nothing found nearby. Browse to the server or world folder below.",
    opening: "Opening…", opening_hint: "Loading the world (the first time the server jar may be downloaded)…",
    last_played: "played {d}", empty_dir: "No sub-folders",
  },
  ru: {
    login_hint: "Введите токен доступа из консоли сервера.", login: "Войти",
    seed: "Сид", packs: "Датапаки", folder: "Папка",
    server_busy_note: "Сервер Minecraft запущен. Остановите его перед генерацией — chunker пишет файлы регионов напрямую.",
    new_job: "Новая задача", dimension: "Измерение", center: "Центр", radius: "Радиус", blocks: "блоков",
    shape: "Форма", square: "Квадрат", circle: "Круг", rectangle: "Прямоугольник", size: "Размер", advanced: "Дополнительно", threads: "Потоки",
    skip_existing: "Пропускать уже существующие чанки", chunks: "чанков", on_disk: "на диске", time: "время",
    content: "Что генерировать", content_full: "Всё", content_terrain: "Только рельеф",
    content_hint_full: "Рельеф, структуры с мобами, деревья, руды и остальные фичи — как в ванильном мире. " +
      "Серверу при загрузке чанков остаётся только свет и первые животные.",
    content_hint_terrain: "Примерно на треть быстрее. Структуры, деревья и руды сервер сгенерирует сам при первой " +
      "загрузке каждого чанка — пока игроки исследуют пре-генерированную зону, нагрузка на него будет выше.",
    start: "Начать генерацию", map_hint: "Кликните по карте, чтобы поставить центр; тяните контур, чтобы изменить размер. Shift + перетаскивание рисует прямоугольник.",
    progress: "Прогресс", cps: "чанков/с", eta: "осталось", elapsed: "прошло", generated: "Создано",
    skipped: "Пропущено", regions: "Регионы", pause: "Пауза", resume: "Продолжить", cancel: "Отменить",
    experimental: "Рельеф, структуры, фичи и мобы структур генерируются бит-в-бит как в ванилле. Свет и первых животных " +
      "сервер добавит при загрузке чанков.",
    layer_surface: "Рельеф", layer_biome: "Биомы",
    confirm_title: "Начать генерацию?", confirm_text: "Убедитесь, что сервер Minecraft остановлен: chunker пишет файлы регионов напрямую.",
    back: "Назад",
    dim_overworld: "Верхний мир", dim_the_nether: "Незер", dim_the_end: "Энд",
    server_free: "Сервер остановлен", server_busy: "Сервер запущен",
    state_idle: "нет задачи", state_running: "идёт", state_paused: "пауза", state_cancelling: "отмена…",
    state_cancelled: "отменено", state_finished: "готово", state_failed: "ошибка",
    time_at: "при {rate}/с", copied: "Сид скопирован", all_threads: "все ({n})", no_job: "Задач ещё не было",
    region: "регион", chunk: "чанк", unknown_biome: "—", none: "нет",
    pick_title: "Выберите мир", pick_text: "Укажите папку сервера или мира на этом компьютере. Версия игры определяется по level.dat.",
    pick_found: "Найдено", pick_browse: "Обзор", searching: "Поиск…", go: "Перейти", open_folder: "Открыть эту папку",
    change: "Сменить",
    kind_server: "сервер", kind_world: "мир", not_supported: "{v} — пока не поддерживается",
    no_level: "мир ещё не создан", nothing_found: "Рядом ничего не найдено. Укажите папку сервера или мира ниже.",
    opening: "Открываю…", opening_hint: "Загружаю мир (в первый раз может скачиваться jar сервера)…",
    last_played: "игра {d}", empty_dir: "Нет вложенных папок",
  },
};

const BIOMES_RU = {
  badlands: "Пустоши", bamboo_jungle: "Бамбуковые джунгли", basalt_deltas: "Базальтовые дельты", beach: "Пляж",
  birch_forest: "Берёзовый лес", cherry_grove: "Вишнёвая роща", cold_ocean: "Холодный океан", crimson_forest: "Багровый лес",
  dappled_forest: "Пёстрый лес", dark_forest: "Тёмный лес", deep_cold_ocean: "Холодный глубокий океан", deep_dark: "Глубокая тьма",
  deep_frozen_ocean: "Замёрзший глубокий океан", deep_lukewarm_ocean: "Умеренно тёплый глубокий океан", deep_ocean: "Глубокий океан",
  desert: "Пустыня", dripstone_caves: "Карстовые пещеры", end_barrens: "Пустоши Энда", end_highlands: "Высокогорья Энда",
  end_midlands: "Равнины Энда", eroded_badlands: "Выветренные пустоши", flower_forest: "Цветочный лес", forest: "Лес",
  frozen_ocean: "Замёрзший океан", frozen_peaks: "Ледяные пики", frozen_river: "Замёрзшая река", grove: "Роща",
  ice_spikes: "Ледяные шипы", jagged_peaks: "Зубчатые пики", jungle: "Джунгли", lukewarm_ocean: "Умеренно тёплый океан",
  lush_caves: "Пышные пещеры", mangrove_swamp: "Мангровое болото", meadow: "Луг", mushroom_fields: "Грибные поля",
  nether_wastes: "Пустоши Незера", ocean: "Океан", old_growth_birch_forest: "Древний берёзовый лес",
  old_growth_pine_taiga: "Древняя сосновая тайга", old_growth_spruce_taiga: "Древняя еловая тайга", pale_garden: "Бледный сад",
  plains: "Равнины", river: "Река", savanna: "Саванна", savanna_plateau: "Плато саванны", small_end_islands: "Малые острова Энда",
  snowy_beach: "Заснеженный пляж", snowy_plains: "Заснеженные равнины", snowy_slopes: "Заснеженные склоны",
  snowy_taiga: "Заснеженная тайга", soul_sand_valley: "Долина песка душ", sparse_jungle: "Редкие джунгли",
  stony_peaks: "Каменные пики", stony_shore: "Каменистый берег", sulfur_caves: "Серные пещеры",
  sunflower_plains: "Подсолнечные равнины", swamp: "Болото", taiga: "Тайга", the_end: "Энд", the_void: "Пустота",
  warm_ocean: "Тёплый океан", warped_forest: "Искажённый лес", windswept_forest: "Обдуваемый лес",
  windswept_gravelly_hills: "Обдуваемые гравийные холмы", windswept_hills: "Обдуваемые холмы", windswept_savanna: "Обдуваемая саванна",
  wooded_badlands: "Лесистые пустоши",
};

const $ = (id) => document.getElementById(id);
const storage = {
  get(k) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch { /* private mode */ } },
};

let lang = (storage.get("chunker_lang") || navigator.language || "en").startsWith("ru") ? "ru" : "en";
const englishDefaults = {};

function t(key, vars) {
  let s = I18N[lang][key] ?? I18N.en[key] ?? englishDefaults[key] ?? key;
  if (vars) for (const [k, v] of Object.entries(vars)) s = s.replace(`{${k}}`, v);
  return s;
}

function applyI18n() {
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const k = el.dataset.i18n;
    if (!(k in englishDefaults)) englishDefaults[k] = el.textContent.trim();
    el.textContent = t(k);
  });
  document.querySelectorAll("[data-i18n-html]").forEach((el) => {
    const k = el.dataset.i18nHtml;
    if (!(k in englishDefaults)) englishDefaults[k] = el.innerHTML.trim();
    el.innerHTML = t(k);
  });
  document.documentElement.lang = lang;
  $("lang-toggle").textContent = lang === "ru" ? "EN" : "RU";
}

function biomeName(id) {
  if (!id) return t("unknown_biome");
  const [ns, path] = id.includes(":") ? id.split(":") : ["minecraft", id];
  if (ns === "minecraft" && lang === "ru" && BIOMES_RU[path]) return BIOMES_RU[path];
  const pretty = path.split(/[_/]/).map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
  return ns === "minecraft" ? pretty : `${pretty} (${ns})`;
}

function dimensionName(id) {
  const key = "dim_" + id.replace("minecraft:", "");
  const s = t(key);
  return s === key ? id.replace("minecraft:", "") : s;
}

const locale = () => (lang === "ru" ? "ru-RU" : "en-US");
const fmtNum = (n) => Math.round(Number(n) || 0).toLocaleString(locale());

function fmtDuration(s) {
  if (s == null || !isFinite(s)) return "—";
  s = Math.max(0, Math.round(s));
  const d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  if (d) return `${d}d ${h}h`;
  if (h) return `${h}h ${String(m).padStart(2, "0")}m`;
  if (m) return `${m}m ${String(sec).padStart(2, "0")}s`;
  return `${sec}s`;
}

function fmtBytes(b) {
  const units = ["B", "KB", "MB", "GB", "TB"];
  let i = 0;
  while (b >= 1024 && i < units.length - 1) { b /= 1024; i++; }
  return `${b < 10 && i ? b.toFixed(1) : Math.round(b)} ${units[i]}`;
}

function fmtDistance(blocks) {
  return blocks >= 1000 ? `${(blocks / 1000).toLocaleString(locale())} k` : `${blocks}`;
}

let toastTimer;
function toast(msg, isError) {
  const el = $("toast");
  el.textContent = msg;
  el.className = "toast" + (isError ? " error" : "");
  el.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (el.hidden = true), 4500);
}

// ---------------------------------------------------------------------------------------------
// API

async function api(path, opts = {}) {
  const res = await fetch(path, {
    ...opts,
    headers: { "Content-Type": "application/json", ...(opts.headers || {}) },
    credentials: "same-origin",
  });
  if (res.status === 401) {
    showLogin();
    throw new Error("unauthorized");
  }
  const body = res.headers.get("content-type")?.includes("json") ? await res.json() : null;
  if (!res.ok) {
    const e = new Error(body?.error || res.statusText);
    e.code = body?.code;
    throw e;
  }
  return body;
}

function showLogin() {
  $("login").hidden = false;
  $("app").hidden = true;
  applyI18n();
  $("login-token").focus();
}

$("login-form").addEventListener("submit", (e) => {
  e.preventDefault();
  location.href = "/?token=" + encodeURIComponent($("login-token").value.trim());
});

// ---------------------------------------------------------------------------------------------
// State

const state = {
  world: null,
  job: null,
  dimension: "minecraft:overworld",
  shape: "square",
  content: storage.get("chunker_content") === "terrain" ? "terrain" : "full",
  layer: storage.get("chunker_layer") === "biome" ? "biome" : "surface",
  regions: new Map(), // "x,z" -> { count, version }
  completed: new Set(),
  seq: 0,
  biomeByColor: new Map(), // 0xRRGGBB -> biome id
  biomeColor: new Map(), // biome id -> "#rrggbb"
  // Measured speed per mode ("full" / "terrain"), for the time estimate.
  lastRate: {
    full: Number(storage.get("chunker_rate_full")) || 0,
    terrain: Number(storage.get("chunker_rate_terrain")) || 0,
  },
};

const jobActive = (j = state.job) => !!j && ["running", "paused", "cancelling"].includes(j.state);

function setSeg(el, value) {
  el.querySelectorAll("button").forEach((b) => b.setAttribute("aria-checked", String(b.dataset.value === value)));
}

function renderWorld(w) {
  state.world = w;
  $("mc-version").textContent = w.version;
  $("w-name").textContent = w.level_name;
  $("w-seed").textContent = w.seed;
  $("w-dir").textContent = w.world_dir;
  const packs = $("w-packs");
  packs.replaceChildren(...w.data_packs.map((p) => Object.assign(document.createElement("span"), { textContent: p.replace(/^file\//, "") })));
  renderServerStatus();
  state.biomeByColor.clear();
  state.biomeColor.clear();
  for (const b of w.biomes || []) {
    state.biomeByColor.set(parseInt(b.color.slice(1), 16), b.id);
    state.biomeColor.set(b.id, b.color);
  }
  const dims = $("f-dimension");
  dims.replaceChildren(...w.dimensions.map((d) => {
    const b = document.createElement("button");
    b.type = "button";
    b.dataset.value = d.id;
    b.textContent = dimensionName(d.id);
    b.disabled = !d.supported;
    if (!d.supported) b.title = d.reason || "";
    b.onclick = () => selectDimension(d.id);
    return b;
  }));
  if (!w.dimensions.some((d) => d.id === state.dimension)) state.dimension = w.dimensions[0]?.id || state.dimension;
  setSeg(dims, state.dimension);
  const threads = $("f-threads");
  threads.max = w.threads;
  if (!threads.dataset.touched) threads.value = w.threads;
  renderThreads();
}

function renderServerStatus() {
  const w = state.world;
  if (!w) return;
  $("w-status").className = "status " + (w.in_use ? "busy" : "free");
  $("w-status-text").textContent = t(w.in_use ? "server_busy" : "server_free");
  $("w-busy").hidden = !w.in_use;
  renderButtons();
}

function renderThreads() {
  const el = $("f-threads");
  const all = Number(el.value) >= Number(el.max);
  $("f-threads-out").textContent = all ? t("all_threads", { n: el.max }) : el.value;
}

/** Half of a size input, in blocks. */
const half = (id) => Math.max(0, Math.round((Number($(id).value) || 0) / 2));

/** Half the size of a spec along x and z. */
function extents(spec) {
  return spec.shape === "rectangle" ? [spec.radius, spec.radius_z ?? spec.radius] : [spec.radius, spec.radius];
}

/** Shows the radius or the rectangle size, whichever the shape uses. */
function renderShapeFields() {
  const rect = state.shape === "rectangle";
  $("f-radius-field").hidden = rect;
  $("f-size-field").hidden = !rect;
}

/** Switches the shape; a new rectangle starts as the square the form showed. */
function setShape(shape) {
  if (shape === "rectangle" && state.shape !== "rectangle") {
    const r = Math.max(16, Math.round(Number($("f-radius").value) || 0));
    $("f-w").value = 2 * r;
    $("f-l").value = 2 * r;
  }
  state.shape = shape;
  setSeg($("f-shape"), shape);
  renderShapeFields();
}

function formSpec() {
  const threads = $("f-threads");
  const rect = state.shape === "rectangle";
  return {
    dimension: state.dimension,
    center_x: Math.round(Number($("f-x").value) || 0),
    center_z: Math.round(Number($("f-z").value) || 0),
    radius: rect ? half("f-w") : Math.max(0, Math.round(Number($("f-radius").value) || 0)),
    radius_z: rect ? half("f-l") : null,
    shape: state.shape,
    skip_existing: $("f-skip").checked,
    threads: Number(threads.value) >= Number(threads.max) ? 0 : Number(threads.value),
    decorate: state.content !== "terrain",
  };
}

function setForm(spec) {
  $("f-x").value = spec.center_x;
  $("f-z").value = spec.center_z;
  $("f-radius").value = spec.radius;
  $("f-w").value = 2 * extents(spec)[0];
  $("f-l").value = 2 * extents(spec)[1];
  state.shape = spec.shape;
  setSeg($("f-shape"), spec.shape);
  renderShapeFields();
  $("f-skip").checked = spec.skip_existing !== false;
  state.content = spec.decorate === false ? "terrain" : "full";
  renderContent();
  renderEstimate();
}

/** The shape shown on the map: the active job's, otherwise the form's. */
function targetSpec() {
  return jobActive() ? state.job.spec : formSpec();
}

/** Number of chunks whose centre lies in the shape (same rule as the engine). */
function countChunks(spec) {
  const { center_x: x0, center_z: z0, radius: r } = spec;
  const [rx, rz] = extents(spec);
  if (rx <= 0 || rz <= 0) return 0;
  const lo = (c) => (c - r) >> 4, hi = (c) => (c + r) >> 4;
  let n = 0;
  if (spec.shape !== "circle") {
    const axis = (c, e) => {
      let k = 0;
      for (let i = (c - e) >> 4; i <= (c + e) >> 4; i++) if (Math.abs(i * 16 + 8 - c) <= e) k++;
      return k;
    };
    return axis(x0, rx) * axis(z0, rz);
  }
  for (let cz = lo(z0); cz <= hi(z0); cz++) {
    const dz = cz * 16 + 8 - z0;
    const rest = r * r - dz * dz;
    if (rest < 0) continue;
    const w = Math.floor(Math.sqrt(rest));
    const a = Math.max(lo(x0), Math.ceil((x0 - w - 8) / 16)), b = Math.min(hi(x0), Math.floor((x0 + w - 8) / 16));
    if (b >= a) n += b - a + 1;
  }
  return n;
}

/** Measured bytes per chunk for the current form (`/api/estimate`), keyed like the request. */
const sizeEstimate = { key: null, bytes: 0, pending: null, timer: 0 };

/** Asks the server to measure the chunk size of the form's area (debounced; cached by the server). */
function requestSizeEstimate(spec) {
  const [rx, rz] = extents(spec);
  const key = JSON.stringify([spec.dimension, spec.decorate, spec.center_x >> 7, spec.center_z >> 7, rx >> 8, rz >> 8]);
  if (key === sizeEstimate.key || key === sizeEstimate.pending) return;
  clearTimeout(sizeEstimate.timer);
  sizeEstimate.timer = setTimeout(async () => {
    sizeEstimate.pending = key;
    try {
      const r = await api("/api/estimate", { method: "POST", body: JSON.stringify(spec) });
      sizeEstimate.key = key;
      sizeEstimate.bytes = r.bytes_per_chunk;
    } catch (e) {
      if (e.message !== "unauthorized") sizeEstimate.key = null;
    } finally {
      if (sizeEstimate.pending === key) sizeEstimate.pending = null;
      renderEstimate();
    }
  }, 300);
}

function renderContent() {
  setSeg($("f-content"), state.content);
  $("f-content-hint").textContent = t(state.content === "terrain" ? "content_hint_terrain" : "content_hint_full");
}

function renderEstimate() {
  const spec = formSpec();
  const n = countChunks(spec);
  $("e-chunks").textContent = fmtNum(n);
  if (state.world && spec.radius > 0) requestSizeEstimate(spec);
  $("e-disk").textContent = sizeEstimate.bytes > 0 ? "~" + fmtBytes(n * sizeEstimate.bytes) : "…";
  const rate = state.lastRate[state.content];
  $("e-time").textContent = rate > 0 ? "~" + fmtDuration(n / rate) : "—";
  $("e-time-label").textContent = rate > 0 ? t("time_at", { rate: fmtNum(rate) }) : t("time");
  document.querySelectorAll("#f-presets button").forEach((b) => b.setAttribute("aria-pressed", String(Number(b.dataset.r) === spec.radius)));
  if (hover.x == null) renderReadout();
  draw();
}

function renderButtons() {
  const job = state.job;
  const busy = state.world?.in_use;
  $("btn-start").disabled = jobActive() || !!busy;
  $("btn-pause").disabled = !(job && job.state === "running");
  $("btn-resume").disabled = !(job && job.state === "paused");
  $("btn-cancel").disabled = !jobActive();
}

function renderJob(job) {
  const prev = state.job;
  state.job = job;
  const s = job ? job.state : "idle";
  $("job").dataset.state = s;
  const badge = $("j-state");
  badge.dataset.state = s;
  badge.textContent = t("state_" + s);
  const done = job ? job.generated_chunks + job.skipped_chunks : 0;
  const pct = job && job.total_chunks ? Math.min(100, (done * 100) / job.total_chunks) : 0;
  $("j-bar").style.width = pct + "%";
  $("j-pct").textContent = (pct >= 100 || pct === 0 ? pct.toFixed(0) : pct.toFixed(pct < 10 ? 2 : 1)) + "%";
  $("j-count").textContent = job ? `${fmtNum(done)} / ${fmtNum(job.total_chunks)}` : t("no_job");
  $("j-rate").textContent = job && job.state === "running" ? fmtNum(job.chunks_per_second) : "0";
  $("j-eta").textContent = job && job.state === "running" ? fmtDuration(job.eta_seconds) : "—";
  $("j-elapsed").textContent = job ? fmtDuration(job.elapsed_seconds) : "—";
  $("j-gen").textContent = fmtNum(job?.generated_chunks);
  $("j-skip").textContent = fmtNum(job?.skipped_chunks);
  $("j-regions").textContent = job ? `${fmtNum(job.completed_regions)} / ${fmtNum(job.total_regions)}` : "0 / 0";
  const err = $("j-error");
  err.hidden = !job?.error;
  err.textContent = job?.error || "";
  if (job && job.state === "running" && job.chunks_per_second > 0 && job.elapsed_seconds > 5) {
    const mode = job.spec.decorate === false ? "terrain" : "full";
    state.lastRate[mode] = job.chunks_per_second;
    storage.set("chunker_rate_" + mode, String(Math.round(job.chunks_per_second)));
  }
  if (job && jobActive(job) && (!prev || prev.spec !== job.spec)) setForm(job.spec);
  // The form is read-only while a task is active (the dimension buttons stay usable to switch the map).
  const locked = jobActive(job);
  document.querySelectorAll("#job-form input, #f-shape button, #f-content button, #f-presets button, #f-origin").forEach((el) => (el.disabled = locked));
  renderButtons();
  animateMap(jobActive(job) && job.state === "running" && job.spec.dimension === state.dimension);
  draw();
}

// ---------------------------------------------------------------------------------------------
// Map data: region list, tiles (PNG per region and layer), live updates over SSE.

const REGION = 512;
const TILE_PX = 128;
const tiles = new Map(); // "layer:x,z" -> { img, data, version, loading, fetchedAt, missing }
let inflight = 0;
const MAX_INFLIGHT = 6;

async function loadRegions() {
  const dim = state.dimension;
  try {
    const r = await api(`/api/map/regions?dimension=${encodeURIComponent(dim)}`);
    if (dim !== state.dimension) return;
    const next = new Map();
    for (const [x, z, count, version] of r.regions) next.set(`${x},${z}`, { count, version });
    state.regions = next;
    state.completed = new Set(r.completed.map(([x, z]) => `${x},${z}`));
    state.seq = r.seq;
    draw();
  } catch { /* reported elsewhere */ }
}

function tileUrl(layer, x, z, v) {
  return `/api/map/tile?dimension=${encodeURIComponent(state.dimension)}&x=${x}&z=${z}&layer=${layer}&v=${v}`;
}

async function fetchTile(layer, x, z, version) {
  const key = `${layer}:${x},${z}`;
  const entry = tiles.get(key) || {};
  entry.loading = true;
  tiles.set(key, entry);
  inflight++;
  const dim = state.dimension;
  try {
    const res = await fetch(tileUrl(layer, x, z, version), { credentials: "same-origin" });
    if (res.status === 401) return showLogin();
    if (!res.ok) {
      entry.missing = true;
      entry.version = version;
      return;
    }
    const img = await createImageBitmap(await res.blob());
    if (dim !== state.dimension) return;
    entry.img?.close?.();
    entry.img = img;
    entry.missing = false;
    entry.version = version;
    if (layer === "biome") {
      const c = new OffscreenCanvas(TILE_PX, TILE_PX);
      const g = c.getContext("2d");
      g.drawImage(img, 0, 0);
      entry.data = g.getImageData(0, 0, TILE_PX, TILE_PX).data;
    }
  } catch {
    entry.missing = true;
  } finally {
    entry.loading = false;
    entry.fetchedAt = performance.now();
    inflight--;
    draw();
  }
}

/** Requests missing or outdated tiles of the visible regions, nearest first. */
function ensureTiles(visible) {
  if (visible.length > 1600) return;
  const now = performance.now();
  const wanted = [];
  for (const { x, z, region } of visible) {
    for (const layer of state.layer === "biome" ? ["biome"] : ["surface"]) {
      const e = tiles.get(`${layer}:${x},${z}`);
      if (e?.loading) continue;
      if (e && e.version >= region.version && (e.img || e.missing)) continue;
      if (e && now - (e.fetchedAt || 0) < 1000) { scheduleDraw(1000); continue; }
      wanted.push({ layer, x, z, region });
    }
  }
  const [cx, cz] = [view.x / REGION, view.z / REGION];
  wanted.sort((a, b) => Math.hypot(a.x + 0.5 - cx, a.z + 0.5 - cz) - Math.hypot(b.x + 0.5 - cx, b.z + 0.5 - cz));
  for (const w of wanted) {
    if (inflight >= MAX_INFLIGHT) break;
    fetchTile(w.layer, w.x, w.z, w.region.version);
  }
}

let events = null;
function connectEvents() {
  events?.close();
  const es = new EventSource(`/api/events?dimension=${encodeURIComponent(state.dimension)}&since=${state.seq}`);
  events = es;
  let lastCompleted = -1;
  es.addEventListener("progress", (e) => {
    const { job, tiles: changed, generation } = JSON.parse(e.data);
    if (state.world && generation && generation !== state.world.generation) return location.reload();
    for (const [x, z, v] of changed || []) {
      const key = `${x},${z}`;
      const r = state.regions.get(key) || { count: 0, version: 0 };
      r.version = Math.max(r.version, v);
      state.regions.set(key, r);
    }
    const completed = job ? job.completed_regions : 0;
    if (completed !== lastCompleted) {
      if (lastCompleted >= 0) loadRegions();
      lastCompleted = completed;
    }
    renderJob(job);
  });
  es.onerror = () => {
    es.close();
    if (events === es) setTimeout(() => events === es && connectEvents(), 3000);
  };
}

async function selectDimension(id) {
  if (id === state.dimension) return;
  state.dimension = id;
  setSeg($("f-dimension"), id);
  state.regions = new Map();
  tiles.forEach((e) => e.img?.close?.());
  tiles.clear();
  await loadRegions();
  connectEvents();
  renderEstimate();
}

// ---------------------------------------------------------------------------------------------
// Map rendering. View: centre in blocks + scale in CSS pixels per block.

const canvas = $("map");
const g = canvas.getContext("2d");
const view = { x: 0, z: 0, scale: 0.25, w: 0, h: 0 };
const MIN_SCALE = 1 / 128, MAX_SCALE = 16;

function resize() {
  const r = canvas.getBoundingClientRect();
  view.w = r.width;
  view.h = r.height;
  canvas.width = Math.round(r.width * devicePixelRatio);
  canvas.height = Math.round(r.height * devicePixelRatio);
  draw();
}

const toScreen = (x, z) => [(x - view.x) * view.scale + view.w / 2, (z - view.z) * view.scale + view.h / 2];
const toWorld = (sx, sy) => [(sx - view.w / 2) / view.scale + view.x, (sy - view.h / 2) / view.scale + view.z];

let drawQueued = false, drawTimer = 0, animating = false, dash = 0;
function draw() {
  if (drawQueued) return;
  drawQueued = true;
  requestAnimationFrame(() => {
    drawQueued = false;
    render();
  });
}
function scheduleDraw(ms) {
  if (!drawTimer) drawTimer = setTimeout(() => { drawTimer = 0; draw(); }, ms);
}
function animateMap(on) {
  if (on === animating) return;
  animating = on;
  const tick = () => {
    if (!animating) return;
    dash = (dash + 0.6) % 16;
    draw();
    setTimeout(() => requestAnimationFrame(tick), 40);
  };
  if (on) tick();
}

function render() {
  const { w, h, scale } = view;
  g.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
  g.fillStyle = "#0d0e10";
  g.fillRect(0, 0, w, h);

  const [wx0, wz0] = toWorld(0, 0);
  const [wx1, wz1] = toWorld(w, h);
  const rx0 = Math.floor(wx0 / REGION), rz0 = Math.floor(wz0 / REGION);
  const rx1 = Math.floor(wx1 / REGION), rz1 = Math.floor(wz1 / REGION);
  const rpx = REGION * scale;

  // Tiles
  const visible = [];
  g.imageSmoothingEnabled = rpx < TILE_PX;
  g.imageSmoothingQuality = "medium";
  for (let rz = rz0; rz <= rz1; rz++) {
    for (let rx = rx0; rx <= rx1; rx++) {
      const region = state.regions.get(`${rx},${rz}`);
      if (!region) continue;
      visible.push({ x: rx, z: rz, region });
      const [sx, sy] = toScreen(rx * REGION, rz * REGION);
      const tile = tiles.get(`${state.layer}:${rx},${rz}`);
      if (tile?.img) {
        g.drawImage(tile.img, sx, sy, rpx, rpx);
      } else {
        g.fillStyle = "#17191c";
        g.fillRect(sx, sy, rpx, rpx);
      }
    }
  }
  ensureTiles(visible);

  // Grids: chunks when zoomed in, regions otherwise.
  const grid = (step, alpha) => {
    g.strokeStyle = `rgba(232,228,218,${alpha})`;
    g.lineWidth = 1;
    g.beginPath();
    for (let x = Math.floor(wx0 / step) * step; x <= wx1; x += step) {
      const sx = Math.round(toScreen(x, 0)[0]) + 0.5;
      g.moveTo(sx, 0); g.lineTo(sx, h);
    }
    for (let z = Math.floor(wz0 / step) * step; z <= wz1; z += step) {
      const sy = Math.round(toScreen(0, z)[1]) + 0.5;
      g.moveTo(0, sy); g.lineTo(w, sy);
    }
    g.stroke();
  };
  if (16 * scale >= 10) grid(16, 0.05);
  if (rpx >= 28) grid(REGION, 0.09);

  // Origin
  const [ox, oy] = toScreen(0, 0);
  g.strokeStyle = "rgba(232,228,218,0.45)";
  g.beginPath();
  g.moveTo(ox - 7, oy); g.lineTo(ox + 7, oy); g.moveTo(ox, oy - 7); g.lineTo(ox, oy + 7);
  g.stroke();

  // Regions in progress
  const job = state.job;
  if (job && jobActive(job) && job.spec.dimension === state.dimension) {
    g.strokeStyle = "#e8b04b";
    g.lineWidth = 1.5;
    g.setLineDash([5, 3]);
    g.lineDashOffset = -dash;
    for (const [x, z] of job.current_regions || []) {
      const [sx, sy] = toScreen(x * REGION, z * REGION);
      g.fillStyle = "rgba(232,176,75,0.07)";
      g.fillRect(sx, sy, rpx, rpx);
      g.strokeRect(sx + 0.75, sy + 0.75, rpx - 1.5, rpx - 1.5);
    }
    g.setLineDash([]);
  }

  // Target shape
  const spec = targetSpec();
  if (spec.dimension === state.dimension && spec.radius > 0) {
    const [cx, cy] = toScreen(spec.center_x, spec.center_z);
    const [ex, ez] = extents(spec);
    const r = ex * scale, rzs = ez * scale;
    const path = new Path2D();
    if (spec.shape === "circle") path.arc(cx, cy, r, 0, Math.PI * 2);
    else path.rect(cx - r, cy - rzs, 2 * r, 2 * rzs);
    // Dim everything outside the target a little.
    g.save();
    g.fillStyle = "rgba(6,7,8,0.38)";
    const outside = new Path2D();
    outside.rect(0, 0, w, h);
    outside.addPath(path);
    g.fill(outside, "evenodd");
    g.restore();
    g.strokeStyle = jobActive() ? "rgba(232,176,75,0.9)" : "#e8b04b";
    g.lineWidth = hover.edge ? 2.5 : 1.5;
    const handle = (hx, hy) => {
      g.fillStyle = "#141619";
      g.fillRect(hx - 4, hy - 4, 8, 8);
      g.strokeStyle = "#e8b04b";
      g.lineWidth = 1.5;
      g.strokeRect(hx - 4, hy - 4, 8, 8);
    };
    g.stroke(path);
    g.fillStyle = "#e8b04b";
    g.beginPath();
    g.arc(cx, cy, 3, 0, Math.PI * 2);
    g.fill();
    if (!jobActive()) {
      // Resize handles: the right edge; a rectangle also has the bottom edge and the corner.
      handle(cx + r, cy);
      if (spec.shape === "rectangle") {
        handle(cx, cy + rzs);
        handle(cx + r, cy + rzs);
      }
    }
  }

  renderScale();
}

function renderScale() {
  const target = 110 / view.scale; // blocks in ~110 px
  const steps = [1, 2, 5];
  let len = 1;
  for (let p = 1; p < 1e7; p *= 10) for (const s of steps) if (s * p <= target) len = s * p;
  const el = $("scale");
  el.querySelector("i").style.width = Math.round(len * view.scale) + "px";
  el.querySelector("span").textContent = `${fmtDistance(len)} ${lang === "ru" ? "бл." : "blocks"}`;
}

// ---------------------------------------------------------------------------------------------
// Map interaction

const hover = { x: null, z: null, edge: false };
let pointer = null;

/** Which outline edge is under the cursor: "xz" (radius or rectangle corner), "x", "z" or null. */
function edgeAt(sx, sy) {
  const spec = targetSpec();
  if (jobActive() || spec.dimension !== state.dimension || spec.radius <= 0) return null;
  const [cx, cy] = toScreen(spec.center_x, spec.center_z);
  const [ex, ez] = extents(spec);
  const rx = ex * view.scale, rz = ez * view.scale;
  const dx = Math.abs(sx - cx), dy = Math.abs(sy - cy);
  const near = 8;
  if (spec.shape === "circle") return Math.abs(Math.hypot(dx, dy) - rx) < near ? "xz" : null;
  if (spec.shape === "square") return Math.abs(Math.max(dx, dy) - rx) < near ? "xz" : null;
  const onX = Math.abs(dx - rx) < near && dy < rz + near;
  const onZ = Math.abs(dy - rz) < near && dx < rx + near;
  return onX && onZ ? "xz" : onX ? "x" : onZ ? "z" : null;
}

const snap16 = (v) => Math.round(v / 16) * 16;

/** Resizes the form's shape to the cursor along `edge`. */
function resizeTo(sx, sy, edge) {
  const spec = formSpec();
  const [x, z] = toWorld(sx, sy);
  const dx = x - spec.center_x, dz = z - spec.center_z;
  if (spec.shape === "rectangle") {
    if (edge.includes("x")) $("f-w").value = Math.max(32, snap16(2 * Math.abs(dx)));
    if (edge.includes("z")) $("f-l").value = Math.max(32, snap16(2 * Math.abs(dz)));
    return;
  }
  const d = spec.shape === "circle" ? Math.hypot(dx, dz) : Math.max(Math.abs(dx), Math.abs(dz));
  $("f-radius").value = Math.max(16, snap16(d));
}

/** Shift + drag: a rectangle from the press point to the cursor, snapped to chunk edges. */
function drawRectTo(sx, sy) {
  const [x0, z0] = pointer.draw;
  const [x1, z1] = toWorld(sx, sy);
  const span = (a, b) => {
    let lo = snap16(Math.min(a, b)), hi = snap16(Math.max(a, b));
    if (hi - lo < 32) hi = lo + 32;
    return [lo, hi];
  };
  const [ax, bx] = span(x0, x1), [az, bz] = span(z0, z1);
  $("f-x").value = (ax + bx) / 2;
  $("f-z").value = (az + bz) / 2;
  $("f-w").value = bx - ax;
  $("f-l").value = bz - az;
}

function setResizeCursor(edge) {
  canvas.classList.toggle("resize", edge === "xz");
  canvas.classList.toggle("resize-x", edge === "x");
  canvas.classList.toggle("resize-z", edge === "z");
}

canvas.addEventListener("pointerdown", (e) => {
  canvas.setPointerCapture(e.pointerId);
  const draw = e.shiftKey && !jobActive() ? toWorld(e.offsetX, e.offsetY) : null;
  if (draw) setShape("rectangle");
  const resize = draw ? null : edgeAt(e.offsetX, e.offsetY);
  pointer = { id: e.pointerId, sx: e.offsetX, sy: e.offsetY, vx: view.x, vz: view.z, moved: false, resize, draw };
});

canvas.addEventListener("pointermove", (e) => {
  const [x, z] = toWorld(e.offsetX, e.offsetY);
  hover.x = x;
  hover.z = z;
  if (pointer && pointer.id === e.pointerId) {
    const dx = e.offsetX - pointer.sx, dy = e.offsetY - pointer.sy;
    if (Math.abs(dx) + Math.abs(dy) > 3) pointer.moved = true;
    if (pointer.draw) {
      if (pointer.moved) {
        drawRectTo(e.offsetX, e.offsetY);
        renderEstimate();
      }
    } else if (pointer.resize) {
      resizeTo(e.offsetX, e.offsetY, pointer.resize);
      renderEstimate();
    } else if (pointer.moved) {
      view.x = pointer.vx - dx / view.scale;
      view.z = pointer.vz - dy / view.scale;
      canvas.classList.add("panning");
      draw();
    }
  } else {
    const edge = edgeAt(e.offsetX, e.offsetY);
    if (Boolean(edge) !== hover.edge) { hover.edge = Boolean(edge); draw(); }
    setResizeCursor(edge);
  }
  renderReadout();
});

canvas.addEventListener("pointerup", (e) => {
  if (!pointer || pointer.id !== e.pointerId) return;
  if (!pointer.moved && !pointer.resize && !pointer.draw && !jobActive()) {
    const [x, z] = toWorld(e.offsetX, e.offsetY);
    $("f-x").value = Math.round(x);
    $("f-z").value = Math.round(z);
    renderEstimate();
  }
  pointer = null;
  canvas.classList.remove("panning");
});

canvas.addEventListener("pointerleave", () => {
  hover.x = null;
  renderReadout();
});

canvas.addEventListener("wheel", (e) => {
  e.preventDefault();
  const factor = Math.pow(1.0015, -e.deltaY * (e.deltaMode === 1 ? 33 : 1));
  zoomAt(e.offsetX, e.offsetY, factor);
}, { passive: false });

function zoomAt(sx, sy, factor) {
  const [bx, bz] = toWorld(sx, sy);
  view.scale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, view.scale * factor));
  const [ax, az] = toWorld(sx, sy);
  view.x += bx - ax;
  view.z += bz - az;
  draw();
  renderReadout();
}

function fitTo(cx, cz, radius) {
  view.x = cx;
  view.z = cz;
  view.scale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, (Math.min(view.w, view.h) * 0.4) / Math.max(48, radius)));
  draw();
}

function fitTarget() {
  const s = targetSpec();
  fitTo(s.center_x, s.center_z, Math.max(...extents(s)));
}

/** Fits the regions that exist in the world (used on first load without a job). */
function fitWorld() {
  if (!state.regions.size) return fitTarget();
  let x0 = Infinity, z0 = Infinity, x1 = -Infinity, z1 = -Infinity;
  for (const key of state.regions.keys()) {
    const [x, z] = key.split(",").map(Number);
    x0 = Math.min(x0, x); z0 = Math.min(z0, z); x1 = Math.max(x1, x + 1); z1 = Math.max(z1, z + 1);
  }
  fitTo(((x0 + x1) / 2) * REGION, ((z0 + z1) / 2) * REGION, (Math.max(x1 - x0, z1 - z0) * REGION) / 2);
}

$("zoom-in").onclick = () => zoomAt(view.w / 2, view.h / 2, 1.6);
$("zoom-out").onclick = () => zoomAt(view.w / 2, view.h / 2, 1 / 1.6);
$("zoom-fit").onclick = fitTarget;

const biomeTilesRequested = new Set();
function biomeAt(x, z) {
  const rx = Math.floor(x / REGION), rz = Math.floor(z / REGION);
  const region = state.regions.get(`${rx},${rz}`);
  if (!region) return null;
  const tile = tiles.get(`biome:${rx},${rz}`);
  if (!tile?.data || tile.version < region.version) {
    const key = `${rx},${rz}:${region.version}`;
    if (!tile?.loading && !biomeTilesRequested.has(key) && inflight < MAX_INFLIGHT) {
      biomeTilesRequested.add(key);
      fetchTile("biome", rx, rz, region.version).then(renderReadout);
    }
    if (!tile?.data) return null;
  }
  const px = Math.floor((x - rx * REGION) / 4), pz = Math.floor((z - rz * REGION) / 4);
  const i = (pz * TILE_PX + px) * 4;
  if (tile.data[i + 3] === 0) return null;
  return state.biomeByColor.get((tile.data[i] << 16) | (tile.data[i + 1] << 8) | tile.data[i + 2]) || null;
}

function renderReadout() {
  const el = $("readout");
  if (hover.x == null) {
    const s = targetSpec();
    el.innerHTML = `${t("center")} <b>${s.center_x}, ${s.center_z}</b>`;
    return;
  }
  const x = Math.floor(hover.x), z = Math.floor(hover.z);
  const cx = Math.floor(x / 16), cz = Math.floor(z / 16);
  const biome = biomeAt(x, z);
  const biomeHtml = biome
    ? ` · <span class="biome"><i style="background:${state.biomeColor.get(biome)}"></i>${biomeName(biome)}</span>`
    : "";
  el.innerHTML = `X <b>${x}</b> Z <b>${z}</b> · ${t("chunk")} ${cx}, ${cz} · r.${cx >> 5}.${cz >> 5}${biomeHtml}`;
}

// ---------------------------------------------------------------------------------------------
// Form

// Radii are whole chunks (multiples of 16); 512 blocks is one region.
const PRESETS = [512, 1024, 2048, 4096, 8192];
$("f-presets").replaceChildren(...PRESETS.map((r) => {
  const b = document.createElement("button");
  b.type = "button";
  b.dataset.r = r;
  b.textContent = r >= 1024 ? `${r / 1024}k` : String(r);
  b.onclick = () => { $("f-radius").value = r; renderEstimate(); fitTarget(); };
  return b;
}));

$("f-content").querySelectorAll("button").forEach((b) => {
  b.onclick = () => {
    state.content = b.dataset.value;
    storage.set("chunker_content", state.content);
    renderContent();
    renderEstimate();
  };
});
$("f-shape").querySelectorAll("button").forEach((b) => {
  b.onclick = () => { setShape(b.dataset.value); renderEstimate(); };
});
$("layer").querySelectorAll("button").forEach((b) => {
  b.onclick = () => { state.layer = b.dataset.value; storage.set("chunker_layer", state.layer); setSeg($("layer"), state.layer); draw(); };
});
["f-x", "f-z", "f-radius"].forEach((id) => $(id).addEventListener("input", renderEstimate));
// Typed radii snap to whole chunks.
["f-w", "f-l"].forEach((id) => {
  $(id).addEventListener("input", renderEstimate);
  // Typed sizes snap to whole chunks.
  $(id).addEventListener("change", () => {
    $(id).value = Math.max(32, snap16(Number($(id).value) || 0));
    renderEstimate();
  });
});
$("f-radius").addEventListener("change", () => {
  const el = $("f-radius");
  el.value = Math.max(16, Math.round((Number(el.value) || 0) / 16) * 16);
  renderEstimate();
});
$("f-threads").addEventListener("input", () => { $("f-threads").dataset.touched = "1"; renderThreads(); });
$("f-origin").onclick = () => { $("f-x").value = 0; $("f-z").value = 0; renderEstimate(); fitTarget(); };
$("w-seed").onclick = async () => {
  try { await navigator.clipboard.writeText(state.world.seed); toast(t("copied")); } catch { /* insecure context */ }
};

$("job-form").addEventListener("submit", (e) => {
  e.preventDefault();
  if (formSpec().radius < 16) return $("f-radius").focus();
  $("confirm").hidden = false;
  $("confirm-yes").focus();
});
$("confirm-no").onclick = () => ($("confirm").hidden = true);
$("confirm").addEventListener("click", (e) => { if (e.target === $("confirm")) $("confirm").hidden = true; });
document.addEventListener("keydown", (e) => { if (e.key === "Escape") $("confirm").hidden = true; });
$("confirm-yes").onclick = async () => {
  $("confirm").hidden = true;
  try {
    const { job } = await api("/api/job", { method: "POST", body: JSON.stringify(formSpec()) });
    renderJob(job);
    fitTarget();
  } catch (err) { toast(err.message, true); }
};

const jobAction = (name) => () => api(`/api/job/${name}`, { method: "POST" }).catch((e) => toast(e.message, true));
$("btn-pause").onclick = jobAction("pause");
$("btn-resume").onclick = jobAction("resume");
$("btn-cancel").onclick = jobAction("cancel");

$("lang-toggle").onclick = () => {
  lang = lang === "ru" ? "en" : "ru";
  storage.set("chunker_lang", lang);
  applyI18n();
  renderContent();
  if (state.world) renderWorld(state.world);
  renderEstimate();
  renderJob(state.job);
  renderReadout();
};

// ---------------------------------------------------------------------------------------------
// World picker

const picker = { selected: null, canGoBack: false };

function versionLabel(c) {
  const v = c.version || (c.data_version ? `data ${c.data_version}` : "?");
  return c.supported ? v : t("not_supported", { v });
}

function worldRow(c, current) {
  const b = document.createElement("button");
  b.type = "button";
  b.className = "world-row" + (c.path === current ? " current" : "");
  const played = c.last_played ? new Date(c.last_played).toLocaleDateString(locale()) : "";
  const ver = c.has_level ? versionLabel(c) : t("no_level");
  b.innerHTML = `<span class="name"><span></span><span class="kind"></span></span>
    <span class="mono path"></span>
    <span class="meta"><span class="ver${c.has_level && c.supported ? "" : " bad"}"></span><span></span></span>`;
  b.querySelector(".name span").textContent = c.name;
  b.querySelector(".name .kind").textContent = t("kind_" + c.kind);
  b.querySelector(".path").textContent = c.path;
  b.querySelector(".ver").textContent = ver;
  b.querySelector(".meta span:last-child").textContent = played ? t("last_played", { d: played }) : "";
  b.disabled = !c.has_level || !c.supported;
  b.onclick = () => openWorld(c.path);
  return b;
}

async function showPicker(canGoBack) {
  picker.canGoBack = canGoBack;
  events?.close();
  $("app").hidden = true;
  $("picker").hidden = false;
  $("p-back").hidden = !canGoBack;
  applyI18n();
  $("p-lang").textContent = lang === "ru" ? "EN" : "RU";
  const list = $("p-list");
  list.innerHTML = `<p class="hint">${t("searching")}</p>`;
  browse(null);
  try {
    const r = await api("/api/worlds");
    list.replaceChildren(...r.worlds.map((c) => worldRow(c, r.current)));
    if (!r.worlds.length) list.innerHTML = `<p class="hint">${t("nothing_found")}</p>`;
    const start = r.current || r.worlds[0]?.path;
    if (start) browse(start.replace(/[\\/][^\\/]+$/, "") || start);
  } catch (e) {
    list.innerHTML = "";
    toast(e.message, true);
  }
}

async function browse(path) {
  const el = $("p-browser");
  try {
    const r = await api("/api/fs" + (path ? `?path=${encodeURIComponent(path)}` : ""));
    $("p-path").value = r.path || "";
    picker.selected = r.candidate;
    const open = $("p-open");
    open.disabled = !(r.candidate && r.candidate.has_level && r.candidate.supported);
    open.title = r.candidate ? `${r.candidate.name} · ${r.candidate.has_level ? versionLabel(r.candidate) : t("no_level")}` : "";
    const rows = [];
    if (r.path) {
      const up = document.createElement("button");
      up.type = "button";
      up.innerHTML = "<i></i>..";
      up.onclick = () => browse(r.parent);
      rows.push(up);
    }
    for (const e of r.entries) {
      const b = document.createElement("button");
      b.type = "button";
      b.className = e.kind ? "world" : "";
      b.innerHTML = `<i></i><span></span>${e.kind ? `<span class="kind">${t("kind_" + e.kind)}</span>` : ""}`;
      b.querySelector("span").textContent = e.name;
      b.onclick = () => browse(e.path);
      rows.push(b);
    }
    if (r.path && !r.entries.length) rows.push(Object.assign(document.createElement("div"), { className: "empty", textContent: t("empty_dir") }));
    el.replaceChildren(...rows);
    el.scrollTop = 0;
  } catch (e) {
    toast(e.message, true);
  }
}

async function openWorld(path) {
  const open = $("p-open");
  open.disabled = true;
  open.textContent = t("opening");
  toast(t("opening_hint"));
  try {
    await api("/api/world/open", { method: "POST", body: JSON.stringify({ path }) });
    location.reload();
  } catch (e) {
    toast(e.message, true);
    open.textContent = t("open_folder");
    open.disabled = false;
  }
}

$("p-path-form").addEventListener("submit", (e) => { e.preventDefault(); browse($("p-path").value.trim()); });
$("p-open").onclick = () => picker.selected && openWorld(picker.selected.path);
$("p-back").onclick = () => location.reload();
$("p-lang").onclick = () => {
  lang = lang === "ru" ? "en" : "ru";
  storage.set("chunker_lang", lang);
  showPicker(picker.canGoBack);
};
$("w-change").onclick = () => showPicker(true);

window.addEventListener("resize", resize);

(async function init() {
  if (location.search.includes("token=")) history.replaceState(null, "", "/");
  applyI18n();
  let world;
  try {
    world = await api("/api/world");
  } catch (e) {
    if (e.code === "no_world") return showPicker(false);
    if (e.message !== "unauthorized") toast(e.message, true);
    return;
  }
  $("app").hidden = false;
  setSeg($("layer"), state.layer);
  setSeg($("f-shape"), state.shape);
  renderShapeFields();
  renderContent();
  const { job } = await api("/api/job");
  if (job) state.dimension = job.spec.dimension;
  renderWorld(world);
  resize();
  if (job) setForm(job.spec);
  renderEstimate();
  renderJob(job);
  await loadRegions();
  if (job) fitTarget(); else fitWorld();
  renderReadout();
  connectEvents();
  setInterval(async () => {
    try {
      const w = await api("/api/world");
      if (w.generation !== state.world.generation) return location.reload();
      state.world = { ...state.world, ...w };
      renderServerStatus();
    } catch { /* offline */ }
  }, 10000);
})();
