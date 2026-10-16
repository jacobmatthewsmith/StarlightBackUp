// The solar neighbourhood: stars within ~17 light years of the Sun, drawn as a slowly
// turning 3D map. Positions below are a fallback; star-data.js holds checked values.

// [name, RA (hours), Dec (degrees), distance (ly), class]
// class: 2 = well-known bright star, 1 = ordinary, 0 = faint (brown/white dwarf)
const NEAR_STARS = [
  ["Proxima Centauri", 14.495, -62.68, 4.24, 1],
  ["Alpha Centauri", 14.660, -60.83, 4.37, 2],
  ["Barnard's Star", 17.963, 4.69, 5.96, 1],
  ["Luhman 16", 10.822, -53.32, 6.50, 0],
  ["WISE 0855-0714", 8.919, -7.24, 7.43, 0],
  ["Wolf 359", 10.941, 7.01, 7.86, 1],
  ["Lalande 21185", 11.056, 35.97, 8.31, 1],
  ["Sirius", 6.753, -16.72, 8.60, 2],
  ["Luyten 726-8", 1.650, -17.95, 8.72, 1],
  ["Ross 154", 18.830, -23.84, 9.70, 1],
  ["Ross 248", 23.699, 44.17, 10.30, 1],
  ["Epsilon Eridani", 3.549, -9.46, 10.47, 2],
  ["Lacaille 9352", 23.098, -35.85, 10.72, 1],
  ["Ross 128", 11.796, 0.80, 11.01, 1],
  ["EZ Aquarii", 22.643, -15.30, 11.11, 1],
  ["61 Cygni", 21.115, 38.75, 11.40, 2],
  ["Procyon", 7.655, 5.22, 11.46, 2],
  ["Struve 2398", 18.713, 59.62, 11.49, 1],
  ["Groombridge 34", 0.306, 44.02, 11.62, 1],
  ["DX Cancri", 8.497, 26.78, 11.68, 1],
  ["Epsilon Indi", 22.056, -56.79, 11.87, 2],
  ["Tau Ceti", 1.734, -15.94, 11.91, 2],
  ["GJ 1061", 3.600, -44.51, 11.98, 1],
  ["YZ Ceti", 1.209, -17.00, 12.11, 1],
  ["Luyten's Star", 7.457, 5.23, 12.35, 1],
  ["Teegarden's Star", 2.884, 16.88, 12.50, 1],
  ["Kapteyn's Star", 5.195, -45.02, 12.83, 1],
  ["Lacaille 8760", 21.288, -38.87, 12.95, 1],
  ["SCR 1845-6357", 18.752, -63.96, 13.05, 0],
  ["Kruger 60", 22.466, 57.70, 13.07, 1],
  ["Ross 614", 6.490, -2.81, 13.40, 1],
  ["Wolf 1061", 16.505, -12.66, 14.05, 1],
  ["Wolf 424", 12.555, 9.02, 14.05, 1],
  ["Van Maanen's Star", 0.819, 5.39, 14.07, 0],
  ["Gliese 1", 0.090, -37.36, 14.20, 1],
  ["TZ Arietis", 2.004, 13.05, 14.60, 1],
  ["Gliese 674", 17.478, -46.89, 14.80, 1],
  ["Gliese 687", 17.607, 68.34, 14.80, 1],
  ["Gliese 440", 11.762, -64.84, 15.10, 0],
  ["Gliese 876", 22.888, -14.26, 15.20, 1],
  ["LHS 288", 10.739, -61.21, 15.70, 1],
  ["GJ 1002", 0.112, -7.54, 15.80, 1],
  ["Gliese 412", 11.091, 43.53, 15.80, 1],
  ["Groombridge 1618", 10.189, 49.45, 15.90, 1],
  ["AD Leonis", 10.327, 19.87, 16.20, 1],
  ["Gliese 832", 21.559, -49.01, 16.20, 1],
  ["40 Eridani", 4.254, -7.65, 16.30, 2],
  ["70 Ophiuchi", 18.091, 2.50, 16.60, 2],
  ["Altair", 19.846, 8.87, 16.73, 2],
];

const NB_RADIUS = 17;                 // ly shown once zoomed in
const NB_SPIN = (2 * Math.PI) / 150;  // one full turn every 2.5 minutes
const NB_TILT = 1.0;                  // final tilt away from top-down (radians)
const NB_TILT_TIME = 6;               // seconds to tilt from top-down to NB_TILT
const NB_DRAG = 0.008;                // radians of turn per pixel dragged
const NB_FONT = '11px "Courier New", Courier, monospace';
const NB_LABEL_H = 12;                // label box height, px
const NB_LABEL_FADE = 0.35;           // seconds for a label to fade fully in or out
const NB_PLACE_EVERY = 250;           // ms between label placement passes
const NB_STICKY_PX = 5;               // a showing label gets this much slack before it's bumped
const NB_SETTLE = 1.5;                // 1/s: how fast auto-spin winds down once the viewer takes over
const NB_DAMPING = 4;                 // 1/s: how fast a flicked drag glides to a stop
const NB_MAX_SPIN = 3;                // rad/s: fastest a flick can set the map spinning
const NB_NEAR_BOOST = 2;              // nearest stars drawn this many times larger (farthest: 1x)
const NB_HOVER_PX = 14;               // how close the pointer must be to pick a star

// Map zoom: a multiplier on the map's base scale (~20 px per light year).
const ZOOM_MIN = 0.5;
const ZOOM_MAX = 2e10;                // deep enough to see Mars's moon Phobos
const ZOOM_EASE = 5;                  // how quickly zoom and focus glide (1/s)
const STATS_ZOOM = 8;                 // stats appear once zoomed this far into a star
const STAR_VISIT_ZOOM = 12;           // where double-clicking a new star takes you
const AU_PER_LY = 63241;
const KM_PER_AU = 149597870.7;
const SUN_RADIUS_KM = 695700;
const BODY_FILL = 0.3;                // visiting a planet frames its moons in ~this share of the screen
const BELT_DOTS = 500;                // illustrative dots per belt

// Planets aren't to scale in size (they'd be invisible); orbits are to scale.
// Real periods run from days to centuries, so animation time is compressed:
// a planet with period P days takes PLANET_TIME * P^PLANET_POWER seconds per orbit.
const PLANET_TIME = 4;
const PLANET_POWER = 0.4;

const TASK_TARGET = "Proxima Centauri";

// Scale bar units, largest first (lengths in light years; a year is 365.25 days).
const LY_KM = 9.4607e12;
const SCALE_UNITS = [
  ["light decade", "light decades", 10],
  ["light year", "light years", 1],
  ["light month", "light months", 1 / 12],
  ["light day", "light days", 1 / 365.25],
  ["light hour", "light hours", 1 / 8766],
  ["light minute", "light minutes", 1 / 525960],
  ["light second", "light seconds", 1 / 31557600],
  ...[1e5, 1e4, 1e3, 100, 10].map((km) => [`${km.toLocaleString()} km`, null, km / LY_KM]),
];
const SCALE_MIN_PX = 40, SCALE_MAX_PX = 140;

// View rotation. The map spins and tilts on its own until the viewer first touches
// it; then that motion winds down and the view only moves under their control, with
// a short glide after a flicked drag (like three.js OrbitControls with damping).
const nbView = {
  yaw: 0, pitch: 0,        // the viewer's own rotation
  autoYaw: 0, tiltT: 0,    // accumulated auto-spin and intro-tilt progress
  auto: 1,                 // 1 = auto motion at full speed, easing to 0 after takeover
  takenOver: false,
  vYaw: 0, vPitch: 0,      // drag velocity, rad/s, for the glide
  holding: false,
  lastMove: 0,
  dragged: false,          // retires the "drag to look around" hint
};

function nbTakeOver() {
  nbView.takenOver = true;
}

function nbGrab() {
  nbView.holding = true;
  nbView.vYaw = nbView.vPitch = 0;
  nbView.lastMove = performance.now();
  nbTakeOver();
}

function nbRelease() {
  nbView.holding = false;
  // Released after holding still: no glide.
  if (performance.now() - nbView.lastMove > 80) nbView.vYaw = nbView.vPitch = 0;
}

function nbDrag(dx, dy) {
  const now = performance.now();
  const dt = Math.max(0.008, (now - nbView.lastMove) / 1000);
  nbView.lastMove = now;
  nbView.yaw += dx * NB_DRAG;
  nbView.pitch += dy * NB_DRAG;
  const cap = (v) => Math.max(-NB_MAX_SPIN, Math.min(NB_MAX_SPIN, v));
  nbView.vYaw = cap(0.5 * nbView.vYaw + 0.5 * ((dx * NB_DRAG) / dt));
  nbView.vPitch = cap(0.5 * nbView.vPitch + 0.5 * ((dy * NB_DRAG) / dt));
  nbView.dragged = true;
}

function nbUpdateMotion(dt) {
  if (nbView.takenOver) nbView.auto *= Math.exp(-dt * NB_SETTLE);
  nbView.autoYaw += NB_SPIN * nbView.auto * dt;
  nbView.tiltT += nbView.auto * dt;
  if (!nbView.holding) {
    nbView.yaw += nbView.vYaw * dt;
    nbView.pitch += nbView.vPitch * dt;
    const k = Math.exp(-dt * NB_DAMPING);
    nbView.vYaw *= k;
    nbView.vPitch *= k;
  }
}

let nbPointer = null;
function nbPointerAt(x, y) {
  nbPointer = x == null ? null : [x, y];
}

// Equatorial (J2000) -> galactic coordinates: x toward the galactic centre,
// y along the Sun's orbit, z toward the north galactic pole.
const EQ_TO_GAL = [
  [-0.0548755604, -0.8734370902, -0.4838350155],
  [0.4941094279, -0.4448296300, 0.7469822445],
  [-0.8676661490, -0.1980763734, 0.4559837762],
];

const nearStars = NEAR_STARS.map(([name, ra, dec, d, cls]) => {
  // Prefer the researched (SIMBAD/Gaia-checked) position where there is one.
  const known = typeof STAR_DATA !== "undefined" ? STAR_DATA[name] : null;
  if (known?.ra != null && known?.dec != null && known?.distance_ly != null) {
    ra = known.ra;
    dec = known.dec;
    d = known.distance_ly;
  }
  const a = (ra / 24) * 2 * Math.PI;
  const b = (dec * Math.PI) / 180;
  const e = [d * Math.cos(b) * Math.cos(a), d * Math.cos(b) * Math.sin(a), d * Math.sin(b)];
  const [x, y, z] = EQ_TO_GAL.map((row) => row[0] * e[0] + row[1] * e[1] + row[2] * e[2]);
  return { name, x, y, z, cls };
});
nearStars.push({ name: "Sun", x: 0, y: 0, z: 0, cls: 3 });
const SUN = nearStars.length - 1;

// ---------- bodies: planets, dwarf planets, moons ----------
// Every orbiting thing is a body with an orbit (a in AU, eccentricity, orientation) and
// optional moons. Orbits are drawn face-on to the viewer. Starting positions are random
// (real current positions aren't shown) and animation time is compressed.

function makeBody(o, parent, star) {
  const b = {
    name: o.name,
    label: o.label || o.name,
    kind: o.kind,
    parent,
    star,
    a: o.a,                            // AU
    e: o.e || 0,
    varpi: ((o.varpi || 0) * Math.PI) / 180,
    period: o.period,                  // days
    retro: !!o.retro,
    radiusKm: o.radiusKm ?? null,
    massText: o.massText ?? null,
    mass: o.mass ?? null,              // Earth masses (exoplanets)
    massMin: !!o.massMin,
    moonsKnown: o.moonsKnown ?? null,
    moonsAsOf: o.moonsAsOf ?? null,
    disputed: !!o.disputed,
    note: o.note ?? null,
    phase: Math.random() * Math.PI * 2,
    children: [],
    x: 0, y: 0,                        // position relative to the star, AU (per frame)
  };
  b.children = (o.moons || []).map((m) => makeBody(m, b, star));
  return b;
}

const SOLAR = typeof SOLAR_SYSTEM !== "undefined" ? SOLAR_SYSTEM : null;

for (const st of nearStars) {
  st.info = typeof STAR_DATA !== "undefined" ? STAR_DATA[st.name] || null : null;
  if (st.name === "Sun" && SOLAR) {
    st.bodies = SOLAR.bodies.map((o) => makeBody(o, null, st));
    st.belts = SOLAR.belts.map(makeBelt);
  } else {
    st.bodies = (st.info?.planets || []).map((pl) =>
      makeBody({ ...pl, kind: "exoplanet", a: pl.a, e: 0, period: pl.period, moonsKnown: null }, null, st));
    st.belts = [];
  }
}

// Illustrative belt: dots spread between the belt's edges on gently eccentric orbits.
function makeBelt(belt) {
  const dots = [];
  for (let k = 0; k < BELT_DOTS; k++) {
    const a = belt.inner + Math.random() * (belt.outer - belt.inner);
    dots.push({ a, e: Math.random() * 0.12, varpi: Math.random() * Math.PI * 2, phase: Math.random() * Math.PI * 2, period: 365.25 * Math.pow(a, 1.5) });
  }
  return { ...belt, dots };
}

const allBodies = (st) => {
  const out = [];
  const walk = (b) => { out.push(b); b.children.forEach(walk); };
  st.bodies.forEach(walk);
  return out;
};

// Seconds per animated orbit for a real period in days (compressed so everything moves).
const animPeriod = (days) => PLANET_TIME * Math.pow(days, PLANET_POWER);

// Solve Kepler's equation for the eccentric anomaly.
function kepler(M, e) {
  let E = e < 0.8 ? M : Math.PI;
  for (let k = 0; k < 8; k++) E -= (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
  return E;
}

// Position on an orbit (relative to what it orbits), in AU, at time t seconds.
function orbitPos(o, t) {
  const dir = o.retro ? -1 : 1;
  const M = o.period ? o.phase + (dir * 2 * Math.PI * t) / animPeriod(o.period) : o.phase;
  const E = kepler(((M % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI), o.e);
  const xo = o.a * (Math.cos(E) - o.e);
  const yo = o.a * Math.sqrt(1 - o.e * o.e) * Math.sin(E);
  const c = Math.cos(o.varpi), s = Math.sin(o.varpi);
  return [xo * c - yo * s, xo * s + yo * c];
}

function updateBodies(st, t) {
  const walk = (b) => {
    if (b.a == null) { b.x = b.parent ? b.parent.x : 0; b.y = b.parent ? b.parent.y : 0; }
    else {
      const [x, y] = orbitPos(b, t);
      b.x = (b.parent ? b.parent.x : 0) + x;
      b.y = (b.parent ? b.parent.y : 0) + y;
    }
    b.children.forEach(walk);
  };
  st.bodies.forEach(walk);
}

// Camera: zoom, the star it's centred on, and optionally a body it follows
// (sx, sy: the camera's offset from the star in AU, gliding toward the body).
const nbCam = { zoom: 1, zoomTarget: 1, focus: SUN, fx: 0, fy: 0, fz: 0, body: null, sx: 0, sy: 0, fromX: 0, fromY: 0, followW: 1 };

// Start following a body (or the star itself, with null). The camera blends from where
// it is to an exact lock, so even fast-moving bodies stay centred once it arrives.
function nbFollow(b) {
  nbCam.body = b;
  nbCam.fromX = nbCam.sx;
  nbCam.fromY = nbCam.sy;
  nbCam.followW = 0;
}
let nbScreenMap = null;  // [[dsx, dsy] per +1 ly in x, y, z] at the focus, last frame
let nbBaseUnit = 20;     // map px per light year at zoom 1, from the last frame
let nbLastBodies = [];   // body screen positions from the last frame, for picking

// Per-label fade state; `on` is decided by the placement pass, `alpha` follows it.
const labelState = nearStars.map(() => ({ alpha: 0, on: false }));
let lastPlacement = 0;
let lastHovered = -1;
const labelWidth = new Map();
let nbLastDraw = null;
let nbLastPlaced = [];   // screen positions from the last frame, for picking
let nbActive = false;    // the map is interactive (zoom finished)
let nbShownAt = null;    // when the map became interactive (ms)

function nbEase(x) {
  x = Math.max(0, Math.min(1, x));
  return -(Math.cos(Math.PI * x) - 1) / 2;
}

function overlaps(a, b) {
  return a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
}

// Explore mode widens the zoom range out to the whole catalog (thousands of ly).
let nbZoomMin = ZOOM_MIN;
window.nbSetZoomMin = (z) => { nbZoomMin = z; };

function clampZoom(z) {
  return Math.max(nbZoomMin, Math.min(ZOOM_MAX, z));
}

// Hooks for Explore mode: extra drawing layers, extra picking, and focusing on any point.
window.nbExtraLayers = [];
window.nbExtraPick = null;
window.nbFocusPoint = (pos, zoom) => {
  nbTakeOver();
  nbView.dragged = true;
  if (nbCam.body) nbFollow(null);
  nbCam.target = { x: pos[0], y: pos[1], z: pos[2] };
  if (zoom) nbCam.zoomTarget = clampZoom(zoom);
};
// Pan: move the focus point so the map slides with the pointer (screen dx, dy in px).
// Solves for the smallest world move whose projection matches the drag.
window.nbPanEnabled = false;
window.nbPan = (dx, dy) => {
  if (!nbScreenMap) return;
  const M = [[nbScreenMap[0][0], nbScreenMap[1][0], nbScreenMap[2][0]], [nbScreenMap[0][1], nbScreenMap[1][1], nbScreenMap[2][1]]];
  const a = M[0][0] ** 2 + M[0][1] ** 2 + M[0][2] ** 2, b = M[0][0] * M[1][0] + M[0][1] * M[1][1] + M[0][2] * M[1][2], d = M[1][0] ** 2 + M[1][1] ** 2 + M[1][2] ** 2;
  const det = a * d - b * b;
  if (Math.abs(det) < 1e-12) return;
  const [u, w] = [(-dx * d - -dy * b) / det, (a * -dy - b * -dx) / det];
  const move = [0, 1, 2].map((k) => M[0][k] * u + M[1][k] * w);
  const base = nbCam.target || { x: nbCam.fx, y: nbCam.fy, z: nbCam.fz };
  nbTakeOver();
  if (nbCam.body) nbFollow(null);
  nbCam.target = { x: base.x + move[0], y: base.y + move[1], z: base.z + move[2] };
  nbCam.fx = nbCam.target.x; nbCam.fy = nbCam.target.y; nbCam.fz = nbCam.target.z;
};

window.nbCamera = () => ({ fx: nbCam.fx, fy: nbCam.fy, fz: nbCam.fz, zoom: nbCam.zoom, baseUnit: nbBaseUnit });

// Draw the neighbourhood with the galaxy's camera.
//   ox, oy  screen position of the camera's focus
//   unit    px per light year from the galaxy zoom (tiny in the galaxy view, ~20 at the map)
//   ex, ey  screen directions of galactic x (toward the centre) and y (along the orbit)
//   s       seconds since the galaxy zoom finished (<= 0 while zooming); drives tilt and spin
//   grow    0..1, dots grow from galaxy-dot size to map size
//   labels  0..1, overall label opacity
function drawNeighborhood(ctx, W, H, v) {
  const now = performance.now();
  const dt = nbLastDraw === null ? 0 : Math.min(0.1, (now - nbLastDraw) / 1000);
  nbLastDraw = now;
  if (v.s > 0 && !nbActive) {
    nbActive = true;
    window.dispatchEvent(new CustomEvent("starlight:map-ready"));
    nbShownAt = now;
  }
  nbBaseUnit = v.unit;
  const focusStar = nearStars[nbCam.focus];
  updateBodies(focusStar, now / 1000);
  nbUpdateCamera(dt);

  const unit = v.unit * nbCam.zoom;
  const pxPerAU = unit / AU_PER_LY;
  // Following a body: shift the whole view so it sits at the centre.
  v = { ...v, ox: v.ox - nbCam.sx * pxPerAU, oy: v.oy - nbCam.sy * pxPerAU };
  // Camera distance (ly): fixed at map scale and closer in; zoomed out, it backs off with
  // the view so distant catalog stars stay in front of it.
  const D = (NB_RADIUS * 3.2) / Math.min(1, nbCam.zoom);
  let yaw = 0, pitch = 0;
  if (v.s > 0) {
    nbUpdateMotion(dt);
    const autoPitch = NB_TILT * nbEase(nbView.tiltT / NB_TILT_TIME);
    // Keep the viewer's tilt within straight-down .. edge-on so it never sticks past the limit.
    nbView.pitch = Math.max(-Math.PI / 2 - autoPitch, Math.min(Math.PI / 2 - autoPitch, nbView.pitch));
    yaw = nbView.autoYaw + nbView.yaw;
    pitch = autoPitch + nbView.pitch;
  }
  const cyw = Math.cos(yaw), syw = Math.sin(yaw);
  const cp = Math.cos(pitch), sp = Math.sin(pitch);
  const [exx, exy] = v.ex, [eyx, eyy] = v.ey;
  // Galactic z points along ex × ey (screen x right, y down, z into the screen),
  // which keeps the map's handedness correct.
  const zs = exx * eyy - exy * eyx;

  // Returns [sx, sy, scale, nearness] for a galactic point in ly, or null if behind the camera.
  const project = (x, y, z) => {
    x -= nbCam.fx; y -= nbCam.fy; z -= nbCam.fz;
    const x1 = x * cyw - y * syw;
    const y1 = x * syw + y * cyw;
    const X = x1 * exx + y1 * eyx;
    const Y = x1 * exy + y1 * eyy;
    const Z = z * zs;
    const Y2 = Y * cp - Z * sp;
    const Z2 = Y * sp + Z * cp;
    if (D + Z2 < D * 0.05) return null;
    const f = D / (D + Z2);
    return [v.ox + X * f * unit, v.oy + Y2 * f * unit, f, -Z2];
  };

  // Screen-space basis at the focus (px per ly along each world axis), for panning.
  {
    const o = project(nbCam.fx, nbCam.fy, nbCam.fz);
    if (o) {
      const cols = [[1, 0, 0], [0, 1, 0], [0, 0, 1]].map(([a, b, c]) => {
        const q = project(nbCam.fx + a, nbCam.fy + b, nbCam.fz + c);
        return q ? [q[0] - o[0], q[1] - o[1]] : [0, 0];
      });
      nbScreenMap = cols;
    }
  }

  // Dots get a little larger as you zoom in, so a visited star reads as a star.
  const zoomGrow = 1 + 0.35 * Math.log10(Math.max(1, nbCam.zoom));
  const placed = [];
  nearStars.forEach((st, i) => {
    const q = project(st.x, st.y, st.z);
    if (!q) return;
    const [sx, sy, f, near] = q;
    const base = st.cls === 3 ? 3.5 : st.cls === 2 ? 3 : st.cls === 1 ? 2 : 1.5;
    // Depth cueing: farther stars are greyer and smaller, nearer ones brighter and larger.
    // On top of true perspective (f), near stars get up to NB_NEAR_BOOST x more size;
    // the farthest stay as they were.
    const nearness = Math.max(0, Math.min(1, 0.5 + near / (2 * NB_RADIUS)));
    const depthBoost = 1 + (NB_NEAR_BOOST - 1) * nearness * nearness * v.grow;
    let r = (0.6 + (base - 0.6) * v.grow) * f * depthBoost * (v.s > 0 ? zoomGrow : 1);
    if (st.name === "Sun") r = Math.max(r, (SUN_RADIUS_KM / KM_PER_AU) * pxPerAU); // true size up close
    const depthA = (0.28 + 0.72 * nearness) * (st.cls === 0 ? 0.75 : 1);
    const a = st.cls === 3 ? 1 : 0.65 + (depthA - 0.65) * v.grow;
    placed.push({ st, i, sx, sy, r, a, near, nearness });
  });
  nbLastPlaced = placed;

  ctx.save();
  ctx.textBaseline = "middle";
  ctx.textAlign = "left";

  // Stars, far to near.
  const byDepth = [...placed].sort((p, q) => p.near - q.near);
  for (const p of byDepth) {
    if (p.sx < -10 || p.sy < -10 || p.sx > W + 10 || p.sy > H + 10) continue;
    // In Explore the catalog layer draws these stars in the common style; keep the map's own
    // dot only for the star being visited up close (its planets orbit it).
    if (window.nbHideStarDots && !(p.i === nbCam.focus && !nbCam.target && nbCam.zoom >= STATS_ZOOM)) continue;
    ctx.fillStyle = `rgba(255,255,255,${p.a})`;
    ctx.beginPath();
    ctx.arc(p.sx, p.sy, p.r, 0, Math.PI * 2);
    ctx.fill();
  }

  if (v.s > 0) for (const layer of window.nbExtraLayers) layer(ctx, { project, W, H, unit, zoom: nbCam.zoom, now, dt });

  if (v.s > 0) {
    const focused = placed.find((p) => p.i === nbCam.focus);
    if (focused) {
      drawSystem(ctx, W, H, focused, pxPerAU, now / 1000);
      if (nbCam.focus !== SUN || nbCam.zoom > 1.5) {
        // A thin ring marks the star being visited.
        ctx.strokeStyle = "rgba(255,255,255,0.5)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(focused.sx, focused.sy, focused.r + 6, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  }

  if (v.labels > 0) drawLabels(ctx, W, H, placed, v.labels, dt);

  // A quiet hint until the viewer first drags.
  if (v.s > 0 && !nbView.dragged) {
    ctx.globalAlpha = nbEase((v.s - NB_TILT_TIME) / 1.5);
    ctx.font = '14px "Courier New", Courier, monospace';
    ctx.fillStyle = "#777";
    ctx.textAlign = "center";
    ctx.fillText("drag to look around · double-click a star to visit it", W / 2, H - 24);
  }
  ctx.restore();

  if (v.s > 0) nbUpdateUI(v.s);
}

// Zoom and focus glide toward their targets; zoom moves evenly in log scale.
function nbUpdateCamera(dt) {
  const k = 1 - Math.exp(-dt * ZOOM_EASE);
  nbCam.zoom = Math.exp(Math.log(nbCam.zoom) + (Math.log(nbCam.zoomTarget) - Math.log(nbCam.zoom)) * k);
  const st = nbCam.target || nearStars[nbCam.focus];
  nbCam.fx += (st.x - nbCam.fx) * k;
  nbCam.fy += (st.y - nbCam.fy) * k;
  nbCam.fz += (st.z - nbCam.fz) * k;
  const tx = nbCam.body ? nbCam.body.x : 0, ty = nbCam.body ? nbCam.body.y : 0;
  nbCam.followW += (1 - nbCam.followW) * k;
  if (nbCam.followW > 0.999) nbCam.followW = 1;
  nbCam.sx = nbCam.fromX + (tx - nbCam.fromX) * nbCam.followW;
  nbCam.sy = nbCam.fromY + (ty - nbCam.fromY) * nbCam.followW;
}

// The visited star's system: belts, then each body's orbit, the body and its label,
// recursively for moons. Orbits are to scale; bodies are dots until you're close
// enough for their true size to be bigger.
function drawSystem(ctx, W, H, star, pxPerAU, t) {
  const st = star.st;
  nbLastBodies = [];
  ctx.save();
  ctx.font = NB_FONT;
  ctx.textBaseline = "middle";
  ctx.textAlign = "left";

  for (const belt of st.belts) drawBelt(ctx, W, H, star, belt, pxPerAU, t);

  const visible = (px) => px > -50 && px < Math.max(W, H) + 50;
  const drawBody = (b, parentSx, parentSy, parentR) => {
    if (b.a == null) return;
    const aPx = b.a * pxPerAU;
    const fade = Math.max(0, Math.min(1, (aPx - parentR - 6) / 20));
    if (fade <= 0) return;
    const sx = star.sx + b.x * pxPerAU, sy = star.sy + b.y * pxPerAU;
    const r = Math.max(bodyDot(b), b.radiusKm ? (b.radiusKm / KM_PER_AU) * pxPerAU : 0);

    // Orbit ellipse, with the parent at one focus.
    if (aPx < 1e6) {
      const bPx = aPx * Math.sqrt(1 - b.e * b.e);
      const c = Math.cos(b.varpi), s = Math.sin(b.varpi);
      ctx.globalAlpha = fade * (b.parent ? 0.7 : 1);
      ctx.strokeStyle = b.kind === "planet" || b.kind === "exoplanet" ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.11)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(parentSx - aPx * b.e * c, parentSy - aPx * b.e * s, aPx, bPx, b.varpi, 0, Math.PI * 2);
      ctx.stroke();
    }

    if (visible(sx) && visible(sy)) {
      const minor = b.kind !== "planet" && b.kind !== "exoplanet";
      ctx.globalAlpha = fade;
      ctx.fillStyle = minor ? "#bbb" : "#fff";
      ctx.beginPath();
      ctx.arc(sx, sy, r, 0, Math.PI * 2);
      ctx.fill();
      if (aPx > (b.parent ? 18 : 24)) {
        const followed = nbCam.body === b;
        ctx.font = followed ? `bold ${NB_FONT}` : NB_FONT;
        ctx.fillStyle = followed ? "#fff" : minor ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.8)";
        ctx.fillText(b.disputed ? `${b.label}?` : b.label, sx + r + 4, sy);
      }
      nbLastBodies.push({ body: b, sx, sy, r });
    }
    for (const m of b.children) drawBody(m, sx, sy, r);
  };
  for (const b of st.bodies) drawBody(b, star.sx, star.sy, star.r);

  if (nbCam.body) {
    const hit = nbLastBodies.find((h) => h.body === nbCam.body);
    if (hit) {
      ctx.globalAlpha = 0.5;
      ctx.strokeStyle = "#fff";
      ctx.beginPath();
      ctx.arc(hit.sx, hit.sy, hit.r + 5, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
  ctx.restore();
}

function drawBelt(ctx, W, H, star, belt, pxPerAU, t) {
  const inner = belt.inner * pxPerAU, outer = belt.outer * pxPerAU;
  const fade = Math.max(0, Math.min(1, (inner - star.r - 10) / 40));
  if (fade <= 0 || inner > 3 * Math.max(W, H)) return;
  ctx.globalAlpha = fade * 0.45;
  ctx.fillStyle = "#fff";
  for (const d of belt.dots) {
    const [x, y] = orbitPos(d, t);
    const sx = star.sx + x * pxPerAU, sy = star.sy + y * pxPerAU;
    if (sx < 0 || sy < 0 || sx > W || sy > H) continue;
    ctx.fillRect(sx - 0.5, sy - 0.5, 1, 1);
  }
  // Name the belt once, at its middle radius.
  const mid = ((inner + outer) / 2) * Math.SQRT1_2;
  ctx.globalAlpha = fade * 0.6;
  ctx.fillText(`${belt.name} (illustrative)`, star.sx + mid, star.sy - mid);
}

// Dot size, not to scale: from radius if known, otherwise from mass.
function bodyDot(b) {
  if (b.parent) return b.radiusKm ? Math.max(1.2, Math.min(3, 0.8 + Math.log10(b.radiusKm) * 0.6)) : 1.2;
  const earths = b.radiusKm ? b.radiusKm / 6371 : b.mass != null ? Math.cbrt(b.mass) : 1;
  return Math.max(1.5, Math.min(6, 1.5 + 1.2 * Math.log2(1 + earths)));
}

// The body under a screen point (moons and planets of the visited star), or null.
function nbPickBody(pt) {
  if (!pt) return null;
  let best = 10, hit = null;
  for (const h of nbLastBodies) {
    const d = Math.hypot(h.sx - pt[0], h.sy - pt[1]) - h.r;
    if (d < best) { best = d; hit = h.body; }
  }
  return hit;
}

// Labels, in the style of map engines (Mapbox/MapLibre symbol placement): which labels
// show is decided a few times a second rather than every frame, a showing label gets
// a little slack before it's bumped, every label sits on one fixed side of its star,
// and showing/hiding is a fixed-length eased fade. Priority: hovered, visited, Sun,
// then nearer and better-known stars. Hover any star to see its name.
function drawLabels(ctx, W, H, placed, alpha, dt) {
  ctx.font = NB_FONT;
  const width = (p) => {
    const key = p.st.name;
    if (!labelWidth.has(key)) labelWidth.set(key, ctx.measureText(key).width + (p.st.cls === 3 ? 4 : 0));
    return labelWidth.get(key);
  };
  // Right of the star, unless that runs off the screen.
  const rectFor = (p) => {
    const w = width(p), gap = p.r + 4;
    const x = p.sx + gap + w > W - 4 ? p.sx - gap - w : p.sx + gap;
    return { x, y: p.sy - NB_LABEL_H / 2, w, h: NB_LABEL_H };
  };

  const hovered = nbPick(nbPointer);
  const now = performance.now();
  if (now - lastPlacement > NB_PLACE_EVERY || hovered !== lastHovered) {
    placeLabels(placed, hovered, W, H, rectFor);
    lastPlacement = now;
    lastHovered = hovered;
  }

  const step = dt / NB_LABEL_FADE;
  for (const p of placed) {
    const state = labelState[p.i];
    state.alpha = Math.max(0, Math.min(1, state.alpha + (state.on ? step : -step)));
    if (state.alpha <= 0) continue;
    const r = rectFor(p);
    const strong = p.i === hovered || p.i === nbCam.focus || p.st.cls === 3;
    const grey = strong ? 1 : (0.3 + 0.65 * p.nearness) * (p.st.cls === 0 ? 0.7 : 1);
    ctx.globalAlpha = alpha * nbEase(state.alpha);
    ctx.font = strong ? `bold ${NB_FONT}` : NB_FONT;
    ctx.fillStyle = `rgba(255,255,255,${grey})`;
    ctx.fillText(p.st.name, r.x, r.y + NB_LABEL_H / 2);
  }
  ctx.globalAlpha = 1;
}

function placeLabels(placed, hovered, W, H, rectFor) {
  const score = (p) =>
    p.i === hovered ? 10 : p.i === nbCam.focus ? 9 : p.st.cls === 3 ? 8 :
    p.nearness + (p.st.cls === 2 ? 0.35 : p.st.cls === 0 ? -0.2 : 0);
  const order = [...placed].sort((p, q) => score(q) - score(p));

  // Dots are obstacles too, so labels never cover another star.
  const taken = placed.map((p) => ({ x: p.sx - p.r - 1, y: p.sy - p.r - 1, w: 2 * p.r + 2, h: 2 * p.r + 2, owner: p.i }));
  for (const p of order) {
    const state = labelState[p.i];
    const r = rectFor(p);
    const slack = state.on ? NB_STICKY_PX : 0;
    const test = { x: r.x + slack, y: r.y + slack, w: r.w - 2 * slack, h: r.h - 2 * slack };
    const onScreen = r.x >= 4 && r.y >= 4 && r.x + r.w <= W - 4 && r.y + r.h <= H - 4;
    const fits = onScreen && !taken.some((t) => t.owner !== p.i && overlaps(test, t));
    state.on = fits || p.i === hovered;
    if (state.on) taken.push({ ...r, owner: p.i });
  }
}

// The star under a screen point, or -1.
function nbPick(pt) {
  if (!pt) return -1;
  let best = NB_HOVER_PX, hit = -1;
  for (const p of nbLastPlaced) {
    const d = Math.hypot(p.sx - pt[0], p.sy - pt[1]) - p.r;
    if (d < best) { best = d; hit = p.i; }
  }
  return hit;
}

// ---------- visiting stars ----------

function nbVisit(i, zoomIn) {
  nbTakeOver();
  const changed = i !== nbCam.focus;
  nbCam.focus = i;
  nbCam.target = null;
  if (nbCam.body) nbFollow(null);
  // Double-clicking zooms in 4x, and always at least far enough to see the star's stats.
  if (zoomIn) nbCam.zoomTarget = clampZoom(Math.max(nbCam.zoomTarget * 4, STAR_VISIT_ZOOM));
  nbView.dragged = true; // they've found the controls; retire the hint
  if (changed) nbTaskCheck(nearStars[i]);
}

// Follow a planet or moon. Double-clicking also zooms in far enough to frame its
// moons (or, without moons, to see it as a disc).
function nbVisitBody(b, zoomIn) {
  nbTakeOver();
  nbView.dragged = true;
  if (nbCam.body !== b) nbFollow(b);
  if (!zoomIn) return;
  const W = window.innerWidth, H = window.innerHeight;
  const reach = Math.max(0, ...b.children.map((m) => (m.a || 0) * (1 + (m.e || 0))));
  const pxPerAU = reach > 0
    ? (BODY_FILL * Math.min(W, H)) / reach
    : b.radiusKm ? 25 / (b.radiusKm / KM_PER_AU) : nbCam.zoom * 4 * (nbBaseUnit / AU_PER_LY);
  const fit = (pxPerAU * AU_PER_LY) / nbBaseUnit;
  nbCam.zoomTarget = clampZoom(fit > nbCam.zoomTarget * 1.5 ? fit : nbCam.zoomTarget * 4);
}

function nbZoomBy(factor) {
  nbTakeOver();
  nbCam.zoomTarget = clampZoom(nbCam.zoomTarget * factor);
}

// ---------- task, stats, zoom bar ----------

const ui = {
  task: document.getElementById("task"),
  stats: document.getElementById("stats"),
  toast: document.getElementById("toast"),
  zoombar: document.getElementById("zoombar"),
  slider: document.getElementById("zoom-slider"),
  scaleBar: document.querySelector("#scale .bar"),
  scaleLabel: document.querySelector("#scale .label"),
};
let scaleText = "";
let taskDone = false;
let statsFor = -1;
let statsClosedFor = null;
let toastTimer = null;
let sliderHeld = false;

function toast(text, ms = 5000) {
  ui.toast.textContent = text;
  ui.toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => ui.toast.classList.remove("show"), ms);
}

function nbTaskCheck(st) {
  if (taskDone) return;
  if (st.name === TASK_TARGET) {
    taskDone = true;
    window.dispatchEvent(new CustomEvent("starlight:closest-found", { detail: { name: st.name } }));
    const d = st.info?.distance_ly ?? null;
    ui.task.innerHTML = `<span class="done">✓ find the closest star to the Sun</span>`;
    toast(`You found it. ${st.name} is the closest star to the Sun${d ? `, ${d} light years away` : ""}.`, 7000);
  } else if (st.name === "Alpha Centauri") {
    toast("Close, but there's one star even closer.");
  }
}

const sliderFromZoom = (z) => Math.round((1000 * Math.log(z / nbZoomMin)) / Math.log(ZOOM_MAX / nbZoomMin));
const zoomFromSlider = (v) => nbZoomMin * Math.exp((v / 1000) * Math.log(ZOOM_MAX / nbZoomMin));

function nbUpdateUI(s) {
  if (s > 1.5) {
    if (!ui.task.classList.contains("show")) {
      if (!taskDone) ui.task.textContent = "find the closest star to the Sun";
      ui.task.classList.add("show");
    }
    ui.zoombar.classList.add("show");
  }
  if (!sliderHeld) ui.slider.value = sliderFromZoom(nbCam.zoom);
  updateScaleBar();

  // Stats for the followed body, or for the visited star once zoomed in on it.
  const body = nbCam.body;
  // (In Explore, a focused catalog point has its own detail card instead.)
  const close = !!body || (nbCam.zoom >= STATS_ZOOM && !nbCam.target);
  const key = body || nbCam.focus;
  if (close && statsFor !== key) {
    statsFor = key;
    ui.stats.innerHTML = body ? bodyStatsHTML(body) : statsHTML(nearStars[nbCam.focus]);
    const x = document.createElement("button");
    x.className = "card-close";
    x.textContent = "×";
    x.title = x.ariaLabel = "close";
    x.addEventListener("click", () => { statsClosedFor = key; ui.stats.classList.remove("show"); });
    ui.stats.prepend(x);
  }
  // Closed with × stays closed until the player visits something else.
  ui.stats.classList.toggle("show", close && statsClosedFor !== key);
}

// The largest unit (times 1, 2, 5, 10 or 20) whose length fits the bar, measured at the
// centre of the view.
function updateScaleBar() {
  const pxPerLy = nbBaseUnit * nbCam.zoom;
  let pick = null;
  for (const [one, many, ly] of SCALE_UNITS) {
    for (const n of [20, 10, 5, 2, 1]) {
      const px = n * ly * pxPerLy;
      if (px <= SCALE_MAX_PX && px >= SCALE_MIN_PX) {
        pick = { px, text: many ? `${n} ${n === 1 ? one : many}` : n === 1 ? one : `${(n * ly * LY_KM).toLocaleString()} km` };
        break;
      }
    }
    if (pick) break;
  }
  if (!pick) return;
  ui.scaleBar.style.width = `${Math.round(pick.px)}px`;
  if (pick.text !== scaleText) {
    scaleText = pick.text;
    ui.scaleLabel.textContent = pick.text;
  }
}

const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

function fmtNum(x, digits = 2) {
  if (x == null) return null;
  return Number(x.toPrecision(digits)).toString();
}

function statsHTML(st) {
  const info = st.info;
  const rows = [];
  const row = (k, v) => rows.push(`<dt>${k}</dt><dd>${esc(v)}</dd>`);
  if (st.name === "Sun") {
    row("distance", "you are here");
  } else {
    row("distance", info?.distance_ly != null ? `${info.distance_ly} light years from the Sun` : "unknown");
  }
  const masses = (info?.components || []).filter((c) => c.mass != null);
  if (masses.length) {
    const label = masses.length > 1 ? masses.map((c) => `${fmtNum(c.mass)} (${c.short})`).join(" + ") : fmtNum(masses[0].mass);
    row("mass", `${label} ${masses.length === 1 && masses[0].mass === 1 ? "solar mass" : "solar masses"}`);
  } else {
    row("mass", "unknown");
  }
  const age = info?.age;
  row("age", !age ? "not well known" : age.startsWith(">") ? `over ${age.slice(1)} billion years` : `about ${age} billion years`);
  row("constellation", info?.constellation || (st.name === "Sun" ? "none (it's our Sun)" : "unknown"));
  const planets = st.bodies.filter((b) => b.kind === "planet" || b.kind === "exoplanet");
  const n = planets.length;
  const disputed = planets.filter((pl) => pl.disputed).length;
  row("planets", !n ? "none confirmed" : disputed ? `${n} listed by NASA (${disputed} disputed)` : `${n} confirmed`);
  const dwarfs = st.bodies.filter((b) => b.kind === "dwarf planet").length;
  const candidates = st.bodies.filter((b) => b.kind === "dwarf planet candidate").length;
  if (dwarfs) row("dwarf planets", `${dwarfs} recognised${candidates ? `, plus ${candidates} candidates shown` : ""}`);

  let html = `<h2>${esc(st.name)}</h2><dl>${rows.join("")}</dl>`;
  if (n && st.name !== "Sun") {
    html += `<ul class="planet-list">${planets
      .map((pl) => {
        const bits = [];
        if (pl.a != null) bits.push(`${fmtNum(pl.a, 2)} AU`);
        if (pl.period != null) bits.push(fmtPeriod(pl.period));
        if (pl.mass != null) bits.push(`${pl.massMin ? "\u2265 " : ""}${fmtNum(pl.mass, 2)} Earth masses`);
        if (pl.disputed) bits.push("disputed");
        return `<li>${esc(pl.name)}${bits.length ? " \u00b7 " + esc(bits.join(" \u00b7 ")) : ""}</li>`;
      })
      .join("")}</ul>`;
  }
  if (info?.candidates) html += `<div class="note">${esc(info.candidates)}</div>`;
  if (st.bodies.length) html += `<div class="note">click a planet to follow it; double-click to zoom in. Orbits to scale; sizes and speeds are not</div>`;
  return html;
}

function fmtPeriod(days) {
  if (days < 2) return `${fmtNum(days * 24, 3)} hours`;
  if (days < 1000) return `${fmtNum(days, 3)} days`;
  return `${fmtNum(days / 365.25, 3)} years`;
}

const KIND_TEXT = {
  planet: "planet",
  exoplanet: "exoplanet",
  "dwarf planet": "dwarf planet",
  "dwarf planet candidate": "dwarf planet candidate",
  asteroid: "asteroid",
  moon: "moon",
};

function bodyStatsHTML(b) {
  const rows = [];
  const row = (k, v) => rows.push(`<dt>${k}</dt><dd>${esc(v)}</dd>`);
  const around = b.parent ? b.parent.name : b.star.name;
  row("type", b.parent ? `moon of ${around}` : KIND_TEXT[b.kind] || b.kind);
  if (b.a != null) {
    const dist = b.parent
      ? `${Math.round(b.a * KM_PER_AU).toLocaleString()} km from ${around}`
      : `${fmtNum(b.a, 3)} AU from ${around}`;
    row("distance", b.e >= 0.1 ? `${dist} on average (a stretched orbit, e = ${fmtNum(b.e, 2)})` : dist);
  }
  if (b.period != null) row("one orbit", `${fmtPeriod(b.period)}${b.retro ? " (backwards, retrograde)" : ""}`);
  if (b.radiusKm != null) row("radius", `${Math.round(b.radiusKm).toLocaleString()} km`);
  if (b.massText) row("mass", b.massText);
  else if (b.mass != null) row("mass", `${b.massMin ? "at least " : ""}${fmtNum(b.mass, 3)} Earth masses`);
  if (!b.parent) {
    if (b.moonsKnown != null) row("moons", `${b.moonsKnown} known${b.moonsAsOf ? ` (as of ${b.moonsAsOf})` : ""}`);
    else if (b.kind === "exoplanet") row("moons", "none known");
  }
  let html = `<h2>${esc(b.name)}</h2><dl>${rows.join("")}</dl>`;
  const drawn = b.children.filter((m) => m.a != null);
  if (drawn.length) {
    html += `<div class="note">shown: ${esc(drawn.map((m) => m.name).join(", "))}${b.moonsKnown && b.moonsKnown > drawn.length ? " (the largest)" : ""}</div>`;
  }
  const unplotted = b.children.filter((m) => m.a == null);
  if (unplotted.length) {
    html += `<div class="note">${esc(unplotted.map((m) => m.name).join(", "))}: orbit not yet known, so not drawn</div>`;
  }
  if (b.disputed) html += `<div class="note">disputed: NASA still lists it, but recent studies don't find it</div>`;
  if (b.note) html += `<div class="note">${esc(b.note)}</div>`;
  html += `<div class="note">orbits to scale; positions illustrative; sizes true only up close; speeds compressed</div>`;
  return html;
}

// ---------- input ----------

// Pointer handling on the map: drag to turn, click a star to visit it, double-click
// (or double-tap) to zoom in, scroll to zoom. `active` says whether the map is live.
function nbBindInput(canvas, active) {
  let down = null, moved = false, lastTap = 0, lastTapAt = null;

  canvas.addEventListener("pointerdown", (e) => {
    if (!active()) return;
    down = { x: e.clientX, y: e.clientY, lastX: e.clientX, lastY: e.clientY };
    moved = false;
    nbGrab();
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener("pointermove", (e) => {
    nbPointerAt(e.clientX, e.clientY);
    if (!down) return;
    if (!moved && Math.hypot(e.clientX - down.x, e.clientY - down.y) > 4) {
      moved = true;
      canvas.classList.add("dragging");
    }
    if (moved) {
      if (window.nbPanEnabled && (e.shiftKey || down.pan)) { down.pan = true; window.nbPan(e.clientX - down.lastX, e.clientY - down.lastY); }
      else nbDrag(e.clientX - down.lastX, e.clientY - down.lastY);
    }
    down.lastX = e.clientX;
    down.lastY = e.clientY;
  });
  canvas.addEventListener("pointerleave", () => nbPointerAt(null));
  const end = (e) => {
    if (down && !moved && e.type === "pointerup") {
      const now = performance.now();
      const pt = [e.clientX, e.clientY];
      const double = now - lastTap < 320 && lastTapAt && Math.hypot(pt[0] - lastTapAt[0], pt[1] - lastTapAt[1]) < 24;
      // Explore-mode objects first (catalog, fictional systems), then planets/moons, then stars.
      if (window.nbExtraPick?.(pt, double)) { lastTap = double ? 0 : now; lastTapAt = pt; down = null; canvas.classList.remove("dragging"); nbRelease(); return; }
      const body = nbPickBody(pt);
      const hit = body ? -1 : nbPick(pt);
      if (double) {
        if (body) nbVisitBody(body, true);
        else if (hit >= 0) nbVisit(hit, true);
        else nbZoomBy(3);
        lastTap = 0;
      } else {
        if (body) nbVisitBody(body, false);
        else if (hit >= 0) nbVisit(hit, false);
        lastTap = now;
        lastTapAt = pt;
      }
    }
    if (down) nbRelease();
    down = null;
    canvas.classList.remove("dragging");
  };
  canvas.addEventListener("pointerup", end);
  canvas.addEventListener("pointercancel", end);
  canvas.addEventListener("wheel", (e) => {
    if (!active()) return;
    e.preventDefault();
    nbZoomBy(Math.exp(-e.deltaY * 0.0015));
  }, { passive: false });

  document.getElementById("zoom-in").addEventListener("click", () => nbZoomBy(3));
  document.getElementById("zoom-out").addEventListener("click", () => nbZoomBy(1 / 3));
  document.getElementById("zoom-reset").addEventListener("click", () => {
    nbTakeOver();
    nbCam.focus = SUN;
    nbCam.target = null;
    if (nbCam.body) nbFollow(null);
    nbCam.zoomTarget = 1;
  });
  ui.slider.addEventListener("pointerdown", () => (sliderHeld = true));
  ui.slider.addEventListener("pointerup", () => (sliderHeld = false));
  ui.slider.addEventListener("input", () => {
    nbTakeOver();
    nbCam.zoomTarget = clampZoom(zoomFromSlider(Number(ui.slider.value)));
  });
  window.addEventListener("keydown", (e) => {
    if (!active() || window.starlightPaused || /^(INPUT|TEXTAREA|SELECT)$/.test(e.target?.tagName)) return;
    if (e.key === "+" || e.key === "=") nbZoomBy(2);
    if (e.key === "-" || e.key === "_") nbZoomBy(1 / 2);
  });
}
