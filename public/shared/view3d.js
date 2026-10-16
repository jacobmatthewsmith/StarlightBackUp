// A small shared 3D canvas view: orbit camera (drag to turn, scroll to zoom),
// perspective projection, and drawing helpers. Used by the Level 1 and Level 2 labs
// and the Explore system view. Colours follow the game's rules: white objects,
// red for gravitational acceleration, yellow for photons.

export const GRAVITY_RED = "255,59,59";
export const PHOTON_YELLOW = "255,216,74";

export function createView(canvas, { distance = 10, yaw = 0.6, pitch = 0.5, minDist = 0.1, maxDist = 1e4 } = {}) {
  const ctx = canvas.getContext("2d");
  const view = { canvas, ctx, yaw, pitch, distance, W: 0, H: 0, onDraw: null, raf: 0, alive: true, center: [0, 0, 0] };
  let drag = null;

  function resize() {
    const dpr = window.devicePixelRatio || 1;
    const r = canvas.getBoundingClientRect();
    view.W = r.width;
    view.H = r.height;
    canvas.width = Math.max(1, Math.round(r.width * dpr));
    canvas.height = Math.max(1, Math.round(r.height * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);
  resize();

  canvas.addEventListener("pointerdown", (e) => {
    drag = { x: e.clientX, y: e.clientY };
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener("pointermove", (e) => {
    if (!drag) return;
    view.yaw += (e.clientX - drag.x) * 0.008;
    view.pitch = Math.max(-1.5, Math.min(1.5, view.pitch + (e.clientY - drag.y) * 0.008));
    drag = { x: e.clientX, y: e.clientY };
  });
  const end = () => (drag = null);
  canvas.addEventListener("pointerup", end);
  canvas.addEventListener("pointercancel", end);
  canvas.addEventListener("wheel", (e) => {
    e.preventDefault();
    view.distance = Math.max(minDist, Math.min(maxDist, view.distance * Math.exp(e.deltaY * 0.0012)));
  }, { passive: false });
  canvas.style.touchAction = "none";
  canvas.style.cursor = "grab";

  // World (x, y, z; z up) -> screen. Returns [sx, sy, scale, depth] or null if behind.
  view.project = ([x, y, z]) => {
    x -= view.center[0]; y -= view.center[1]; z -= view.center[2];
    const cy = Math.cos(view.yaw), sy = Math.sin(view.yaw);
    const cp = Math.cos(view.pitch), sp = Math.sin(view.pitch);
    const x1 = x * cy - y * sy;
    const y1 = x * sy + y * cy;
    const depth = y1 * cp - z * sp;      // toward the viewer is negative
    const up = y1 * sp + z * cp;
    const camZ = view.distance + depth;
    if (camZ < view.distance * 0.05) return null;
    const f = (Math.min(view.W, view.H) * 0.9) / camZ;
    return [view.W / 2 + x1 * f, view.H / 2 - up * f, f, camZ];
  };

  view.line = (a, b, style, width = 1) => {
    const p = view.project(a), q = view.project(b);
    if (!p || !q) return;
    ctx.strokeStyle = style;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(p[0], p[1]);
    ctx.lineTo(q[0], q[1]);
    ctx.stroke();
  };

  view.path = (points, style, width = 1) => {
    ctx.strokeStyle = style;
    ctx.lineWidth = width;
    ctx.beginPath();
    let started = false;
    for (const pt of points) {
      const p = view.project(pt);
      if (!p) { started = false; continue; }
      started ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]);
      started = true;
    }
    ctx.stroke();
  };

  view.dot = (pt, r, style) => {
    const p = view.project(pt);
    if (!p) return null;
    ctx.fillStyle = style;
    ctx.beginPath();
    ctx.arc(p[0], p[1], r, 0, Math.PI * 2);
    ctx.fill();
    return p;
  };

  view.label = (pt, text, { dx = 8, dy = 0, style = "rgba(255,255,255,0.85)", font = '11px "Courier New", Courier, monospace' } = {}) => {
    const p = view.project(pt);
    if (!p) return;
    ctx.font = font;
    ctx.fillStyle = style;
    ctx.textBaseline = "middle";
    ctx.fillText(text, p[0] + dx, p[1] + dy);
  };

  // Circle of radius r in a plane tilted by inclination about the node line (radians).
  view.orbit = (r, inc = 0, node = 0, style = "rgba(255,255,255,0.25)", center = [0, 0, 0]) => {
    const pts = [];
    for (let k = 0; k <= 96; k++) {
      const a = (k / 96) * Math.PI * 2;
      pts.push(add(center, tilt([r * Math.cos(a), r * Math.sin(a), 0], inc, node)));
    }
    view.path(pts, style);
  };

  view.loop = (fn) => {
    view.onDraw = fn;
    let last = performance.now();
    const tick = (now) => {
      if (!view.alive) return;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      ctx.clearRect(0, 0, view.W, view.H);
      view.onDraw?.(dt, now);
      view.raf = requestAnimationFrame(tick);
    };
    view.raf = requestAnimationFrame(tick);
  };

  view.destroy = () => {
    view.alive = false;
    cancelAnimationFrame(view.raf);
    ro.disconnect();
  };

  return view;
}

export const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
export const scale = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
export const len = (a) => Math.hypot(a[0], a[1], a[2]);

// Rotate a point in an orbit plane by inclination (about x) then node (about z).
export function tilt([x, y, z], inc, node) {
  const y1 = y * Math.cos(inc) - z * Math.sin(inc);
  const z1 = y * Math.sin(inc) + z * Math.cos(inc);
  return [x * Math.cos(node) - y1 * Math.sin(node), x * Math.sin(node) + y1 * Math.cos(node), z1];
}

// Red gravity dots: clouds of sample points around each massive body, denser closer in.
// Each cloud is a set of spherical shells spaced geometrically (each shell `ratio` times
// farther out) with the same number of dots per shell, so dot density rises steeply
// toward the body (~1/r³ in 3D). Shells are evenly covered (Fibonacci sphere), rotated
// and lightly jittered so they don't read as a lattice; the layout is cached, so the dots
// don't shimmer, and clouds move with their bodies.
// Each dot's size and opacity show the total gravitational acceleration there (log scale);
// the optional tick points along it.
//   sources: [{ pos: [x,y,z], rMin, rMax, perShell? }]   accelAt(point) -> [ax, ay, az]
const shellCache = new Map();
const frac = (x) => x - Math.floor(x);

function shellOffsets(shells, perShell, ratio) {
  const key = `${shells}:${perShell}:${ratio}`;
  if (shellCache.has(key)) return shellCache.get(key);
  const golden = Math.PI * (3 - Math.sqrt(5));
  const pts = [];
  for (let k = 0; k < shells; k++) {
    const spin = k * 1.3, tiltK = k * 0.7;
    for (let i = 0; i < perShell; i++) {
      const y = 1 - (2 * (i + 0.5)) / perShell;
      const rr = Math.sqrt(1 - y * y);
      const th = i * golden + spin;
      let [x, yy, z] = [rr * Math.cos(th), y, rr * Math.sin(th)];
      // tilt each shell differently so neighbouring shells don't line up
      [yy, z] = [yy * Math.cos(tiltK) - z * Math.sin(tiltK), yy * Math.sin(tiltK) + z * Math.cos(tiltK)];
      const jitter = 1 + (frac(Math.sin(i * 12.9898 + k * 78.233) * 43758.5453) - 0.5) * (ratio - 1) * 0.8;
      const scale = ratio ** k * jitter; // multiple of rMin
      pts.push([x * scale, yy * scale, z * scale]);
    }
  }
  shellCache.set(key, pts);
  return pts;
}

export function drawGravityDots(view, accelAt, { sources, perShell = 26, ref = 1, ticks = true, maxDots = 1400 } = {}) {
  const { ctx } = view;
  let drawn = 0;
  for (const src of sources) {
    const ratio = 1.32;
    const shells = Math.max(1, Math.min(16, Math.ceil(Math.log(src.rMax / src.rMin) / Math.log(ratio)) + 1));
    for (const off of shellOffsets(shells, src.perShell || perShell, ratio)) {
      if (drawn >= maxDots) return;
      const p = [src.pos[0] + off[0] * src.rMin, src.pos[1] + off[1] * src.rMin, src.pos[2] + off[2] * src.rMin];
      const a = accelAt(p);
      const mag = len(a);
      if (!(mag > 0)) continue;
      const s = Math.max(0, Math.min(1, 0.5 + 0.25 * Math.log10(mag / ref)));
      const q = view.project(p);
      if (!q) continue;
      drawn++;
      ctx.fillStyle = `rgba(${GRAVITY_RED},${0.15 + 0.75 * s})`;
      ctx.beginPath();
      ctx.arc(q[0], q[1], 0.7 + 2.6 * s, 0, Math.PI * 2);
      ctx.fill();
      if (ticks) {
        const tipLen = Math.max(src.rMin * 0.5, len(off) * src.rMin * 0.18) * s;
        view.line(p, add(p, scale(a, tipLen / mag)), `rgba(${GRAVITY_RED},${0.2 + 0.6 * s})`);
      }
    }
  }
}
