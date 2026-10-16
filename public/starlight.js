// starlight welcome screen: a word made of 10,000 dots that drift out into a galaxy.

const N = 10000;
const WORD = "starlight";
const FONT = '"Courier New", Courier, monospace';

const DUR = 3.6;          // seconds each star spends travelling
const RIPPLE = 1.0;       // left-to-right delay across the word
const SCATTER = 0.3;      // extra random delay per star
const SWIRL = Math.PI * 0.6; // how far the whole field turns during the transition

// Orbits. Every star has its own orbit around the centre. Angular speed falls off
// with radius (a flat rotation curve), so inner stars lap outer ones and clumps
// shear out into streams.
const OUTER_PERIOD = 2400; // seconds per orbit at the edge: slow, but perceptible
const MAX_ECC = 0.08;      // how elliptical orbits can be

// The galaxy starts already wound up, as if it had been turning for a while at a
// faster speed, so the clumps have sheared into arcs before we see it.
const SHAPE_PERIOD = 360;  // edge orbit period used for the pre-winding
const SHAPE_AGE = 180;     // seconds of pre-winding at that speed

// Blend between two looks: 0 = loose clouds that shear into streams,
// 1 = defined spiral arms that hold their shape longer.
const ARM_STRENGTH = 0.5;
const CORE = 0.15 + 0.35 * ARM_STRENGTH; // softens the speed-up near the centre; larger = less shear

// Spiral arms (face-on, unit radius)
const PITCH = 1 / Math.tan((18 * Math.PI) / 180); // log-spiral winding
const R0 = 0.03;
const ARM_WIDTH = 0.055 * (2 - ARM_STRENGTH);     // looser arms at lower strength
const ARMS = [
  { offset: 0, main: true },
  { offset: Math.PI, main: true },
  { offset: Math.PI * 0.3, main: false },
  { offset: Math.PI * 0.6, main: false },
  { offset: Math.PI * 1.3, main: false },
  { offset: Math.PI * 1.6, main: false },
];
const MAIN_ARMS = ARMS.filter((a) => a.main);
const SIDE_ARMS = ARMS.filter((a) => !a.main);

const LEVELS = [0.35, 0.65, 1]; // star brightness

// Story beats, advanced by the player with a click, tap, Space, Enter or →.
// Prompts are lists of parts; later parts join the line one at a time.
// `wait` is the pause (ms) before a beat appears once the previous one has left.
const BEATS = [
  { parts: ["This is the Milky Way, our Galactic home"] },
  { parts: ["It's about 100,000 light years across"] },
  { parts: ["that's", "huge"], wait: 900 },
  { box: true },  // "this is our neighborhood" box on the galaxy
  { map: true },  // zoom into the neighbourhood map
];
const MSG_DELAY = 1000;   // ms after the galaxy forms before the first beat
const MSG_FADE = 800;     // ms; matches the CSS transitions on #caption
const MSG_GAP = 400;      // ms of empty screen between beats
const MSG_STAGGER = 1200; // ms between parts of the same prompt
const INPUT_LOCK = 350;   // ms after a beat is fully shown before input can advance it
const HINT_AFTER = 4000;  // ms idle on the first beat before "click to continue" appears

// Zoom into the solar neighbourhood.
const SUN_RADIUS = 0.52;  // the Sun is ~26,000 ly out of 50,000
const BOX_PX = 26;        // half-size of the zoom box, px
const BOX_IN = 0.8;       // s for the box and label to fade in
const ZOOM_TIME = 6;      // s of zooming, galaxy scale down to light years
const GAL_LY = 50000;     // galaxy radius in light years: sets the true zoom factor

// Stars around the Sun that only resolve as we zoom: spread evenly in log-distance,
// so every stage of the zoom has stars streaming past. Kept beyond the map's edge.
const FIELD_N = 3000;
const FIELD_MIN_LY = 45;
const FIELD_MAX_LY = 4000;
const FIELD_RESOLVE_PX = 6;  // fade in once this far from the Sun on screen
const NB_LABEL = "this is our neighborhood";
const MORE = "\u25B8";    // ▸ marker shown when a beat is waiting for input

const canvas = document.getElementById("sky");
const ctx = canvas.getContext("2d");

let W = 0, H = 0;
let phase = "word";       // word -> forming -> galaxy
let clickTime = 0;
let wordDot = 1.3;        // dot size in the word, scaled to dot density
let boxStart = null;      // when the neighbourhood box appeared (ms)
let zoomStart = null;     // when the zoom began (ms)
let sunStar = 0;          // the galaxy star standing in for the Sun

// Per-star data
const textX = new Float32Array(N);   // offset from screen centre, px
const textY = new Float32Array(N);
const galR = new Float32Array(N);    // mean orbital radius, 0..1
const galA = new Float32Array(N);    // angle at time 0
const omega = new Float32Array(N);   // angular speed, rad/s
const ecc = new Float32Array(N);     // orbital eccentricity
const eccP = new Float32Array(N);    // phase along the ellipse
const level = new Uint8Array(N);
const size = new Float32Array(N);
const delay = new Float32Array(N);
const endX = new Float32Array(N);    // landing point, pre-rotated back by SWIRL
const endY = new Float32Array(N);
const px = new Float32Array(N);
const py = new Float32Array(N);
const prog = new Float32Array(N);    // eased travel progress, 0 in the word, 1 in the galaxy

// Field stars around the Sun (light years, angle in the galactic plane, brightness).
const fieldR = new Float32Array(FIELD_N);
const fieldA = new Float32Array(FIELD_N);
const fieldB = new Float32Array(FIELD_N);
for (let i = 0; i < FIELD_N; i++) {
  fieldR[i] = FIELD_MIN_LY * Math.exp(Math.random() * Math.log(FIELD_MAX_LY / FIELD_MIN_LY));
  fieldA[i] = Math.random() * Math.PI * 2;
  fieldB[i] = 0.3 + 0.7 * Math.random() * Math.random();
}

// Stars grouped by brightness so fillStyle changes only a few times per frame.
let buckets = [];

// ---------- helpers ----------

function gauss() {
  return Math.sqrt(-2 * Math.log(1 - Math.random())) * Math.cos(2 * Math.PI * Math.random());
}

// Gentle at both ends; smoother than cubic.
function easeInOutSine(x) {
  return -(Math.cos(Math.PI * x) - 1) / 2;
}

// Disk radius: exponential falloff, truncated at the edge.
function diskRadius(min, scale) {
  let r;
  do r = min - Math.log(1 - Math.random()) * scale;
  while (r > 1);
  return r;
}

// Centre line of an arm, with some wander so it isn't a perfect spiral.
function armAngle(arm, r) {
  const o = arm.offset;
  return o + PITCH * Math.log(r / R0) + 0.25 * Math.sin(r * 14 + o * 2) + 0.1 * Math.sin(r * 37 + o * 5);
}

function pickArm() {
  const list = Math.random() < 0.6 ? MAIN_ARMS : SIDE_ARMS;
  return list[Math.floor(Math.random() * list.length)];
}

// Radius on an arm; side arms only exist further out and come in fragments.
function armRadius(arm) {
  if (arm.main) return diskRadius(0.07, 0.32);
  let r;
  do r = 0.2 + Math.random() * 0.75;
  while (Math.sin(r * 26 + arm.offset * 3) < -0.4);
  return r;
}

// A point on a random arm, spread across the arm's width.
function armPoint() {
  const arm = pickArm();
  const r = armRadius(arm);
  return { r, a: armAngle(arm, r) + (gauss() * ARM_WIDTH * 0.6) / r };
}

// ---------- the word ----------

function fontSize() {
  // Courier glyphs are 0.6em wide; fill ~88% of the width, capped for big screens.
  return Math.min((W * 0.88) / (WORD.length * 0.6), 260);
}

// Scatter the 10,000 dots at random inside the letters.
function sampleWord() {
  if (W === 0 || H === 0) return; // not laid out yet; resize() will call again
  const off = document.createElement("canvas");
  off.width = W;
  off.height = H;
  const o = off.getContext("2d");
  o.font = `bold ${fontSize()}px ${FONT}`;
  o.textAlign = "center";
  o.textBaseline = "middle";
  o.fillText(WORD, W / 2, H / 2);
  const data = o.getImageData(0, 0, W, H).data;

  const pts = [];
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (data[(y * W + x) * 4 + 3] > 128) pts.push(x, y);
    }
  }
  const area = pts.length / 2;
  // Keep dots smaller than their average spacing so the gaps stay visible.
  wordDot = Math.max(0.7, Math.min(1.4, Math.sqrt(area / N) * 0.5));

  let minX = Infinity, maxX = -Infinity;
  for (let i = 0; i < N; i++) {
    const k = Math.floor(Math.random() * area) * 2;
    textX[i] = pts[k] + Math.random() - W / 2;
    textY[i] = pts[k + 1] + Math.random() - H / 2;
    minX = Math.min(minX, textX[i]);
    maxX = Math.max(maxX, textX[i]);
  }
  for (let i = 0; i < N; i++) {
    delay[i] = RIPPLE * ((textX[i] - minX) / (maxX - minX)) + SCATTER * Math.random();
  }
}

// ---------- the galaxy ----------

function buildGalaxy() {
  const counts = {
    core: 1200,
    clumped: 4800,
    arm: Math.round(3000 * ARM_STRENGTH),
  }; // the rest is a smooth disk
  let i = 0;

  // Dense core.
  for (let n = 0; n < counts.core; n++, i++) {
    galR[i] = Math.min(1, Math.abs(gauss()) * 0.07);
    galA[i] = Math.random() * Math.PI * 2;
    level[i] = Math.random() < 0.6 ? 2 : 1;
  }

  // Loose clouds of stars, stretched a little along their orbits. Shear pulls
  // them out into arcs over time. Some sit on the arms, the rest anywhere.
  const clouds = [];
  for (let n = 0; n < 80; n++) {
    if (Math.random() < ARM_STRENGTH) {
      const p = armPoint();
      clouds.push({ r: Math.max(0.1, p.r), a: p.a });
    } else {
      clouds.push({ r: diskRadius(0.1, 0.32), a: Math.random() * Math.PI * 2 });
    }
  }
  for (let n = 0; n < counts.clumped; n++, i++) {
    const c = clouds[n % clouds.length];
    galR[i] = Math.min(1, Math.max(0.02, c.r + gauss() * 0.015));
    galA[i] = c.a + (gauss() * 0.035) / c.r;
    level[i] = Math.random() < 0.5 ? 2 : 1;
  }

  // Stars tracing the spiral arms.
  for (let n = 0; n < counts.arm; n++, i++) {
    const p = armPoint();
    galR[i] = Math.min(1, p.r);
    galA[i] = p.a;
    level[i] = Math.random() < 0.5 ? 1 : Math.random() < 0.5 ? 2 : 0;
  }

  // Smooth disk.
  for (; i < N; i++) {
    galR[i] = diskRadius(0.03, 0.33);
    galA[i] = Math.random() * Math.PI * 2;
    level[i] = Math.random() < 0.6 ? 0 : 1;
  }

  const outer = (2 * Math.PI) / OUTER_PERIOD;
  const shapeOuter = (2 * Math.PI) / SHAPE_PERIOD;
  for (let j = 0; j < N; j++) {
    galA[j] += ((shapeOuter * (1 + CORE)) / (galR[j] + CORE)) * SHAPE_AGE;
    omega[j] = (outer * (1 + CORE)) / (galR[j] + CORE);
    ecc[j] = Math.random() * MAX_ECC;
    eccP[j] = Math.random() * Math.PI * 2;
    size[j] = Math.random() < 0.02 ? 1.9 : 1.2;
    if (Math.random() < 0.02) level[j] = 2;
  }

  buckets = LEVELS.map(() => []);
  for (let j = 0; j < N; j++) buckets[level[j]].push(j);

  // Stand-in for the Sun: a clump or arm star about halfway out.
  let best = Infinity;
  for (let j = counts.core; j < counts.core + counts.clumped + counts.arm; j++) {
    const d = Math.abs(galR[j] - SUN_RADIUS);
    if (d < best) { best = d; sunStar = j; }
  }
}

function galaxyScale() {
  return Math.min(W, H) * 0.46;
}

// Screen offset from centre of star i at time t (s since click): a near-circular
// orbit with a small epicycle, so each orbit is slightly elliptical.
const KAPPA = Math.SQRT2; // epicycle frequency / orbital frequency for a flat rotation curve
function galaxyPos(i, t, S, out) {
  const w = omega[i];
  const phase = KAPPA * w * t + eccP[i];
  const r = galR[i] * (1 - ecc[i] * Math.cos(phase)) * S;
  const a = galA[i] + w * t + ((2 * ecc[i]) / KAPPA) * Math.sin(phase);
  out[0] = r * Math.cos(a);
  out[1] = r * Math.sin(a);
}

// Each star travels in a gently turning frame: it moves along a straight line in that
// frame while the frame turns by SWIRL, so the whole word swirls out together.
// The landing point is pre-rotated back by SWIRL so it ends exactly on the orbit.
function planPaths() {
  const S = galaxyScale();
  const p = [0, 0];
  const c = Math.cos(-SWIRL), s = Math.sin(-SWIRL);
  for (let i = 0; i < N; i++) {
    galaxyPos(i, delay[i] + DUR, S, p);
    endX[i] = p[0] * c - p[1] * s;
    endY[i] = p[0] * s + p[1] * c;
  }
}

// ---------- drawing ----------

function drawHint(alpha) {
  if (alpha <= 0) return;
  ctx.globalAlpha = alpha;
  ctx.font = `14px "Courier New", Courier, monospace`;
  ctx.textAlign = "center";
  ctx.fillStyle = "#777";
  ctx.fillText("click to begin", W / 2, H / 2 + fontSize() * 0.75);
  ctx.globalAlpha = 1;
}

function computePositions(t) {
  const S = galaxyScale();
  const cx = W / 2, cy = H / 2;
  const p = [0, 0];
  for (let i = 0; i < N; i++) {
    const u = (t - delay[i]) / DUR;
    if (u >= 1) {
      galaxyPos(i, t, S, p);
      px[i] = cx + p[0];
      py[i] = cy + p[1];
      prog[i] = 1;
    } else if (u <= 0) {
      px[i] = cx + textX[i];
      py[i] = cy + textY[i];
      prog[i] = 0;
    } else {
      const e = easeInOutSine(u);
      prog[i] = e;
      const x = textX[i] + (endX[i] - textX[i]) * e;
      const y = textY[i] + (endY[i] - textY[i]) * e;
      const a = SWIRL * e;
      const c = Math.cos(a), s = Math.sin(a);
      px[i] = cx + x * c - y * s;
      py[i] = cy + x * s + y * c;
    }
  }
}

// Draws the galaxy, optionally magnified by `zoom` about the point (fx, fy),
// which is carried to (tx, ty) on screen.
function drawStars(alpha = 1, zoom = 1, fx = 0, fy = 0, tx = 0, ty = 0) {
  for (let k = 0; k < buckets.length; k++) {
    ctx.fillStyle = `rgba(255,255,255,${LEVELS[k] * alpha})`;
    for (const i of buckets[k]) {
      if (i === sunStar && phase === "galaxy") continue; // the neighbourhood's Sun stands here
      const s = size[i];
      const x = zoom === 1 ? px[i] : tx + (px[i] - fx) * zoom;
      const y = zoom === 1 ? py[i] : ty + (py[i] - fy) * zoom;
      if (x < -2 || y < -2 || x > W + 2 || y > H + 2) continue;
      ctx.fillRect(x - s / 2, y - s / 2, s, s);
    }
  }
}

// ---------- the zoom into our neighbourhood ----------

function clamp01(x) {
  return Math.max(0, Math.min(1, x));
}

// Pulsing opacity for the "waiting for input" marker.
function pulse(now) {
  return 0.25 + 0.75 * (0.5 + 0.5 * Math.sin((now / 1600) * 2 * Math.PI));
}

function drawField(ox, oy, ex, ey, unit, alpha) {
  if (alpha <= 0) return;
  ctx.fillStyle = "#fff";
  for (let i = 0; i < FIELD_N; i++) {
    const d = fieldR[i] * unit;
    if (d < FIELD_RESOLVE_PX) continue;
    const c = Math.cos(fieldA[i]), s = Math.sin(fieldA[i]);
    const x = ox + (c * ex[0] + s * ey[0]) * d;
    const y = oy + (c * ex[1] + s * ey[1]) * d;
    if (x < -2 || y < -2 || x > W + 2 || y > H + 2) continue;
    ctx.globalAlpha = alpha * fieldB[i] * clamp01((d - FIELD_RESOLVE_PX) / (6 * FIELD_RESOLVE_PX));
    ctx.fillRect(x - 0.6, y - 0.6, 1.2, 1.2);
  }
  ctx.globalAlpha = 1;
}

function drawZoomBox(x, y, half, alpha) {
  if (alpha <= 0) return;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 1;
  ctx.strokeRect(Math.round(x - half) + 0.5, Math.round(y - half) + 0.5, Math.round(half * 2), Math.round(half * 2));
  ctx.restore();
}

function drawBoxLabel(x, y, alpha, ready, now) {
  if (alpha <= 0) return;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.font = `bold 17px ${FONT}`;
  ctx.fillStyle = "#fff";
  ctx.shadowColor = "#000";
  ctx.shadowBlur = 6;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  const w = ctx.measureText(NB_LABEL).width;
  const full = ctx.measureText(`${NB_LABEL} ${MORE}`).width;
  // Beside the box, on whichever side has room.
  const left = x + BOX_PX + 12 + full < W - 10 ? x + BOX_PX + 12 : x - BOX_PX - 12 - full;
  ctx.fillText(NB_LABEL, left, y);
  if (ready) {
    ctx.globalAlpha = alpha * pulse(now);
    ctx.fillText(` ${MORE}`, left + w, y);
  }
  ctx.restore();
}

const mapTime = (now) => (zoomStart === null ? -1 : (now - zoomStart) / 1000 - ZOOM_TIME);

// The galaxy and our neighbourhood share one camera. The nearby stars always sit
// around the Sun at their true scale (all inside one pixel in the galaxy view), so
// zooming in simply magnifies them; nothing is swapped in.
function drawScene(t, now) {
  const S = galaxyScale();
  const p = [0, 0];
  galaxyPos(sunStar, t, S, p);
  const len = Math.hypot(p[0], p[1]) || 1;
  const sx = W / 2 + p[0], sy = H / 2 + p[1];
  const ex = [-p[0] / len, -p[1] / len]; // galactic x: toward the centre
  const ey = [-p[1] / len, p[0] / len];  // galactic y: along the Sun's orbit

  const z = zoomStart === null ? 0 : (now - zoomStart) / 1000;
  const k = easeInOutSine(clamp01(z / ZOOM_TIME)); // zoom progress, even in log scale
  const s0 = S / GAL_LY;                           // px per ly, galaxy view
  const s1 = (Math.min(W, H) * 0.42) / NB_RADIUS;  // px per ly, neighbourhood view
  const unit = Math.exp(Math.log(s0) + (Math.log(s1) - Math.log(s0)) * k);
  const zoom = unit / s0;
  const tx = sx + (W / 2 - sx) * k, ty = sy + (H / 2 - sy) * k; // the Sun drifts to centre

  drawStars(1 - clamp01((k - 0.9) / 0.1), zoom, sx, sy, tx, ty);
  drawField(tx, ty, ex, ey, unit, clamp01((zoom - 1.5) / 3));

  if (boxStart !== null) {
    const boxIn = clamp01((now - boxStart) / 1000 / BOX_IN);
    drawZoomBox(tx, ty, BOX_PX * zoom, boxIn * (1 - clamp01((zoom - 4) / 8)));
    drawBoxLabel(sx, sy, boxIn * (1 - clamp01(z / 0.6)), zoomStart === null && revealed, now);
  }

  const mapS = mapTime(now);
  if (mapS > 0) canvas.classList.add("draggable");
  drawNeighborhood(ctx, W, H, {
    ox: tx, oy: ty, unit, ex, ey,
    s: mapS,
    grow: k,
    labels: clamp01(mapS / 1.2), // names arrive once the zoom has landed
  });
}

// In the word every dot is full brightness and the same size so the letters read
// clearly; in flight each dot eases toward its own galaxy size and brightness.
function drawTravelling() {
  ctx.fillStyle = "#fff";
  for (let i = 0; i < N; i++) {
    const e = prog[i];
    const d = wordDot + (size[i] - wordDot) * e;
    ctx.globalAlpha = 1 + (LEVELS[level[i]] - 1) * e;
    ctx.fillRect(px[i] - d / 2, py[i] - d / 2, d, d);
  }
  ctx.globalAlpha = 1;
}

const FORM_TIME = RIPPLE + SCATTER + DUR;

// The app shell pauses drawing while Game mode covers the screen.
window.starlightPaused = false;

function frame(now) {
  if (window.starlightPaused) {
    requestAnimationFrame(frame);
    return;
  }
  ctx.clearRect(0, 0, W, H);

  if (phase === "word") {
    computePositions(-1);
    drawTravelling();
    drawHint(1);
  } else {
    const t = (now - clickTime) / 1000;
    computePositions(t);
    if (phase === "forming") drawTravelling();
    else drawScene(t, now);
    drawHint(1 - t / 0.4);
    if (phase === "forming" && t > FORM_TIME) {
      phase = "galaxy";
      canvas.classList.add("formed");
      setTimeout(() => showBeat(0), MSG_DELAY);
    }
  }
  requestAnimationFrame(frame);
}

// ---------- story beats ----------

const caption = document.getElementById("caption");
const hint = document.getElementById("hint");
hint.textContent = matchMedia("(pointer: coarse)").matches ? "tap to continue" : "click to continue";

let beat = -1;            // index into BEATS on screen
let revealed = false;     // the current beat has fully appeared
let revealedAt = 0;
let leaving = false;      // the current beat is fading out
let hasAdvanced = false;  // the player has advanced at least once
let timers = [];          // pending reveal steps for the current beat

function later(fn, ms) {
  timers.push(setTimeout(fn, ms));
}

function finishReveal() {
  timers.forEach(clearTimeout);
  timers = [];
  caption.querySelectorAll("span:not(.more)").forEach((span) => span.classList.add("show"));
  caption.classList.add("ready");
  revealed = true;
  revealedAt = performance.now();
}

function showBeat(i) {
  beat = i;
  revealed = false;
  leaving = false;
  const b = BEATS[i];

  if (b.parts) {
    caption.textContent = "";
    caption.classList.remove("ready");
    const spans = b.parts.map((part, k) => {
      const span = document.createElement("span");
      span.textContent = (k > 0 ? " " : "") + part;
      caption.appendChild(span);
      return span;
    });
    const more = document.createElement("span");
    more.className = "more";
    more.textContent = ` ${MORE}`;
    more.setAttribute("aria-hidden", "true");
    caption.appendChild(more);
    spans[0].classList.add("show");
    caption.classList.add("show");
    spans.slice(1).forEach((span, k) => later(() => span.classList.add("show"), MSG_STAGGER * (k + 1)));
    later(finishReveal, MSG_FADE + MSG_STAGGER * (b.parts.length - 1));
  } else if (b.box) {
    boxStart = performance.now();
    later(finishReveal, BOX_IN * 1000);
  } else if (b.map) {
    zoomStart = performance.now();
  }

  // Teach the control once, and only if the player seems to be waiting.
  if (i === 0) setTimeout(() => !hasAdvanced && hint.classList.add("show"), HINT_AFTER);
}

// One input: finish the current reveal if it's still appearing, otherwise move on.
function advance() {
  if (beat < 0 || leaving) return;
  const b = BEATS[beat];
  if (b.map) return;
  if (!revealed) {
    if (b.box) boxStart = performance.now() - BOX_IN * 1000;
    finishReveal();
    return;
  }
  if (performance.now() - revealedAt < INPUT_LOCK) return;

  hasAdvanced = true;
  hint.classList.remove("show");
  const next = beat + 1;
  if (b.parts) {
    leaving = true;
    caption.classList.remove("show", "ready");
    setTimeout(() => showBeat(next), MSG_FADE + (BEATS[next].wait ?? MSG_GAP));
  } else {
    showBeat(next);
  }
}

// ---------- events ----------

function begin() {
  if (phase !== "word") return;
  planPaths();
  clickTime = performance.now();
  phase = "forming";
}

// Jump straight to the neighbourhood map (returning players, Explore mode).
function skipToMap() {
  if (W === 0) sampleWord();
  if (phase === "word") planPaths();
  const now = performance.now();
  clickTime = now - 60000;
  phase = "galaxy";
  canvas.classList.add("formed");
  boxStart = now - 60000;
  zoomStart = now - (ZOOM_TIME + 30) * 1000;
  beat = BEATS.length - 1;
  revealed = true;
  caption.classList.remove("show", "ready");
  hint.classList.remove("show");
}
window.starlightSkipToMap = skipToMap;

canvas.addEventListener("click", () => (phase === "word" ? begin() : advance()));
// Keys typed into forms (or while Game mode covers the map) aren't story input.
const typingTarget = (e) => /^(INPUT|TEXTAREA|SELECT|BUTTON)$/.test(e.target?.tagName) || e.target?.isContentEditable;
window.addEventListener("keydown", (e) => {
  if (typingTarget(e) || window.starlightPaused) return;
  if (e.key !== "Enter" && e.key !== " " && e.key !== "ArrowRight") return;
  e.preventDefault();
  phase === "word" ? begin() : advance();
});

// The neighbourhood map handles its own input (drag, click, zoom) once it's live.
const mapVisible = () => mapTime(performance.now()) > 0;
nbBindInput(canvas, mapVisible);

function resize() {
  const dpr = window.devicePixelRatio || 1;
  W = window.innerWidth;
  H = window.innerHeight;
  canvas.width = Math.round(W * dpr);
  canvas.height = Math.round(H * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  if (phase === "word") sampleWord();
}

window.addEventListener("resize", resize);
buildGalaxy();
resize();
canvas.focus();
requestAnimationFrame(frame);
