// Level 3 — journey to a star: constant-speed cruise, light clocks, length contraction.
// Simplified model: endpoints at rest in a shared frame, constant cruise speed, gravity
// neglected during the cruise. Departure and arrival manoeuvres are outside the model.
//   external journey time = distance / speed
//   ship elapsed time     = external time × sqrt(1 − v²/c²)

import * as P from "../../shared/physics.js";
import { drawLightClocks } from "../../shared/lightclock.js";
import { el, runLevel, choiceCheck, slider, readout } from "./common.js";

export function mount(host, ctx) {
  const trip = { origin: null, dest: null, beta: 0.5, prediction: null, completed: null };
  return runLevel(host, {
    level: 3,
    title: "journey to a star",
    ctx,
    startAt: ctx.store.get().level3.step,
    steps: [
      { id: "intro", title: "choose a destination", render: (ui) => stepChoose(ui, trip) },
      { id: "journey", title: "the cruise", render: (ui) => stepJourney(ui, trip) },
      { id: "light-clock", title: "one light clock, two frames", render: (ui) => stepLightClock(ui, trip) },
      { id: "contraction", title: "shorter trip, shorter distance", render: (ui) => stepContraction(ui, trip) },
      { id: "calibration", title: "calibration: 10 seconds outside", render: (ui) => stepCalibration(ui) },
      { id: "plan", title: "plan the trip", render: (ui) => stepPlan(ui, trip) },
      { id: "mastery", title: "challenge: explain the clocks", render: (ui) => stepMastery(ui, trip) },
    ],
  });
}

// ---------- catalog of places (ACTUAL nearby stars) ----------
function actualPlaces() {
  const stars = typeof nearStars !== "undefined" ? nearStars : [];
  return stars.map((s) => ({ id: `actual:${s.name}`, name: s.name, content: "ACTUAL", x: s.x, y: s.y, z: s.z }));
}

const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
const badge = () => el("span", { class: "badge" }, "ACTUAL");
const years = (y) => (y < 2 ? `${(y * 365.25).toFixed(0)} days` : `${y.toFixed(2)} years`);

// ---------- 1. choose ----------
function stepChoose({ lesson, stage, done, ctx }, trip) {
  const places = actualPlaces();
  trip.origin ||= places.find((p) => p.name === "Sun");
  trip.dest ||= places.find((p) => p.name === "Proxima Centauri");
  const info = el("div", { style: "padding:80px 30px;font:14px 'Courier New',monospace;color:#fff" });
  stage.append(info);
  const render = () => {
    info.innerHTML = "";
    info.append(
      el("p", {}, "from: ", trip.origin.name, " ", badge(trip.origin)),
      el("p", {}, "to: ", trip.dest.name, " ", badge(trip.dest)),
      el("p", { style: "color:#aaa" }, `distance: ${dist(trip.origin, trip.dest).toFixed(2)} light years (catalog coordinates)`),
    );
  };
  const mkSelect = (label, key, list) => {
    const s = el("select", { style: "width:100%;font:13px 'Courier New',monospace;background:#000;color:#fff;border:1px solid #666;padding:4px" });
    for (const p of list) s.append(el("option", { value: p.id, selected: trip[key]?.id === p.id }, p.name));
    s.addEventListener("change", () => { trip[key] = list.find((p) => p.id === s.value); render(); });
    lesson.append(el("div", { class: "control" }, el("label", {}, el("span", {}, label)), s));
  };
  lesson.append(
    el("p", {}, "You're leaving the Sun for a nearby star. The guided first trip goes to Proxima Centauri, the closest star; afterwards, pick anywhere."),
    el("p", { class: "note" }, "Stars use catalog coordinates."),
  );
  mkSelect("origin", "origin", places);
  mkSelect("destination", "dest", places);
  render();
  done();
}

// ---------- 2. the cruise ----------
function cruiseScene(stage, trip, { onTick } = {}) {
  const canvas = el("canvas");
  stage.append(canvas);
  const c = canvas.getContext("2d");
  let raf, last = performance.now(), W = 0, H = 0;
  const s = { t: 0, playing: false, playback: 0 }; // t: external years elapsed
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    const d = dist(trip.origin, trip.dest);
    const { externalYears, shipYears, gamma } = P.cruise(d, trip.beta);
    s.playback = externalYears / 12; // whole trip in ~12 s of playback
    if (s.playing) { s.t = Math.min(externalYears, s.t + dt * s.playback); if (s.t >= externalYears) { s.playing = false; onTick?.({ arrived: true }); } }
    const rect = canvas.getBoundingClientRect(), dpr = devicePixelRatio || 1;
    if (rect.width !== W || rect.height !== H) { W = rect.width; H = rect.height; canvas.width = W * dpr; canvas.height = H * dpr; c.setTransform(dpr, 0, 0, dpr, 0, 0); }
    c.clearRect(0, 0, W, H);

    // Route
    const y = 90, x0 = 60, x1 = W - 60, frac = s.t / externalYears;
    c.strokeStyle = "#555"; c.beginPath(); c.moveTo(x0, y); c.lineTo(x1, y); c.stroke();
    c.fillStyle = "#fff";
    for (const [x, p] of [[x0, trip.origin], [x1, trip.dest]]) {
      c.beginPath(); c.arc(x, y, 6, 0, Math.PI * 2); c.fill();
    }
    c.font = '11px "Courier New", monospace'; c.textAlign = "center"; c.fillStyle = "#ccc";
    c.fillText(trip.origin.name, x0, y + 24); c.fillText(trip.dest.name, x1, y + 24);
    c.textAlign = "left";
    const sx = x0 + (x1 - x0) * frac;
    c.fillStyle = "#fff"; c.beginPath(); c.moveTo(sx + 9, y - 14); c.lineTo(sx - 7, y - 20); c.lineTo(sx - 7, y - 8); c.fill();

    // Light clocks for this speed. The light-clock panels run in seconds of outside time,
    // looping, so their ticks stay visible while the trip plays in years.
    const lcT = (now / 1000) % 30;
    drawLightClocks(c, { x: 20, y: 150, w: W - 40, h: Math.min(260, H - 230) }, { beta: trip.beta, t: lcT });

    c.fillStyle = "#666";
    c.fillText(`playback: 1 s = ${years(s.playback)} of outside time · light-clock panels: real seconds, looping`, 20, H - 14);
    onTick?.({ t: s.t, ship: s.t / gamma, externalYears, shipYears, d, frac });
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
  return { s, stop: () => cancelAnimationFrame(raf) };
}

function journeyReadout(lesson) {
  return readout(lesson, [["d", "distance (origin/destination frame)"], ["v", "cruise speed"], ["ext", "elapsed, origin/destination frame"], ["ship", "elapsed aboard the ship"], ["rem", "remaining distance"], ["pct", "mission progress"]]);
}

function stepJourney({ lesson, stage, done }, trip) {
  const set = journeyReadout(lesson);
  const scene = cruiseScene(stage, trip, {
    onTick: ({ t, ship, d, frac, arrived }) => {
      if (arrived) { done(); return; }
      set("d", `${d.toFixed(2)} ly`); set("v", `${trip.beta.toFixed(2)} c`);
      set("ext", years(t)); set("ship", years(ship)); set("rem", `${(d * (1 - frac)).toFixed(2)} ly`); set("pct", `${(frac * 100).toFixed(1)}%`);
    },
  });
  lesson.prepend(
    el("p", {}, "Set a cruise speed and launch. The ship coasts at constant speed; the trip is timed in the frame where both stars are at rest, and by the ship's own clock."),
    el("p", { class: "note" }, "Simplified model: constant speed, both stars at rest in a shared frame, gravity ignored during the cruise. Speeding up at departure and slowing at arrival are outside this model."),
  );
  slider(lesson, { label: "cruise speed", min: 0.01, max: 0.99, step: 0.01, value: trip.beta, format: (v) => `${v.toFixed(2)} c`, oninput: (v) => { trip.beta = v; scene.s.t = 0; scene.s.playing = false; } });
  lesson.append(el("div", { class: "nav" },
    el("button", { class: "sl-btn", onclick: () => { scene.s.t = 0; scene.s.playing = true; } }, "launch"),
    el("button", { class: "sl-btn", onclick: () => (scene.s.playing = !scene.s.playing) }, "pause / resume"),
  ));
  return scene.stop;
}

// ---------- 3. light clock ----------
function stepLightClock({ lesson, stage, done }, trip) {
  const canvas = el("canvas");
  stage.append(canvas);
  const c = canvas.getContext("2d");
  let raf, t = 0, last = performance.now(), W = 0, H = 0, beta = 0.8;
  const set = readout(lesson, [["g", "γ = 1/√(1−v²/c²)"], ["ship", "one tick, ship frame"], ["ext", "one tick, outside frame"], ["path", "photon path per tick (outside)"]]);
  function frame(now) {
    t += Math.min(0.05, (now - last) / 1000);
    last = now;
    const r = canvas.getBoundingClientRect(), dpr = devicePixelRatio || 1;
    if (r.width !== W || r.height !== H) { W = r.width; H = r.height; canvas.width = W * dpr; canvas.height = H * dpr; c.setTransform(dpr, 0, 0, dpr, 0, 0); }
    c.clearRect(0, 0, W, H);
    drawLightClocks(c, { x: 20, y: 70, w: W - 40, h: Math.min(320, H - 120) }, { beta, t });
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
  const update = () => {
    const lc = P.lightClockTick(beta);
    set("g", P.gamma(beta).toFixed(3)); set("ship", "1.000 s"); set("ext", `${lc.externalTick.toFixed(3)} s`); set("path", `${lc.externalPathLs.toFixed(3)} light-seconds`);
  };
  lesson.append(
    el("p", {}, "A light clock: a ", el("span", { class: "photon" }, "pulse of light"), " bouncing between two mirrors. One up-and-back trip is one tick."),
    el("p", {}, "Aboard, the light goes straight up and down. From outside, the ship moves while the light travels, so the light's path is a longer diagonal. Both frames measure the same light speed, c — so in the outside frame, each tick takes longer."),
    el("p", { class: "note" }, "This is what each frame measures after accounting for signal travel time, not a delay in light reaching a telescope. And aboard, every second feels normal."),
  );
  slider(lesson, { label: "ship speed", min: 0, max: 0.95, step: 0.01, value: beta, format: (v) => `${v.toFixed(2)} c`, oninput: (v) => { beta = v; t = 0; update(); } });
  update();
  choiceCheck(lesson, {
    question: "Light travels a longer path at the same speed. The outside frame measures each tick as…",
    options: ["shorter", "the same", "longer"],
    correct: "longer",
    explain: "time = distance ÷ speed: longer distance, same speed, more time.",
    onCorrect: done,
  });
  return () => cancelAnimationFrame(raf);
}

// ---------- 4. contraction ----------
function stepContraction({ lesson, stage, done }, trip) {
  const box = el("div", { style: "padding:70px 30px;font:14px 'Courier New',monospace;color:#fff" });
  stage.append(box);
  const update = () => {
    const d = dist(trip.origin, trip.dest), t = P.cruise(d, trip.beta);
    box.innerHTML = "";
    box.append(
      el("p", {}, `${trip.origin.name} → ${trip.dest.name} at ${trip.beta.toFixed(2)} c`),
      el("table", { style: "border-collapse:collapse;width:100%;max-width:560px" },
        el("tr", {}, el("th", { style: "text-align:left;padding:6px;border-bottom:1px solid #444" }, ""), el("th", { style: "text-align:left;padding:6px;border-bottom:1px solid #444" }, "distance"), el("th", { style: "text-align:left;padding:6px;border-bottom:1px solid #444" }, "time")),
        el("tr", {}, el("td", { style: "padding:6px" }, "stars' frame"), el("td", { style: "padding:6px" }, `${d.toFixed(3)} ly`), el("td", { style: "padding:6px" }, `${years(t.externalYears)} = ${d.toFixed(3)} ÷ ${trip.beta.toFixed(2)}`)),
        el("tr", {}, el("td", { style: "padding:6px" }, "ship's frame"), el("td", { style: "padding:6px" }, `${t.contractedLy.toFixed(3)} ly = ${d.toFixed(3)} ÷ γ`), el("td", { style: "padding:6px" }, `${years(t.shipYears)} = ${t.contractedLy.toFixed(3)} ÷ ${trip.beta.toFixed(2)}`)),
      ),
    );
  };
  lesson.append(
    el("p", {}, "How can the ship's crew get there in less time without going faster than light? In the ship's frame, the distance between the stars is shorter — contracted by the same factor γ."),
    el("p", {}, "Both frames agree on the speed. Divide each frame's distance by that speed and you get each frame's travel time. The two accounts are consistent."),
  );
  slider(lesson, { label: "cruise speed", min: 0.05, max: 0.99, step: 0.01, value: trip.beta, format: (v) => `${v.toFixed(2)} c`, oninput: (v) => { trip.beta = v; update(); } });
  update();
  done();
}

// ---------- 5. calibration ----------
function stepCalibration({ lesson, stage, done, ctx, refreshNav }) {
  const canvas = el("canvas");
  stage.append(canvas);
  const c = canvas.getContext("2d");
  let raf, t = 0, playing = false, last = performance.now(), W = 0, H = 0;
  function frame(now) {
    if (playing) t = Math.min(10, t + Math.min(0.05, (now - last) / 1000));
    if (t >= 10) playing = false;
    last = now;
    const r = canvas.getBoundingClientRect(), dpr = devicePixelRatio || 1;
    if (r.width !== W || r.height !== H) { W = r.width; H = r.height; canvas.width = W * dpr; canvas.height = H * dpr; c.setTransform(dpr, 0, 0, dpr, 0, 0); }
    c.clearRect(0, 0, W, H);
    drawLightClocks(c, { x: 20, y: 70, w: W - 40, h: Math.min(320, H - 120) }, { beta: 0.8, t });
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
  const input = el("input", { type: "number", step: "0.01", style: "width:90px;font:14px 'Courier New',monospace;background:#000;color:#fff;border:1px solid #666;padding:4px" });
  const fb = el("div", { class: "feedback" });
  lesson.append(
    el("p", {}, "Calibration, at 0.8 c. Predict first: when the outside clock reads 10 s, what will the ship clock read?"),
    el("div", { class: "control" }, input, " s"),
    el("div", { class: "nav" },
      el("button", { class: "sl-btn", onclick: async () => {
        try {
          const res = await ctx.api("POST", "/api/mastery/level3/calibration", { shipSeconds: Number(input.value) });
          ctx.store.set({ version: res.version, progress: res.progress });
          fb.className = `feedback ${res.check.passed ? "good" : "bad"}`;
          fb.textContent = res.check.passed ? "Correct: 10 ÷ γ = 10 × 0.6 = 6 s. Run it to see." : `${res.check.issues[0]} Run the experiment and look again.`;
          if (res.check.passed) { done(); refreshNav(); }
        } catch (e) { fb.className = "feedback bad"; fb.textContent = e.message; }
      } }, "check"),
      el("button", { class: "sl-btn", onclick: () => { t = 0; playing = true; } }, "run 10 outside seconds"),
    ),
    fb,
  );
  return () => cancelAnimationFrame(raf);
}

// ---------- 6. plan ----------
function stepPlan({ lesson, stage, done }, trip) {
  const d = () => dist(trip.origin, trip.dest);
  trip.target = Math.max(1, Math.round(d() * 0.75)); // ship-clock target, years
  const set = journeyReadout(lesson);
  const fb = el("div", { class: "feedback" });
  let ran = false;
  const scene = cruiseScene(stage, trip, {
    onTick: ({ t, ship, frac, arrived, d: dd, shipYears }) => {
      if (arrived) {
        const ok = shipYears <= trip.target + 1e-9;
        trip.completed = ok ? { destinationLy: dd, beta: trip.beta, targetShipYears: trip.target, shipYears } : null;
        fb.className = `feedback ${ok ? "good" : "bad"}`;
        fb.textContent = ok ? `Arrived. Ship clock: ${years(shipYears)} (target ≤ ${trip.target} years).` : `Arrived, but the ship clock read ${years(shipYears)} — over the ${trip.target}-year target. Go faster.`;
        if (ok) done();
        return;
      }
      set("d", `${dd.toFixed(2)} ly`); set("v", `${trip.beta.toFixed(3)} c`); set("ext", years(t)); set("ship", years(ship)); set("rem", `${(dd * (1 - frac)).toFixed(2)} ly`); set("pct", `${(frac * 100).toFixed(1)}%`);
    },
  });
  lesson.prepend(
    el("p", {}, `Mission: reach ${trip.dest.name} (${d().toFixed(2)} ly) with no more than ${trip.target} years on the ship's clock.`),
  );
  const q = el("div");
  lesson.prepend(q);
  choiceCheck(q, {
    question: "Before you fly: which clock will record less time over the trip?",
    options: ["ship less", "outside less", "same"], correct: "ship less",
    explain: "The ship's clock records less (by the factor γ).",
    onCorrect: () => (trip.prediction = "ship less"),
  });
  slider(lesson, { label: "cruise speed", min: 0.01, max: 0.999, step: 0.001, value: trip.beta, format: (v) => `${v.toFixed(3)} c`, oninput: (v) => { trip.beta = v; scene.s.t = 0; scene.s.playing = false; } });
  const need = el("p", { class: "note" }, `Minimum speed for the target: ${P.betaForShipTime(d(), trip.target).toFixed(3)} c (you can check your choice against this after a run).`);
  need.hidden = true;
  lesson.append(el("div", { class: "nav" },
    el("button", { class: "sl-btn", onclick: () => { if (!trip.prediction) { fb.className = "feedback bad"; fb.textContent = "Make your prediction first."; return; } scene.s.t = 0; scene.s.playing = true; ran = true; } }, "fly"),
  ), fb, need);
  return scene.stop;
}

// ---------- 7. mastery ----------
function stepMastery({ lesson, stage, done, ctx, refreshNav }, trip) {
  stage.append(el("div", { style: "padding:80px 30px;font:14px 'Courier New',monospace;color:#fff;max-width:640px" },
    el("p", {}, "Why do the clocks disagree?"),
    el("p", { style: "color:#888" }, "Choose every statement that belongs in the explanation."),
  ));
  const reasons = [
    ["path longer at same speed", "In the outside frame, the light-clock's light follows a longer path at the same speed c, so each tick takes longer."],
    ["each clock normal locally", "Each clock runs normally for whoever travels with it; the difference shows up when the frames' measurements are compared."],
    ["frames disagree on distance", "In the ship's frame the distance is contracted, so the shorter ship time is consistent with the same speed."],
    ["light slows down", "Light slows down aboard a fast ship."],
    ["signal delay", "The difference is just the delay of light signals reaching the observer."],
  ];
  const chosen = new Set();
  const list = el("div", { class: "choices" });
  for (const [key, text] of reasons) {
    const b = el("button", { class: "sl-btn", onclick: () => { chosen.has(key) ? chosen.delete(key) : chosen.add(key); b.classList.toggle("on"); } }, text);
    list.append(b);
  }
  const fb = el("div", { class: "feedback" });
  lesson.append(
    el("p", {}, "Last step. Your prediction, calibration, and planned trip are checked together with your explanation."),
    list,
    el("div", { class: "control" }, el("button", { class: "sl-btn", onclick: submit }, "submit challenge")),
    fb,
  );
  async function submit() {
    if (!trip.completed) { fb.className = "feedback bad"; fb.textContent = "Complete a trip that meets its target in the previous step first."; return; }
    const answers = {
      prediction: trip.prediction,
      calibrationShip: ctx.store.get().level3.calibrationPassed ? 6 : null,
      destinationLy: trip.completed.destinationLy,
      beta: trip.completed.beta,
      targetShipYears: trip.completed.targetShipYears,
      explanation: [...chosen],
    };
    try {
      const res = await ctx.api("POST", "/api/mastery/level3", { answers });
      ctx.store.set({ version: res.version, progress: res.progress });
      fb.className = `feedback ${res.check.passed ? "good" : "bad"}`;
      fb.textContent = res.check.passed ? "Challenge complete. You've finished the game — Explore mode is yours." : `Not yet: ${res.check.issues.join("; ")}.`;
      if (res.check.passed) { done(); refreshNav(); }
    } catch (e) { fb.className = "feedback bad"; fb.textContent = e.message; }
  }
}
