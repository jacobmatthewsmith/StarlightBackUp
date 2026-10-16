// Level 1 · gravity — the environment (Stage 1: no puzzles yet).
// The Solar System at true scale: real positions for today's date, true distances, true
// sizes. From far away every body is far smaller than a pixel, so it's drawn as a small
// labelled marker; fly in to a body and it becomes a true-size point cloud.

import { makeCloud, drawCloud, bodyRotation, mulberry32 } from "./pointcloud.js";
import { BODIES, KM_PER_AU, positions, orbitPath, moonOffset, daysSinceJ2000 } from "./solar.js";

const el = (tag, attrs = {}, ...kids) => {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === "class") e.className = v;
    else if (k.startsWith("on")) e.addEventListener(k.slice(2), v);
    else if (v !== false && v != null) e.setAttribute(k, v === true ? "" : v);
  }
  for (const kid of kids.flat()) if (kid != null) e.append(kid.nodeType ? kid : document.createTextNode(kid));
  return e;
};

const RATES = [["paused", 0], ["1 hour / s", 1 / 24], ["1 day / s", 1], ["1 week / s", 7], ["1 month / s", 30.44]];
const OVERVIEW = { yaw: -0.5, pitch: 0.42, dist: 13 };    // frames Jupiter's orbit
const CLOUD_N = { Sun: 7000, Jupiter: 6000, Saturn: 5000, Uranus: 4200, Neptune: 4200, Earth: 5000, Venus: 4600, Mars: 4200, Mercury: 3600, Moon: 3400 };
const fmt = (x) => Math.round(x).toLocaleString();

export function mount(host, ctx) {
  host.innerHTML = "";
  const canvas = el("canvas", { class: "game-canvas", "aria-label": "the Solar System at true scale" });
  const bodyNav = el("nav", { class: "game-bodies", "aria-label": "fly to" });
  const rateBox = el("div", { class: "game-rate" });
  const dateOut = el("span", { class: "date" });
  const scaleBar = el("div", { class: "game-scale" }, el("div", { class: "bar" }), el("span", {}));
  const focusNote = el("div", { class: "game-focus" });
  host.append(
    canvas,
    el("div", { class: "game-head" },
      el("button", { class: "sl-btn quiet", onclick: () => ctx.exit() }, "‹ levels"),
      el("div", { class: "kicker" }, "level 1 · gravity"),
      el("p", { class: "objective" }, "the solar system, at true scale."),
      el("p", { class: "note" }, "Every body is far smaller than the dot that marks it. Click one to see it at its true size."),
    ),
    focusNote,
    el("div", { class: "game-foot" }, scaleBar, bodyNav, el("div", { class: "game-time" }, dateOut, rateBox)),
  );

  const c2d = canvas.getContext("2d");
  let W = 0, H = 0, S = 1;
  const resize = () => {
    const dpr = window.devicePixelRatio || 1, r = canvas.getBoundingClientRect();
    W = r.width; H = r.height; S = Math.min(W, H) * 0.9;
    canvas.width = Math.max(1, Math.round(W * dpr)); canvas.height = Math.max(1, Math.round(H * dpr));
    c2d.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  const ro = new ResizeObserver(resize); ro.observe(canvas); resize();

  // ---- state ----
  let day = daysSinceJ2000(Date.now());
  let rate = 7;
  let pos = positions(day);
  const cam = { ...OVERVIEW, center: [0, 0, 0], focus: null, fly: null };
  const clouds = Object.fromEntries(BODIES.map((b, i) => [b.name, makeCloud({
    n: CLOUD_N[b.name], seed: 1013 + i * 7919, inner: b.name === "Sun" ? 0.25 : 0.84,
    ring: b.name === "Saturn" ? { inner: 74658 / 58232, outer: 136775 / 58232, n: 2600 } : null, // C ring inner edge → A ring outer edge
  })]));
  const spin = Object.fromEntries(BODIES.map((b) => [b.name, 0]));
  const orbits = Object.fromEntries(BODIES.filter((b) => b.el).map((b) => [b.name, orbitPath(b)]));
  const rand = mulberry32(42);
  const sky = Array.from({ length: 900 }, () => {
    const g = () => Math.sqrt(-2 * Math.log(1 - rand())) * Math.cos(2 * Math.PI * rand());
    const v = [g(), g(), g()], m = Math.hypot(...v);
    return [v[0] / m, v[1] / m, v[2] / m, 0.08 + 0.4 * rand() ** 3];
  });

  // ---- camera ----
  function rotate(x, y, z) {
    const cy = Math.cos(cam.yaw), sy = Math.sin(cam.yaw), cp = Math.cos(cam.pitch), sp = Math.sin(cam.pitch);
    const x1 = x * cy - y * sy, y1 = x * sy + y * cy;
    return [x1, y1 * cp - z * sp, y1 * sp + z * cp]; // [right, depth, up]
  }
  function project(p) {
    const [x1, depth, up] = rotate(p[0] - cam.center[0], p[1] - cam.center[1], p[2] - cam.center[2]);
    const camZ = cam.dist + depth;
    if (camZ < cam.dist * 0.02) return null;
    const f = S / camZ;
    return [W / 2 + x1 * f, H / 2 - up * f, f, camZ];
  }
  const ease = (s) => (s < 0.5 ? 4 * s * s * s : 1 - (-2 * s + 2) ** 3 / 2);
  const bodyByName = (n) => BODIES.find((b) => b.name === n);

  function flyTo(name) {
    const b = name && bodyByName(name);
    const toDist = b ? b.radius * (b.name === "Saturn" ? 5.5 : 2.6) : OVERVIEW.dist;
    cam.fly = { t0: performance.now(), dur: 2200, from: [...cam.center], fromDist: cam.dist, toDist, to: name, fromPitch: cam.pitch, toPitch: b ? 0.25 : OVERVIEW.pitch };
    cam.focus = name;
    setRate(b ? 1 / 24 : 7);
    renderNav();
  }

  function updateCamera(now) {
    const target = cam.focus ? pos[cam.focus] : [0, 0, 0];
    if (cam.fly) {
      const s = Math.min(1, (now - cam.fly.t0) / cam.fly.dur), e = ease(s);
      // Move in log-distance so the huge change of scale feels even.
      cam.dist = Math.exp(Math.log(cam.fly.fromDist) + (Math.log(cam.fly.toDist) - Math.log(cam.fly.fromDist)) * e);
      cam.center = cam.fly.from.map((v, k) => v + (target[k] - v) * Math.min(1, e * 1.15));
      cam.pitch = cam.fly.fromPitch + (cam.fly.toPitch - cam.fly.fromPitch) * e;
      if (s >= 1) cam.fly = null;
    } else cam.center = target;
  }

  // ---- input ----
  let drag = null;
  canvas.addEventListener("pointerdown", (e) => { drag = { x: e.clientX, y: e.clientY, moved: 0 }; canvas.setPointerCapture(e.pointerId); });
  canvas.addEventListener("pointermove", (e) => {
    if (!drag) return;
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    drag.moved += Math.abs(dx) + Math.abs(dy);
    cam.yaw += dx * 0.006;
    cam.pitch = Math.max(-1.45, Math.min(1.45, cam.pitch + dy * 0.006));
    drag.x = e.clientX; drag.y = e.clientY;
  });
  canvas.addEventListener("pointerup", (e) => {
    if (drag && drag.moved < 5) {
      const hit = pickBody(e.offsetX, e.offsetY);
      if (hit) flyTo(hit);
    }
    drag = null;
  });
  canvas.addEventListener("pointercancel", () => (drag = null));
  canvas.addEventListener("wheel", (e) => {
    e.preventDefault();
    cam.fly = null;
    const b = cam.focus && bodyByName(cam.focus);
    const minD = b ? b.radius * 1.4 : 0.02;
    cam.dist = Math.max(minD, Math.min(90, cam.dist * Math.exp(e.deltaY * 0.0015)));
  }, { passive: false });
  const onKey = (e) => { if (e.key === "Escape") flyTo(null); };
  window.addEventListener("keydown", onKey);
  canvas.style.touchAction = "none";

  let lastScreen = [];
  function pickBody(x, y) {
    let best = 16, hit = null;
    for (const s of lastScreen) {
      const d = Math.hypot(s.x - x, s.y - y) - s.r;
      if (d < best) { best = d; hit = s.name; }
    }
    return hit;
  }

  // ---- controls ----
  function setRate(r) { rate = r; renderRate(); }
  function renderRate() {
    rateBox.innerHTML = "";
    for (const [label, r] of RATES) rateBox.append(el("button", { class: `sl-btn quiet${r === rate ? " on" : ""}`, onclick: () => setRate(r) }, label));
  }
  function renderNav() {
    bodyNav.innerHTML = "";
    bodyNav.append(el("button", { class: `sl-btn quiet${cam.focus ? "" : " on"}`, onclick: () => flyTo(null) }, "whole view"));
    for (const b of BODIES) bodyNav.append(el("button", { class: `sl-btn quiet${cam.focus === b.name ? " on" : ""}`, onclick: () => flyTo(b.name) }, b.name.toLowerCase()));
    const f = cam.focus && bodyByName(cam.focus);
    focusNote.innerHTML = "";
    if (f) {
      const lines = [`${f.name.toLowerCase()} · radius ${fmt(f.radiusKm)} km`];
      if (f.name === "Sun") lines.push("109 Earths would fit across it.");
      else if (f.name === "Moon") lines.push(`${fmt(Math.hypot(...moonOffset(day)) * KM_PER_AU)} km from Earth right now`);
      else lines.push(`${(Math.hypot(...pos[f.name])).toFixed(2)} AU from the Sun right now`);
      focusNote.append(...lines.map((t, i) => el("div", { class: i ? "note" : "" }, t)));
    }
  }
  renderRate(); renderNav();

  // ---- drawing ----
  function niceScale() {
    const pxPerUnit = S / cam.dist; // at the focus depth
    const target = Math.min(160, W * 0.2) / pxPerUnit; // world units in ~160 px
    const km = target * KM_PER_AU;
    let value, unit, units;
    if (target >= 0.05) {
      const n = [0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 50].reduce((a, v) => (v <= target ? v : a), 0.1);
      value = n; unit = n === 1 ? "AU" : "AU"; units = n;
    } else {
      const p = 10 ** Math.floor(Math.log10(km));
      const n = [1, 2, 5].map((k) => k * p).reduce((a, v) => (v <= km ? v : a), p);
      value = n; unit = "km"; units = n / KM_PER_AU;
    }
    scaleBar.firstChild.style.width = `${units * pxPerUnit}px`;
    scaleBar.lastChild.textContent = `${unit === "km" ? fmt(value) : value} ${unit}${unit === "AU" && value === 1 ? " · the Earth–Sun distance" : ""}`;
  }

  function drawSky() {
    for (const [x, y, z, a] of sky) {
      const [r, depth, up] = rotate(x, y, z);
      if (depth <= 0.05) continue;
      const sx = W / 2 + (r / depth) * S, sy = H / 2 - (up / depth) * S;
      if (sx < 0 || sy < 0 || sx > W || sy > H) continue;
      c2d.fillStyle = `rgba(255,255,255,${a})`;
      c2d.fillRect(sx, sy, 1, 1);
    }
  }

  function drawPath(pts, style, offset = [0, 0, 0]) {
    c2d.strokeStyle = style; c2d.lineWidth = 1; c2d.beginPath();
    let on = false;
    for (const p of pts) {
      const q = project([p[0] + offset[0], p[1] + offset[1], p[2] + offset[2]]);
      if (!q) { on = false; continue; }
      on ? c2d.lineTo(q[0], q[1]) : c2d.moveTo(q[0], q[1]); on = true;
    }
    c2d.stroke();
  }

  let last = performance.now(), raf = 0, alive = true;
  function frame(now) {
    if (!alive) return;
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    day += dt * rate;
    pos = positions(day);
    for (const b of BODIES) {
      // Real spin rate, but never faster than ~1/4 turn per second on screen (no strobing).
      const w = (2 * Math.PI * 24) / b.rotHours * rate;
      spin[b.name] += Math.sign(w) * Math.min(Math.abs(w), 1.6) * dt;
    }
    updateCamera(now);
    c2d.clearRect(0, 0, W, H);
    drawSky();

    // Orbits fade away when you're close to a body (they'd only cut through it).
    const orbitAlpha = Math.max(0, Math.min(0.2, 0.2 * Math.log10(cam.dist / 0.002) / 2));
    if (orbitAlpha > 0.01) for (const [name, pts] of Object.entries(orbits)) drawPath(pts, `rgba(255,255,255,${orbitAlpha})`);
    if (cam.dist < 0.05) {
      const moonPath = Array.from({ length: 121 }, (_, k) => moonOffset(day + (k / 120) * 27.3217));
      drawPath(moonPath, `rgba(255,255,255,${Math.min(0.18, 0.18 * Math.log10(0.05 / cam.dist))})`, pos.Earth);
    }

    c2d.globalCompositeOperation = "lighter";
    const screen = [];
    for (const b of BODIES) {
      const p = pos[b.name];
      const q = project(p);
      if (!q) continue;
      const rpx = b.radius * q[2];
      const cloudA = Math.max(0, Math.min(1, (rpx - 2) / 6));
      if (cloudA > 0 && q[0] > -rpx * 3 && q[0] < W + rpx * 3 && q[1] > -rpx * 3 && q[1] < H + rpx * 3) {
        const m = Math.hypot(...p) || 1;
        drawCloud(c2d, clouds[b.name], {
          project, center: p, radius: b.radius, rot: bodyRotation(spin[b.name], b.obliquity),
          sunDir: b.name === "Sun" ? null : [-p[0] / m, -p[1] / m, -p[2] / m], rgb: b.rgb, rpx, alpha: cloudA, camZ0: q[3],
        });
      }
      if (cloudA < 1) {
        c2d.globalAlpha = 1 - cloudA;
        c2d.fillStyle = `rgb(${b.rgb})`;
        c2d.beginPath(); c2d.arc(q[0], q[1], b.name === "Sun" ? 2.6 : b.name === "Moon" ? 1.1 : 1.7, 0, Math.PI * 2); c2d.fill();
        c2d.globalAlpha = 1;
      }
      screen.push({ name: b.name, x: q[0], y: q[1], r: Math.max(rpx, 3), rpx, z: q[3] });
    }
    c2d.globalCompositeOperation = "source-over";
    lastScreen = screen;

    // Labels: sparse, no overlaps, nearest first.
    c2d.font = '11px "Courier New", Courier, monospace'; c2d.textBaseline = "middle";
    const taken = [];
    for (const s of [...screen].sort((a, b) => (b.name === cam.focus) - (a.name === cam.focus) || a.z - b.z)) {
      if (s.name === "Moon" && !(cam.focus === "Earth" || cam.focus === "Moon")) continue;
      if (s.name === cam.focus && s.rpx > 30) continue; // named in the corner instead
      const text = s.name.toLowerCase();
      const w = c2d.measureText(text).width;
      const x = s.x + Math.max(6, s.rpx * 0.75 + 6), y = s.y - (s.rpx > 8 ? s.rpx * 0.75 : 0);
      if (x > W || x + w < 0 || y < 0 || y > H) continue;
      if (taken.some((t) => x < t.x + t.w + 4 && t.x < x + w + 4 && Math.abs(t.y - y) < 12)) continue;
      taken.push({ x, y, w });
      c2d.fillStyle = s.name === cam.focus ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.55)";
      c2d.fillText(text, x, y);
    }

    niceScale();
    dateOut.textContent = new Date(Date.UTC(2000, 0, 1, 12) + day * 86400000).toISOString().slice(0, 10);
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);

  // Exposed for checks / debugging.
  window.starlightLevel1 = { cam, flyTo, get day() { return day; }, get screen() { return lastScreen; }, frame };

  return {
    unmount() {
      alive = false; cancelAnimationFrame(raf); ro.disconnect();
      window.removeEventListener("keydown", onKey);
      delete window.starlightLevel1;
      host.innerHTML = "";
    },
  };
}
