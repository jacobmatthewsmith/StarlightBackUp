// Level 2 — gravity & time.
// Stationary clocks outside an isolated, spherical, non-rotating mass (Schwarzschild
// exterior). Clock rate relative to a far-away clock: sqrt(1 - r_s/r). Valid only for
// clocks held at fixed radius (supported or hovering), outside the surface and horizon.
// Moving clocks also need a velocity term — this formula is not applied to them here.

import * as P from "../../shared/physics.js";
import { GRAVITY_RED } from "../../shared/view3d.js";
import { el, sci, runLevel, choiceCheck, slider, readout } from "./common.js";

const KM_PER_RS_PER_MSUN = P.schwarzschildRadius(P.M_SUN) / 1000; // ≈ 2.95 km

export function mount(host, ctx) {
  return runLevel(host, {
    level: 2,
    title: "gravity & time",
    ctx,
    startAt: ctx.store.get().level2.step,
    steps: [
      { id: "intro", title: "two clocks, one gravity well", render: stepIntro },
      { id: "two-clocks", title: "compare the clocks", render: stepCompare },
      { id: "weak-field", title: "a real example: Earth", render: stepEarth },
      { id: "lab", title: "the compact-object lab", render: stepLab },
      { id: "free-fall", title: "supported vs falling", render: stepFreeFall },
      { id: "orbit", title: "an orbit is free fall", render: stepOrbit },
      { id: "mastery", title: "challenge: place the clock", render: stepMastery, onFinish: () => ctx.next(3) },
    ],
  });
}

// ---------- the clock-comparison scene (2D, side view) ----------
// state: { rs (km), surface (km), near (km), far (km), t (comparison seconds, measured
// by a clock far away), localNear (bool), contours (bool) }
function clockScene(stage, state) {
  const canvas = el("canvas");
  stage.append(canvas);
  const c = canvas.getContext("2d");
  let raf, last = performance.now(), W = 0, H = 0;

  function resize() {
    const dpr = devicePixelRatio || 1, r = canvas.getBoundingClientRect();
    W = r.width; H = r.height;
    canvas.width = Math.max(1, W * dpr); canvas.height = Math.max(1, H * dpr);
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);
  resize();

  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (state.playing) state.t += dt * state.speed;
    const rateNear = P.stationaryRate(state.near, state.rs);
    const rateFar = P.stationaryRate(state.far, state.rs);
    // In the near clock's local view, its own seconds set the pace of playback.
    const tNear = state.t * rateNear, tFar = state.t * rateFar;

    c.clearRect(0, 0, W, H);
    // To scale: fit the object and both clocks, keeping the whole object on screen.
    const cy = H * 0.38;
    const span = Math.max(state.far * 1.12, state.surface * 3);
    const px = (W - 100) / (span + state.surface);
    const x0 = 30 + state.surface * px;

    // Rate contours (illustration): rings where the clock rate takes round values.
    if (state.contours) {
      c.setLineDash([3, 4]);
      c.font = '10px "Courier New", monospace';
      for (const rate of [0.5, 0.7, 0.8, 0.9, 0.95, 0.99]) {
        const r = state.rs / (1 - rate * rate);
        if (r < state.surface || r > span) continue;
        c.strokeStyle = "rgba(255,255,255,0.18)";
        c.beginPath(); c.arc(x0, cy, r * px, -1.1, 1.1); c.stroke();
        c.fillStyle = "rgba(255,255,255,0.4)";
        c.fillText(`rate ${rate}`, x0 + r * px * Math.cos(-1.1) + 4, cy + r * px * Math.sin(-1.1));
      }
      c.setLineDash([]);
    }

    // Red dots: gravitational pull (Newtonian estimate GM/r², for orientation only).
    // Rows at geometrically spaced distances, so the dots crowd in near the object.
    const rows = 16, ratio = (span / state.surface) ** (1 / rows);
    for (let i = 1; i <= rows; i++) {
      const r = state.surface * ratio ** i;
      const s = Math.min(1, (state.surface / r) ** 2);
      const fan = i % 2 ? [-0.55, -0.3, 0.3, 0.55] : [-0.42, -0.17, 0.17, 0.42];
      for (const ang of fan) {
        c.fillStyle = `rgba(${GRAVITY_RED},${0.15 + 0.7 * s})`;
        c.beginPath(); c.arc(x0 + r * px * Math.cos(ang), cy + r * px * Math.sin(ang), 1 + 3 * s, 0, Math.PI * 2); c.fill();
      }
    }

    // Central mass and (if visible at this scale) its horizon radius.
    c.fillStyle = "#fff";
    c.beginPath(); c.arc(x0, cy, Math.max(4, state.surface * px), 0, Math.PI * 2); c.fill();
    c.font = '11px "Courier New", monospace';
    c.fillStyle = "#aaa";
    c.fillText(state.massLabel, x0 - 50, cy + Math.max(4, state.surface * px) + 18);

    // The two clocks, each on a support stand from the surface (they're held, not orbiting).
    drawClock(c, x0 + state.near * px, cy, tNear, "near", state.near, rateNear, x0 + state.surface * px);
    drawClock(c, x0 + state.far * px, cy, tFar, "far", state.far, rateFar, x0 + state.surface * px);

    // Comparison strip: each clock's ticks laid out against comparison time.
    const y1 = H * 0.72, y2 = H * 0.82, left = 70, right = W - 30, window = 12;
    const t0 = Math.max(0, state.t - window), sx = (t) => left + ((t - t0) / window) * (right - left);
    c.fillStyle = "#888";
    c.fillText("comparison: each clock's ticks, laid side by side", left, y1 - 26);
    c.strokeStyle = "#444";
    for (const y of [y1, y2]) { c.beginPath(); c.moveTo(left, y); c.lineTo(right, y); c.stroke(); }
    c.fillStyle = "#fff";
    c.fillText("near", 20, y1 + 4);
    c.fillText("far", 20, y2 + 4);
    const ticks = (rate, y, label) => {
      const first = Math.ceil(t0 * rate), lastTick = Math.floor(state.t * rate);
      for (let k = first; k <= lastTick; k++) {
        const x = sx(k / rate);
        c.fillStyle = "#fff";
        c.fillRect(x - 0.75, y - 7, 1.5, 14);
        if (k % 5 === 0) { c.fillStyle = "#888"; c.fillText(String(k), x - 4, y + 22); }
      }
    };
    ticks(rateNear, y1);
    ticks(rateFar, y2);

    c.fillStyle = "#666";
    c.fillText(`${state.speed > 1 ? `playback ×${state.speed} · ` : ""}${state.exaggerated ? "" : ""}values from the Schwarzschild model`, left, H - 14);
    state.onFrame?.({ tNear, tFar, rateNear, rateFar });
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
  return () => { cancelAnimationFrame(raf); ro.disconnect(); };
}

function drawClock(c, x, y, seconds, name, rKm, rate, surfaceX) {
  // Support: a thin stand from the surface to the clock.
  c.strokeStyle = "rgba(255,255,255,0.35)";
  c.setLineDash([2, 3]);
  c.beginPath(); c.moveTo(surfaceX, y + 26); c.lineTo(x, y + 26); c.lineTo(x, y + 14); c.stroke();
  c.setLineDash([]);
  c.strokeStyle = "#fff";
  c.lineWidth = 1.5;
  c.beginPath(); c.arc(x, y, 14, 0, Math.PI * 2); c.stroke();
  const a = (seconds % 1) * Math.PI * 2 - Math.PI / 2;
  c.beginPath(); c.moveTo(x, y); c.lineTo(x + 11 * Math.cos(a), y + 11 * Math.sin(a)); c.stroke();
  c.lineWidth = 1;
  c.fillStyle = "#fff";
  c.font = 'bold 12px "Courier New", monospace';
  c.textAlign = "center";
  c.fillText(`${seconds.toFixed(2)} s`, x, y - 22);
  c.font = '10px "Courier New", monospace';
  c.fillStyle = "#999";
  c.fillText(`${name} · ${rKm >= 1000 ? sci(rKm) : rKm.toFixed(1)} km`, x, y + 42);
  c.textAlign = "left";
}

// ---------- 1. intro ----------
function stepIntro({ lesson, stage, done }) {
  const state = labState({ near: 4, far: 10 });
  state.playing = false;
  const stop = clockScene(stage, state);
  lesson.append(
    el("p", {}, "Two identical clocks sit at different distances from a massive object. Both are ", el("b", {}, "held in place"), " — on stands or hovering on rockets — not orbiting and not falling."),
    el("p", {}, "Level 1 asked how gravity makes things move. This level asks a different question: how much time does each clock record?"),
    el("p", { class: "note" }, "Model: an isolated, spherical, non-rotating mass (the Schwarzschild exterior solution of general relativity). The red dots show gravity's pull; the clocks are white."),
  );
  done();
  return stop;
}

// A lab state in km, from radii given in units of r_s.
function labState({ massSun = P.LAB.massSun, near, far, surfaceRs = P.LAB.surfaceRs }) {
  const rs = KM_PER_RS_PER_MSUN * massSun;
  return {
    rs, surface: surfaceRs * rs, near: near * rs, far: far * rs, t: 0, speed: 1, playing: true, contours: true,
    massLabel: `${massSun.toFixed(1)} M☉ compact object (fictional)`,
  };
}

// ---------- 2. compare ----------
function stepCompare({ lesson, stage, done }) {
  const state = labState({ near: 3, far: 10 });
  const set = readoutFor(lesson);
  state.onFrame = ({ tNear, tFar }) => {
    set("near", `${tNear.toFixed(2)} s`);
    set("far", `${tFar.toFixed(2)} s`);
    set("ratio", (tNear / Math.max(tFar, 1e-9)).toFixed(4));
    if (tFar >= 10) done();
  };
  const stop = clockScene(stage, state);
  lesson.append(
    el("p", {}, "Each clock shows its own elapsed time. The strip at the bottom lays their ticks side by side: the near clock's ticks are spaced further apart, so over the same comparison it collects fewer seconds."),
    el("p", { class: "note" }, "This is a fictional compact object, chosen so the effect is big enough to see. Run until the far clock passes 10 s."),
  );
  labControls(lesson, state);
  return stop;
}

function readoutFor(lesson) {
  return readout(lesson, [["near", "near clock records"], ["far", "far clock records"], ["ratio", "near ÷ far"]]);
}

function labControls(lesson, state, { mass = true } = {}) {
  const surfKm = () => state.surface;
  if (mass) {
    slider(lesson, { label: "central mass", min: 0.5, max: 3.5, step: 0.05, value: state.rs / KM_PER_RS_PER_MSUN, format: (v) => `${v.toFixed(2)} M☉`, oninput: (v) => {
      // Keep the object's size fixed (≈12 km); mass changes r_s and so the clock rates.
      const surface = state.surface;
      state.rs = KM_PER_RS_PER_MSUN * v;
      state.surface = surface;
      state.massLabel = `${v.toFixed(2)} M☉ compact object (fictional)`;
      state.near = Math.max(state.near, state.surface);
    } });
  }
  slider(lesson, { label: "near clock distance from centre", min: state.surface, max: state.far * 0.95, step: 0.01, value: state.near, format: (v) => `${v.toFixed(2)} km`, oninput: (v) => { state.near = Math.max(v, surfKm()); state.t = 0; } });
  slider(lesson, { label: "far clock distance from centre", min: state.surface * 1.5, max: state.far * 2, step: 0.01, value: state.far, format: (v) => `${v.toFixed(2)} km`, oninput: (v) => { state.far = v; state.t = 0; } });
  lesson.append(el("div", { class: "nav" },
    el("button", { class: "sl-btn", onclick: () => (state.playing = !state.playing) }, "play / pause"),
    el("button", { class: "sl-btn", onclick: () => (state.t = 0) }, "reset"),
    el("label", { style: "font-size:12px;display:flex;gap:6px;align-items:center" }, el("input", { type: "checkbox", checked: state.contours, onchange: (e) => (state.contours = e.target.checked) }), "rate contours (illustration)"),
  ));
}

// ---------- 3. Earth ----------
function stepEarth({ lesson, stage, done }) {
  const rs = P.schwarzschildRadius(P.M_EARTH);
  let h = 1000; // m
  const box = el("div", { style: "padding:80px 30px;font:14px 'Courier New',monospace;color:#fff" });
  stage.append(box);
  const set = readout(lesson, [["h", "height of the upper clock"], ["ratio", "lower ÷ upper rate"], ["day", "lower clock falls behind, per day"], ["year", "per year"]]);
  const update = () => {
    const ratio = P.clockRatio(P.R_EARTH, P.R_EARTH + h, rs);
    const lag = 1 - ratio;
    set("h", h >= 1e5 ? `${sci(h / 1000)} km` : `${h.toLocaleString()} m`);
    set("ratio", `1 − ${sci(lag)}`);
    set("day", `${sci(lag * 86400 * 1e9)} ns`);
    set("year", `${sci(lag * P.YEAR * 1e6)} μs`);
    box.innerHTML = "";
    box.append(el("p", {}, "Earth (real values)"), el("p", { style: "color:#888" }, `upper clock: held ${h.toLocaleString()} m above the surface`), el("p", { style: "color:#888" }, "lower clock: on the ground"));
  };
  slider(lesson, { label: "height (log scale)", min: 0, max: 7, step: 0.01, value: 3, format: (v) => `${Math.round(10 ** v).toLocaleString()} m`, oninput: (v) => { h = Math.round(10 ** v); update(); } });
  update();
  lesson.append(
    el("p", {}, "On Earth the effect is real but tiny. A clock on the ground records less time than one held higher up — about 9 billionths of a second per day per kilometre of height."),
    el("p", { class: "note" }, "Atomic clocks measure differences this small (Chou et al., 2010, compared clocks 33 cm apart). Heights beyond towers mean a clock hovering in place, not orbiting: orbiting clocks also move, which adds a separate speed effect this formula doesn't include."),
  );
  done();
}

// ---------- 4. the lab ----------
function stepLab({ lesson, stage, done }) {
  const state = labState({ near: 2.5, far: 10 });
  state.speed = 2;
  const set = readoutFor(lesson);
  let local = false;
  state.onFrame = ({ tNear, tFar }) => {
    set("near", `${tNear.toFixed(2)} s`);
    set("far", `${tFar.toFixed(2)} s`);
    set("ratio", (tNear / Math.max(tFar, 1e-9)).toFixed(4));
  };
  const stop = clockScene(stage, state);
  lesson.append(
    el("p", {}, el("span", { class: "badge fictional" }, "FICTIONAL LAB"), " A made-up compact object, 2 solar masses squeezed into a radius of about 12 km, so the clocks differ by tens of percent."),
    el("p", {}, "Switch to the near clock's own view. Its seconds go by exactly as seconds always do: its hand sweeps once per second of its own time. Nothing feels slow there. The difference only appears when the two clocks' readings are compared."),
  );
  labControls(lesson, state, { mass: false });
  const viewBtn = el("button", { class: "sl-btn", onclick: () => {
    local = !local;
    // Local view: playback paced by the near clock's own seconds.
    state.speed = local ? 2 / P.stationaryRate(state.near, state.rs) : 2;
    viewBtn.textContent = local ? "back to comparison view" : "near clock's local view";
    note.textContent = local ? "Local view: the near clock ticks once per second of its own time. Its seconds are normal." : "";
    done();
  } }, "near clock's local view");
  const note = el("p", { class: "note" });
  lesson.append(el("div", { class: "control" }, viewBtn), note,
    el("p", { class: "note" }, "Playback is accelerated ×2. Clock values come straight from the model."));
  return stop;
}

// ---------- 5. supported vs falling ----------
function stepFreeFall({ lesson, stage, done }) {
  const canvas = el("canvas");
  stage.append(canvas);
  const c = canvas.getContext("2d");
  let raf, last = performance.now(), t = 0, W = 0, H = 0;
  const g = P.surfaceGravity(P.M_EARTH, P.R_EARTH), h0 = 20; // m
  const set = readout(lesson, [["pos", "falling ball: height"], ["vel", "velocity"], ["acc", "acceleration"], ["s", "supported ball: acceleration"]]);
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    t += dt;
    const r = canvas.getBoundingClientRect(), dpr = devicePixelRatio || 1;
    if (r.width !== W) { W = r.width; H = r.height; canvas.width = W * dpr; canvas.height = H * dpr; c.setTransform(dpr, 0, 0, dpr, 0, 0); }
    c.clearRect(0, 0, W, H);
    const ground = H * 0.85, scaleY = (H * 0.65) / h0;
    const fallT = t % 3;
    const y = Math.max(0, h0 - 0.5 * g * fallT * fallT), v = y > 0 ? g * fallT : 0;
    c.strokeStyle = "#555"; c.beginPath(); c.moveTo(0, ground); c.lineTo(W, ground); c.stroke();
    // supported ball on a stand
    const sx = W * 0.35, fx = W * 0.65;
    c.strokeStyle = "#fff"; c.beginPath(); c.moveTo(sx, ground); c.lineTo(sx, ground - h0 * scaleY + 10); c.stroke();
    c.fillStyle = "#fff"; c.beginPath(); c.arc(sx, ground - h0 * scaleY, 10, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.arc(fx, ground - y * scaleY, 10, 0, Math.PI * 2); c.fill();
    c.strokeStyle = `rgba(${GRAVITY_RED},0.9)`; c.lineWidth = 2;
    c.beginPath(); c.moveTo(fx, ground - y * scaleY); c.lineTo(fx, ground - y * scaleY + 40); c.stroke(); c.lineWidth = 1;
    c.font = '12px "Courier New", monospace'; c.fillStyle = "#aaa"; c.textAlign = "center";
    c.fillText("supported", sx, ground + 20); c.fillText("falling", fx, ground + 20); c.textAlign = "left";
    set("pos", `${y.toFixed(1)} m`); set("vel", `${v.toFixed(1)} m/s down`); set("acc", y > 0 ? `${g.toFixed(2)} m/s² down` : "0 (landed)"); set("s", "0 (the stand pushes up)");
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
  lesson.append(
    el("p", {}, "Two balls at the same height near Earth. One sits on a stand; the other is let go. The ", el("span", { class: "gravity" }, "red arrow"), " is the falling ball's acceleration."),
    el("p", {}, "The supported ball doesn't accelerate, because the stand pushes up on it. The falling ball speeds up at about 9.8 m/s² — and anything falling with it (a passenger, a clock) would float, weightless, relative to it."),
  );
  choiceCheck(lesson, {
    question: "A person inside a freely falling box. What do they feel?",
    options: ["Heavier than normal", "Weightless", "Exactly their normal weight"],
    correct: "Weightless",
    explain: "Everything in the box falls together, so nothing presses on anything else.",
    onCorrect: done,
  });
  return () => cancelAnimationFrame(raf);
}

// ---------- 6. orbit ----------
function stepOrbit({ lesson, stage, done }) {
  const canvas = el("canvas");
  stage.append(canvas);
  const c = canvas.getContext("2d");
  let raf, t = 0, last = performance.now(), W = 0, H = 0;
  const alt = 400e3, r = P.R_EARTH + alt;
  const v = Math.sqrt((P.G * P.M_EARTH) / r), a = (P.G * P.M_EARTH) / (r * r), period = (2 * Math.PI * r) / v;
  const set = readout(lesson, [["alt", "altitude"], ["v", "speed (sideways)"], ["a", "acceleration (toward Earth)"], ["T", "one orbit"]]);
  set("alt", "400 km"); set("v", `${(v / 1000).toFixed(2)} km/s`); set("a", `${a.toFixed(2)} m/s²`); set("T", `${(period / 60).toFixed(1)} min`);
  function frame(now) {
    t += Math.min(0.05, (now - last) / 1000) * 300; // playback ×300
    last = now;
    const rect = canvas.getBoundingClientRect(), dpr = devicePixelRatio || 1;
    if (rect.width !== W) { W = rect.width; H = rect.height; canvas.width = W * dpr; canvas.height = H * dpr; c.setTransform(dpr, 0, 0, dpr, 0, 0); }
    c.clearRect(0, 0, W, H);
    const cx = W / 2, cy = H / 2, s = (Math.min(W, H) * 0.35) / r;
    c.fillStyle = "#222"; c.strokeStyle = "#fff";
    c.beginPath(); c.arc(cx, cy, P.R_EARTH * s, 0, Math.PI * 2); c.fill(); c.stroke();
    c.strokeStyle = "rgba(255,255,255,0.25)"; c.beginPath(); c.arc(cx, cy, r * s, 0, Math.PI * 2); c.stroke();
    const ang = (2 * Math.PI * t) / period, x = cx + r * s * Math.cos(ang), y = cy + r * s * Math.sin(ang);
    c.fillStyle = "#fff"; c.beginPath(); c.arc(x, y, 5, 0, Math.PI * 2); c.fill();
    c.strokeStyle = "#fff"; c.beginPath(); c.moveTo(x, y); c.lineTo(x - 50 * Math.sin(ang), y + 50 * Math.cos(ang)); c.stroke();
    c.strokeStyle = `rgba(${GRAVITY_RED},0.95)`; c.lineWidth = 2; c.beginPath(); c.moveTo(x, y); c.lineTo(x - 30 * Math.cos(ang), y - 30 * Math.sin(ang)); c.stroke(); c.lineWidth = 1;
    c.font = '11px "Courier New", monospace'; c.fillStyle = "#777";
    c.fillText("playback ×300 · weak-field Newtonian orbit (fine for Earth; not near a black hole)", 14, H - 14);
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
  lesson.append(
    el("p", {}, "A satellite 400 km up (about the Space Station's height). White: velocity, sideways. ", el("span", { class: "gravity" }, "Red"), ": acceleration, toward Earth."),
    el("p", {}, "It's falling the whole time, like the dropped ball — but it moves sideways so fast (7.7 km/s) that the ground curves away beneath it. An orbit is continuous free fall, which is why astronauts float."),
    el("p", { class: "note" }, "Two separate questions: how does it move? (Newton's gravity answers that well here.) How much time does its clock record? (That needs relativity, and for a moving clock both height and speed matter — the stationary-clock formula alone isn't enough.)"),
  );
  choiceCheck(lesson, {
    question: "Astronauts on the Space Station float because…",
    options: ["there's no gravity 400 km up", "they and the station are falling together", "the station's engines push them"],
    correct: "they and the station are falling together",
    explain: `Gravity there is still about ${(a / P.surfaceGravity(P.M_EARTH, P.R_EARTH) * 100).toFixed(0)}% of its strength at the ground.`,
    onCorrect: done,
  });
  return () => cancelAnimationFrame(raf);
}

// ---------- 7. mastery ----------
function stepMastery({ lesson, stage, done, ctx, refreshNav }) {
  const L = P.LAB;
  const state = labState({ near: 6, far: L.farRs });
  state.speed = 2;
  state.playing = false;
  const answers = { predictLess: null, nearRs: 6, predictFarther: null, normalSeconds: null };
  let hintLevel = 0;
  const set = readoutFor(lesson);
  state.onFrame = ({ tNear, tFar }) => {
    set("near", `${tNear.toFixed(2)} s`);
    set("far", `${tFar.toFixed(2)} s`);
    set("ratio", (tNear / Math.max(tFar, 1e-9)).toFixed(4));
    if (state.playing && tFar >= 10) { state.playing = false; state.t = 10 / P.stationaryRate(state.far, state.rs); }
  };
  const stop = clockScene(stage, state);

  lesson.append(
    el("p", {}, el("span", { class: "badge fictional" }, "FICTIONAL LAB"), ` Far clock fixed at ${L.farRs} r_s (${(L.farRs * state.rs).toFixed(1)} km). Goal: place the near clock so it records 9 s while the far clock records 10 s (within ±0.02 s).`),
  );
  const q1 = el("div");
  lesson.append(q1);
  choiceCheck(q1, {
    question: "1. Predict: which clock will record less time?",
    options: ["near", "far", "same"], correct: "near",
    explain: "Deeper in the gravity well means less elapsed time when compared.",
    onCorrect: () => (answers.predictLess = "near"),
  });

  lesson.append(el("p", {}, "2. Place the near clock, then run the comparison (playback ×2):"));
  slider(lesson, { label: "near clock", min: L.nearRange[0], max: L.nearRange[1], step: 0.001, value: 6, format: (v) => `${v.toFixed(3)} r_s (${(v * state.rs).toFixed(2)} km)`, oninput: (v) => { answers.nearRs = v; state.near = v * state.rs; state.t = 0; state.playing = false; } });
  lesson.append(el("div", { class: "nav" },
    el("button", { class: "sl-btn", onclick: () => { state.t = 0; state.playing = true; } }, "run until far = 10 s"),
    el("button", { class: "sl-btn quiet", onclick: () => hint() }, "hint"),
  ));
  const hintBox = el("p", { class: "note" });
  lesson.append(hintBox);
  function hint() {
    hintLevel++;
    const hints = [
      "Moving the near clock inward (smaller r) lowers its rate; outward raises it.",
      "You need rate(near) / rate(far) = 0.9, where rate(r) = √(1 − r_s/r). The far clock's rate is √(1 − 1/10) ≈ 0.949, so the near clock needs ≈ 0.854.",
      `Solve 1 − r_s/r = 0.854² ≈ 0.729: r ≈ ${P.radiusForRatio(L.targetRatio, L.farRs).toFixed(2)} r_s.`,
    ];
    hintBox.textContent = hints[Math.min(hintLevel, hints.length) - 1];
  }

  const q3 = el("div");
  lesson.append(q3);
  choiceCheck(q3, {
    question: "3. Predict: if the near clock moves farther out, toward the far clock…",
    options: ["ratio approaches 1", "the gap grows", "nothing changes"],
    correct: "ratio approaches 1",
    explain: "At the same height the two clocks would agree.",
    onCorrect: () => (answers.predictFarther = "ratio approaches 1"),
  });
  const q4 = el("div");
  lesson.append(q4);
  choiceCheck(q4, {
    question: "4. Explain: someone sitting next to the near clock…",
    options: ["notices its seconds dragging", "experiences its seconds as completely normal", "sees it stop"],
    correct: "experiences its seconds as completely normal",
    explain: "Each clock's own seconds feel normal; the difference appears only when readings are compared.",
    onCorrect: () => (answers.normalSeconds = true),
  });

  const result = el("div", { class: "feedback" });
  lesson.append(el("div", { class: "control" }, el("button", { class: "sl-btn", onclick: submit }, "submit challenge")), result);
  async function submit() {
    try {
      const res = await ctx.api("POST", "/api/mastery/level2", { answers });
      ctx.store.set({ version: res.version, progress: res.progress });
      result.className = `feedback ${res.check.passed ? "good" : "bad"}`;
      result.textContent = res.check.passed ? "Challenge complete. Level 3 is unlocked." : `Not yet: ${res.check.issues.join("; ")}.`;
      if (res.check.passed) { done(); refreshNav(); }
    } catch (e) {
      result.className = "feedback bad";
      result.textContent = e.message;
    }
  }
  return stop;
}
