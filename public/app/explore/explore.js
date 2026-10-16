// Explore mode: real stars within 100 light years (Gaia DR3, Hipparcos, NASA data), drawn
// into the shared map renderer (neighborhood.js) and its camera.
//
// Rendering budget: only loaded chunks are drawn; chunks outside the view are culled by
// their bounding boxes; at most LABEL_MAX labels at a time, chosen by priority
// (selected > hovered > zodiac > search results > tour > featured > bright named nearby).

import { openCatalog } from "./catalog.js";
import { el } from "../levels/common.js";

const LABEL_MAX = 28;
// Explore shows only the solar neighbourhood: nothing farther than MAX_LY from the Sun is
// drawn, labelled, searchable, featured or toured. (The catalog files hold the full sample.)
const MAX_LY = 100;
const sunDist = (o) => (o.d != null ? o.d : o.p ? Math.hypot(o.p[0], o.p[1], o.p[2]) : Infinity);
const inRange = (o) => sunDist(o) <= MAX_LY;
// Zoom that frames the whole 100 ly sphere (the map shows ~17 ly radius at zoom 1).
const RANGE_ZOOM = 17 / (MAX_LY * 1.05);
const TYPE_GROUPS = {
  stars: ["star"],
  systems: ["star system"],
  clusters: ["open cluster", "globular cluster"],
  nebulae: ["planetary nebula", "supernova remnant", "reflection nebula", "emission nebula / H II region", "emission nebula / H II region (with reflection nebula component)"],
};
const ZODIAC = [
  ["Ari", "Aries"], ["Tau", "Taurus"], ["Gem", "Gemini"], ["Cnc", "Cancer"], ["Leo", "Leo"], ["Vir", "Virgo"],
  ["Lib", "Libra"], ["Sco", "Scorpius"], ["Sgr", "Sagittarius"], ["Cap", "Capricornus"], ["Aqr", "Aquarius"], ["Psc", "Pisces"],
];

let started = false;

window.addEventListener("starlight:explore", (e) => {
  if (started) { show(true); return; }
  started = true;
  start(e.detail).catch((err) => console.error("explore:", err));
});
window.addEventListener("starlight:leave-explore", () => started && show(false));

const S = {
  catalog: null, store: null, api: null,
  selected: null,          // catalog object
  hovered: null,
  results: [],
  filters: { stars: true, systems: true, clusters: true, nebulae: true },
  zodiac: null,            // constellation abbreviation being highlighted
  visible: [],             // [{ obj, sx, sy, r }] from the last frame, for picking
  labelAlpha: new Map(),
  tour: null,
  perf: { frameMs: 0, drawn: 0, culledChunks: 0 },
};

function show(on) {
  for (const id of ["explore-panel", "explore-card"]) document.getElementById(id)?.classList.toggle("hidden-mode", !on);
  window.nbPanEnabled = on;
  window.nbHideStarDots = on; // the catalog layer draws every star in one style
  window.nbSetZoomMin(on ? RANGE_ZOOM * 0.85 : 0.5);
}

async function start({ store }) {
  S.store = store;
  S.api = (await import("../api.js")).api;
  buildPanel();
  show(true);
  S.catalog = await openCatalog();
  const inView = S.catalog.rows.filter((r) => r.d != null && r.d <= MAX_LY).length;
  setStatus(`${inView.toLocaleString()} real objects within ${MAX_LY} light years · loading…`);
  window.nbExtraLayers.push(drawLayer);
  window.nbExtraPick = pick;
  await S.catalog.loadAround([0, 0, 0], 12, { maxFromSun: MAX_LY });
  setStatus(`${inView.toLocaleString()} real objects within ${MAX_LY} light years of the Sun`);
  renderFeatured();
  renderZodiac();
  // Keep loading chunks near wherever the camera goes.
  setInterval(() => {
    const cam = window.nbCamera();
    S.catalog.loadAround([cam.fx, cam.fy, cam.fz], undefined, { maxFromSun: MAX_LY }).catch(() => {});
  }, 1500);
}

// ---------- drawing ----------

function absMag(o) {
  const mag = o.g ?? o.hp;
  if (mag == null || !o.d) return null;
  return mag - 5 * Math.log10(o.d / 3.261563777) + 5;
}

function visibleType(o) {
  for (const [group, types] of Object.entries(TYPE_GROUPS)) if (types.includes(o.type)) return S.filters[group];
  return true;
}

// "#ffc184" → "255,193,132" (cached on the object). Stars without a measured colour are white.
function rgbOf(o) {
  if (o._rgb) return o._rgb;
  const h = o.hex;
  o._rgb = h ? `${parseInt(h.slice(1, 3), 16)},${parseInt(h.slice(3, 5), 16)},${parseInt(h.slice(5, 7), 16)}` : "255,255,255";
  return o._rgb;
}

function drawLayer(ctx, { project, W, H, zoom }) {
  const t0 = performance.now();
  S.visible = [];
  let drawn = 0, culled = 0;
  const cam = window.nbCamera();
  const zod = S.zodiac;
  for (const chunk of S.catalog.chunks.values()) {
    // Cull whole chunks whose bounding box can't reach the screen.
    const meta = S.catalog.manifest.chunks[chunk.i];
    const c = [(meta.min[0] + meta.max[0]) / 2, (meta.min[1] + meta.max[1]) / 2, (meta.min[2] + meta.max[2]) / 2];
    const radius = Math.hypot(meta.max[0] - meta.min[0], meta.max[1] - meta.min[1], meta.max[2] - meta.min[2]) / 2;
    const q = project(c[0], c[1], c[2]);
    const rpx = radius * cam.baseUnit * zoom * (q ? q[2] : 1) * 1.5;
    if (q && (q[0] + rpx < 0 || q[0] - rpx > W || q[1] + rpx < 0 || q[1] - rpx > H)) { culled++; continue; }
    for (const o of chunk.objects) {
      // A system record is only a grouping when its stars are catalog components.
      if (o.type === "star system" && o.components?.length) continue;
      if (!visibleType(o) || !inRange(o)) continue;
      const p = project(o.p[0], o.p[1], o.p[2]);
      if (!p) continue;
      const [sx, sy, f, near] = p;
      if (sx < -4 || sy < -4 || sx > W + 4 || sy > H + 4) continue;
      const nearness = Math.max(0.15, Math.min(1, 0.6 + near / (2 * Math.max(17, 600 / zoom))));
      const lit = zod ? o.con === zod : null; // zodiac highlight: true, false, or off
      drawn++;
      if (o.type === "star" || o.type === "star system") {
        const M = absMag(o);
        let r = 2.5 * Math.max(0.6, Math.min(2.6, 1.6 - (M ?? 5) * 0.12)) * Math.min(1.6, Math.max(0.7, f));
        let a = 0.25 + 0.6 * nearness;
        if (lit === true) { r += 1.2; a = 1; }
        else if (lit === false) a *= 0.16;
        ctx.fillStyle = `rgba(${rgbOf(o)},${a.toFixed(3)})`;
        ctx.beginPath(); ctx.arc(sx, sy, r / 2, 0, Math.PI * 2); ctx.fill();
        S.visible.push({ obj: o, sx, sy, r: r + 2, f, nearness, lit });
      } else {
        drawDeepSky(ctx, o, sx, sy, lit === false ? nearness * 0.2 : nearness);
        S.visible.push({ obj: o, sx, sy, r: 6, f, nearness, lit });
      }
    }
  }
  drawSelection(ctx, project);
  drawCatalogLabels(ctx, W, H);
  S.perf = { frameMs: +(performance.now() - t0).toFixed(2), drawn, culledChunks: culled, loadedChunks: S.catalog.chunks.size };
}

function drawDeepSky(ctx, o, x, y, nearness) {
  ctx.strokeStyle = `rgba(255,255,255,${(0.35 + 0.55 * nearness).toFixed(3)})`;
  ctx.lineWidth = 1;
  ctx.beginPath();
  if (o.type === "open cluster") ctx.arc(x, y, 4, 0, Math.PI * 2);
  else if (o.type === "globular cluster") { ctx.arc(x, y, 4, 0, Math.PI * 2); ctx.moveTo(x - 4, y); ctx.lineTo(x + 4, y); ctx.moveTo(x, y - 4); ctx.lineTo(x, y + 4); }
  else { ctx.moveTo(x, y - 5); ctx.lineTo(x + 5, y); ctx.lineTo(x, y + 5); ctx.lineTo(x - 5, y); ctx.closePath(); } // nebulae
  ctx.stroke();
}

function drawSelection(ctx, project) {
  const o = S.selected;
  if (!o?.p) return;
  const p = project(o.p[0], o.p[1], o.p[2]);
  if (!p) return;
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.arc(p[0], p[1], 10, 0, Math.PI * 2); ctx.stroke();
}

function labelFor(v) {
  // The researched nearby systems and the Sun are labelled by the map itself.
  if (v.obj.system || v.obj.type === "star system" || v.obj.id === "actual:sol") return null;
  return v.obj.name || null;
}

function drawCatalogLabels(ctx, W, H) {
  const featuredIds = new Set(S.catalog.featured.map((f) => f.id));
  const resultIds = new Set(S.results.map((r) => r.id));
  const tourId = S.tour?.current?.id;
  const score = (v) => {
    const id = v.obj.id;
    if (S.selected?.id === id) return 1000;
    if (S.hovered === v) return 900;
    if (v.lit === false) return -1;
    if (v.lit === true && v.obj.name) return 750;
    if (tourId === id) return 800;
    if (resultIds.has(id)) return 700;
    if (featuredIds.has(id)) return 500;
    if (!v.obj.name) return -1;
    return 100 * v.nearness - (v.obj.g ?? v.obj.hp ?? 10);
  };
  const candidates = S.visible.filter((v) => labelFor(v) && score(v) > 0).sort((a, b) => score(b) - score(a)).slice(0, LABEL_MAX * 3);
  const taken = [];
  const shown = new Set();
  ctx.font = '11px "Courier New", Courier, monospace';
  ctx.textBaseline = "middle";
  for (const v of candidates) {
    if (shown.size >= LABEL_MAX) break;
    const text = labelFor(v);
    const w = ctx.measureText(text).width;
    const rect = { x: v.sx + 7, y: v.sy - 6, w, h: 12 };
    if (rect.x + w > W - 4) rect.x = v.sx - 7 - w;
    if (taken.some((t) => rect.x < t.x + t.w && t.x < rect.x + rect.w && rect.y < t.y + t.h && t.y < rect.y + rect.h)) continue;
    taken.push(rect);
    shown.add(v.obj.id);
    const prev = S.labelAlpha.get(v.obj.id) || 0;
    const a = Math.min(1, prev + 0.08);
    S.labelAlpha.set(v.obj.id, a);
    ctx.fillStyle = `rgba(255,255,255,${(a * (v.lit ? 0.95 : 0.45 + 0.5 * v.nearness)).toFixed(3)})`;
    ctx.fillText(text, rect.x, rect.y + 6);
  }
  for (const id of [...S.labelAlpha.keys()]) if (!shown.has(id)) { const a = S.labelAlpha.get(id) - 0.08; a <= 0 ? S.labelAlpha.delete(id) : S.labelAlpha.set(id, a); }
}

// ---------- picking ----------

function nearestVisible(pt, maxPx = 9) {
  let best = maxPx, hit = null;
  for (const v of S.visible) {
    if (v.lit === false) continue; // dimmed stars aren't clickable while a sign is highlighted
    const d = Math.hypot(v.sx - pt[0], v.sy - pt[1]) - v.r * 0.5;
    if (d < best) { best = d; hit = v; }
  }
  return hit;
}

function pick(pt, double) {
  const v = nearestVisible(pt);
  if (!v) return false;
  // Stars of the researched nearby systems open the map's system view, as before.
  if (v.obj.id === "actual:sol") { nbVisit(SUN, double); select(v.obj); return true; }
  if (v.obj.system || v.obj.type === "star system") {
    selectById(v.obj.system || v.obj.id, { fly: double });
    return true;
  }
  select(v.obj, { fly: double });
  return true;
}

window.addEventListener("pointermove", (e) => {
  if (!S.catalog || e.target.id !== "sky") return;
  S.hovered = nearestVisible([e.clientX, e.clientY]);
});

// ---------- selection & detail cards ----------

function select(o, { fly = false } = {}) {
  S.selected = o;
  renderCard();
  if (fly && o.p) window.nbFocusPoint(o.p, Math.max(window.nbCamera().zoom, 3));
  S.store.save({ explore: { visited: [o.id], lastFocus: o.id } }).catch(() => {});
}

async function selectById(id, { fly = true } = {}) {
  const o = await S.catalog.getObject(id);
  if (!o || !inRange(o)) return;
  // Nearby researched systems: hand over to the map's own system view.
  const inSystem = o.system || o.type === "star system";
  const near = inSystem && typeof nearStars !== "undefined" ? nearStars.findIndex((s) => sameSystem(s, o)) : -1;
  if (near >= 0) {
    window.nbFocusPoint([nearStars[near].x, nearStars[near].y, nearStars[near].z]);
    nbVisit(near, fly);
  } else if (fly) {
    // Stars: frame their immediate surroundings; clusters: a wider view.
    window.nbFocusPoint(o.p, o.type === "star" ? 1.5 : 0.3);
  }
  select(o);
}

function sameSystem(star, o) {
  const slug = star.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return o.type === "star system" ? o.name === star.name : o.system === `actual:system:${slug}` || (star.name === "Sun" && o.id === "actual:sol");
}

const one = (x) => (Math.round(x * 10) / 10).toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const sig = (x, d = 2) => Number(x.toPrecision(d)).toLocaleString();
const COLOUR_NOTE = "From the star's measured colour (Gaia BP−RP or Hipparcos B−V), converted to a temperature on the Pecaut & Mamajek sequence and shown as the colour of a glowing body at that temperature (Charity 2001). Real starlight is paler than paint: most stars look nearly white to the eye.";
const MASS_NOTE = "How much matter the star has, compared with our Sun. 1 means the same as the Sun (about 333,000 Earths); 0.5 means half. Sources: Gaia DR3 (FLAME), NASA Exoplanet Archive, or our sourced research for nearby systems.";
const ELEMENTS_NOTE = "Normal stars are mostly hydrogen and helium. Astronomers also measure how much of everything heavier (iron, carbon, oxygen…) a star has, compared with the Sun. Source: Gaia DR3 spectra (best-quality only) or the NASA Exoplanet Archive.";
const PLANETS_NOTE = "Confirmed planets: listed as confirmed in the NASA Exoplanet Archive. A few nearby claims are disputed by later studies.";
const POSSIBLE_NOTE = "Possible planets: candidates that haven't been confirmed yet — TESS candidates (NASA Exoplanet Archive) and published claims still being checked. Refuted claims aren't counted.";

function renderCard() {
  const card = document.getElementById("explore-card");
  const o = S.selected;
  card.innerHTML = "";
  if (!o) { card.classList.remove("show"); return; }
  card.append(el("button", { class: "card-close", "aria-label": "close", title: "close", onclick: () => { S.selected = null; renderCard(); } }, "×"));

  const classes = S.catalog.manifest.enrichment?.colourClasses || [];
  const rows = [];
  const row = (k, v, note) => rows.push(el("div", { class: "kv", ...(note && { title: note }) }, el("span", {}, k, note ? el("span", { class: "hint" }, " ?") : null), v));
  const unknown = () => el("span", { class: "unknown" }, "unknown");
  const isSun = o.id === "actual:sol";
  const isStarish = o.type === "star" || o.type === "star system";

  card.append(el("h2", {}, o.name || o.ids?.gaia || o.ids?.hip || o.id));

  row("distance from Earth", el("span", {}, isSun ? "8.3 light minutes" : o.d != null ? `${one(o.d)} light years` : "unknown"));
  if (isStarish) {
    row("colour", o.cc != null
      ? el("span", {}, el("span", { class: "swatch", style: `background:${o.hex}` }), ` ${classes[o.cc]?.name ?? "unknown"}`)
      : unknown(), COLOUR_NOTE);
    const mass = o.massComponents?.length > 1
      ? o.massComponents.map((c) => `${sig(c.mass)}`).join(" + ") + " × the Sun"
      : o.massComponents?.length === 1 ? `${sig(o.massComponents[0].mass)} × the Sun`
      : o.mass ? `${sig(o.mass.v)} × the Sun` : null;
    row("mass", mass ? el("span", {}, mass, o.massComponents?.length > 1 ? el("span", { class: "unknown" }, ` (${o.massComponents.length} stars)`) : null) : unknown(), MASS_NOTE);
    row("confirmed planets", el("span", {}, String(o.plC || 0)), PLANETS_NOTE);
    row("possible planets", el("span", {}, o.plP ? `${o.plP} not yet confirmed` : "none listed"), POSSIBLE_NOTE);
    let elements = null;
    if (o.mh && Number.isFinite(o.mh.v)) {
      const x = 10 ** o.mh.v;
      elements = isSun ? "hydrogen and helium (about 98%), then oxygen, carbon, iron…" : `hydrogen and helium, with heavier elements at about ${sig(x, 2)}× the Sun's level`;
    }
    row("main elements", elements ? el("span", {}, elements) : el("span", { class: "unknown" }, "unknown (not measured)"), ELEMENTS_NOTE);
  }
  row("constellation", el("span", {}, o.conName || (isSun ? "— (it's our Sun)" : "unknown")), "The constellation this object appears in, seen from Earth (official IAU boundaries).");
  row("type", el("span", {}, o.type === "star system" && o.components?.length > 1 ? `star system (${o.components.length} stars)` : o.type));
  card.append(...rows);

  const featured = S.catalog.featured.find((f) => f.id === o.id);
  if (featured) card.append(el("p", { class: "story" }, featured.story), el("p", { class: "note" }, featured.sources.map((u) => el("a", { href: u, target: "_blank", rel: "noopener" }, new URL(u).hostname)).flatMap((a, i) => (i ? [" · ", a] : [a]))));

  // The technical bits, folded away.
  const more = el("details", { class: "more" }, el("summary", {}, "more"));
  for (const v of Object.values(o.ids || {})) more.append(el("div", { class: "kv" }, el("span", {}, "catalog id"), el("span", {}, v)));
  if (o.ra != null) more.append(el("div", { class: "kv" }, el("span", {}, "sky position"), el("span", {}, `RA ${o.ra.toFixed(3)}°, Dec ${o.dec.toFixed(3)}°`)));
  if (o.de) more.append(el("div", { class: "kv" }, el("span", {}, "distance ±"), el("span", {}, `${o.de.toFixed(2)} light years`)));
  if (o.ruwe != null && o.ruwe > 1.4) more.append(el("div", { class: "kv" }, el("span", {}, "note"), el("span", {}, "position less precise (possibly a double star)")));
  const src = S.catalog.manifest.sources[o.src];
  more.append(el("p", { class: "note" }, `Position: ${src?.citation || o.src}.`));
  card.append(more);

  if (o.system || o.type === "star system") card.append(el("div", { class: "nav" }, el("button", { class: "sl-btn", onclick: () => selectById(o.system || o.id) }, "enter system view")));
  card.classList.add("show");
}

// ---------- zodiac ----------

function setZodiac(abbr) {
  S.zodiac = S.zodiac === abbr ? null : abbr;
  renderZodiac();
}

function renderZodiac() {
  const box = document.getElementById("explore-zodiac");
  if (!box || !S.catalog) return;
  box.innerHTML = "";
  const grid = el("div", { class: "zodiac-grid" });
  for (const [abbr, name] of ZODIAC) grid.append(el("button", { class: `sl-btn${S.zodiac === abbr ? " on" : ""}`, onclick: () => setZodiac(abbr), "aria-pressed": S.zodiac === abbr }, name));
  box.append(grid);
  if (S.zodiac) {
    const rows = S.catalog.rows.filter((r) => r.con === S.zodiac && r.d != null && r.d <= MAX_LY && (r.type === "star" || r.type === "star system"));
    const nearest = rows.filter((r) => r.name).sort((a, b) => a.d - b.d)[0];
    const name = ZODIAC.find(([a]) => a === S.zodiac)[1];
    box.append(el("p", { class: "note" }, `${name}: ${rows.length.toLocaleString()} stars within ${MAX_LY} light years.${nearest ? ` Nearest named: ${nearest.name} (${one(nearest.d)} ly).` : ""} Turn the map to see how far apart they really are.`));
  }
}

// ---------- the guide (optional AI) ----------

function guideBox() {
  const out = el("div", { class: "guide-answer" });
  const q = el("textarea", { rows: 2, maxlength: 280, placeholder: "ask about stars, space, or where something is…" });
  const btn = el("button", { class: "sl-btn", onclick: ask }, "ask");
  async function ask() {
    const question = q.value.trim();
    if (question.length < 3) return;
    btn.disabled = true;
    out.textContent = "thinking…";
    try {
      const r = await S.api("POST", "/api/guide", { mode: "explore", question, selectedId: S.selected?.id || null });
      out.innerHTML = "";
      out.append(el("p", {}, r.answer), el("p", { class: "note" }, "AI guide · may be imperfect"));
      for (const a of r.actions || []) if (a.type === "focus") await selectById(a.id);
    } catch (e) {
      out.textContent = e.message;
    } finally {
      btn.disabled = false;
    }
  }
  q.addEventListener("keydown", (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); ask(); } });
  return el("details", { class: "guide" }, el("summary", {}, "ask the guide (AI)"), q, el("div", { class: "nav" }, btn), out);
}

// ---------- panel ----------

function buildPanel() {
  const panel = el("aside", { id: "explore-panel", "aria-label": "explore" });
  const status = el("div", { class: "status note", id: "explore-status" });
  const input = el("input", { type: "search", placeholder: "search: name or catalog id (e.g. Vega, HIP 91262)", "aria-label": "search" });
  const results = el("div", { class: "results", id: "explore-results" });
  input.addEventListener("input", () => runSearch(input.value, results));
  const filters = el("div", { class: "filters" });
  for (const [key, label] of [["stars", "stars"], ["systems", "systems"], ["clusters", "clusters"], ["nebulae", "nebulae"]]) {
    filters.append(el("label", {}, el("input", { type: "checkbox", checked: S.filters[key], onchange: (e) => { S.filters[key] = e.target.checked; } }), ` ${label}`));
  }
  const jumps = el("div", { class: "jumps" },
    el("button", { class: "sl-btn", onclick: () => { nbVisit(SUN, false); window.nbFocusPoint([0, 0, 0], 1); } }, "Sun"),
    el("button", { class: "sl-btn", onclick: () => selectById("actual:system:proxima-centauri") }, "Proxima"),
    el("button", { class: "sl-btn", onclick: () => selectById("actual:system:alpha-centauri") }, "α Cen"),
    el("button", { class: "sl-btn", onclick: () => { window.nbFocusPoint([0, 0, 0], RANGE_ZOOM); } }, `within ${MAX_LY} ly`),
  );
  panel.append(
    el("h2", {}, "explore"), status, input, results,
    el("h3", {}, "zodiac"), el("div", { id: "explore-zodiac" }),
    el("h3", {}, "show"), filters,
    el("h3", {}, "jump to"), jumps,
    el("h3", {}, "featured"), el("div", { id: "explore-featured", class: "list" }),
    el("h3", {}, "tours"), tourList(),
    el("h3", {}, "guide"), guideBox(),
    el("p", { class: "note" }, "drag to turn · shift-drag to pan · scroll or +/− to zoom · click to inspect · double-click to fly there"),
  );
  document.body.append(panel, el("aside", { id: "explore-card", class: "map-card", "aria-live": "polite" }));
}

function setStatus(text) { const s = document.getElementById("explore-status"); if (s) s.textContent = text; }

function runSearch(q, box) {
  box.innerHTML = "";
  if (!S.catalog || q.trim().length < 2) { S.results = []; return; }
  const types = new Set(Object.entries(TYPE_GROUPS).filter(([g]) => S.filters[g]).flatMap(([, t]) => t));
  const hits = S.catalog.search(q, { types, limit: 400 }).filter((r) => r.d != null && r.d <= MAX_LY).slice(0, 12);
  S.results = hits;
  for (const r of hits) {
    box.append(el("button", { class: "result", onclick: () => selectById(r.id) },
      el("span", {}, r.name || r.aliases.split("|")[0]),
      el("span", { class: "sub" }, `${r.type} · ${one(r.d)} light years`)));
  }
  if (!box.children.length) box.append(el("div", { class: "note" }, `no matches within ${MAX_LY} light years`));
}

function renderFeatured() {
  const box = document.getElementById("explore-featured");
  box.innerHTML = "";
  for (const f of S.catalog.featured) {
    const row = f.id && S.catalog.byId.get(f.id);
    if (!(f.id === "actual:sol" || (row && row.d != null && row.d <= MAX_LY))) continue;
    box.append(el("button", { class: "result", title: f.hook, onclick: () => f.id && selectById(f.id) }, el("span", {}, f.name), el("span", { class: "sub" }, f.hook || "")));
  }
}

// ---------- tours ----------

const TOURS = [
  { name: "our neighbourhood", stops: ["actual:sol", "actual:system:proxima-centauri", "actual:system:barnard-s-star", "actual:system:sirius", "actual:system:epsilon-eridani", "actual:system:tau-ceti"] },
  { name: "bright stars nearby", stops: ["actual:system:sirius", "actual:system:altair", "Vega", "Fomalhaut", "Arcturus", "Capella", "Aldebaran", "Regulus"] },
  { name: "nearby planet hosts", stops: ["actual:system:proxima-centauri", "actual:system:epsilon-eridani", "actual:system:teegarden-s-star", "actual:system:gliese-876", "TRAPPIST-1"] },
];

function tourList() {
  const box = el("div", { class: "list" });
  for (const t of TOURS) box.append(el("button", { class: "result", onclick: () => startTour(t) }, el("span", {}, t.name), el("span", { class: "sub" }, `${t.stops.length} stops`)));
  return box;
}

async function resolveStop(stop) {
  if (stop.startsWith("actual:")) return stop;
  const f = S.catalog.featured.find((x) => x.name === stop);
  if (f?.id) return f.id;
  const r = S.catalog.search(stop, { limit: 1 })[0];
  return r?.id || null;
}

async function startTour(t) {
  S.tour = { t, k: 0, current: null };
  const bar = document.getElementById("tour-bar") || document.body.appendChild(el("div", { id: "tour-bar" }));
  const go = async (k) => {
    S.tour.k = (k + t.stops.length) % t.stops.length;
    const id = await resolveStop(t.stops[S.tour.k]);
    S.tour.current = { id };
    if (id === "actual:sol") { nbVisit(SUN, false); window.nbFocusPoint([0, 0, 0], 1.5); S.selected = null; renderCard(); }
    else if (id) await selectById(id);
    const f = S.catalog.featured.find((x) => x.id === id);
    bar.innerHTML = "";
    bar.append(
      el("span", { class: "title" }, `tour · ${t.name} · ${S.tour.k + 1}/${t.stops.length}`),
      el("span", {}, f?.hook || t.stops[S.tour.k]),
      el("button", { class: "sl-btn", onclick: () => go(S.tour.k - 1) }, "‹"),
      el("button", { class: "sl-btn", onclick: () => go(S.tour.k + 1) }, "›"),
      el("button", { class: "sl-btn quiet", onclick: () => { S.tour = null; bar.remove(); } }, "end tour"),
    );
  };
  go(0);
}

// Exposed for the evaluation harness / debugging.
window.starlightExplore = S;
