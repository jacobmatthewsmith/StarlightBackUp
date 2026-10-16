// Level 1 — gravity & motion.
// account → mass & energy → 3D gravity → Newtonian motion → build a system →
// stability trial (server-checked) → gravity at human scale (transition to Level 2).

import * as P from "../../shared/physics.js";
import { createView, drawGravityDots, tilt, add, scale, len, GRAVITY_RED } from "../../shared/view3d.js";
import { drawSystem } from "../../shared/systemview.js";
import { el, sci, parseSci, runLevel, choiceCheck, slider, readout } from "./common.js";

const TNT_TON = 4.184e9; // J, by definition

export function mount(host, ctx) {
  const progress = ctx.store.get().level1;
  const shared = { system: null, savedVersion: null, dirty: true };

  return runLevel(host, {
    level: 1,
    title: "gravity & motion",
    ctx,
    startAt: progress.step,
    steps: [
      { id: "account", title: "your account", render: stepAccount },
      { id: "mass-energy", title: "mass and energy", render: stepMassEnergy },
      { id: "gravity-3d", title: "gravity in three dimensions", render: stepGravity },
      { id: "motion", title: "Newtonian motion", render: stepMotion },
      { id: "build", title: "build a star system", render: (ui) => stepBuild(ui, shared) },
      { id: "trial", title: "the stability trial", render: (ui) => stepTrial(ui, shared) },
      { id: "human-gravity", title: "gravity at human scale", render: stepHuman, onFinish: () => ctx.next(2) },
    ],
  });
}

// ---------- 1. account ----------
function stepAccount({ lesson, stage, done, ctx }) {
  stage.append(el("div", { style: "display:grid;place-items:center;height:100%;font:bold 28px 'Courier New',monospace;color:#fff" }, ctx.user.displayName));
  lesson.append(
    el("p", {}, `Welcome, ${ctx.user.displayName}. Your account is ready: it saves where you are, and the star systems you build.`),
    el("p", {}, "Level 1 is about what gravity is made from (mass) and what it does (motion). It ends with you building a star system that has to survive a stability trial."),
  );
  done();
}

// ---------- 2. mass and energy ----------
function stepMassEnergy({ lesson, stage, done }) {
  const canvas = el("canvas");
  stage.append(canvas);
  const view = createView(canvas, { distance: 6, pitch: 0.3 });
  let massKg = 1;
  view.loop(() => {
    const r = 6 + 10 * (Math.log10(massKg) + 3) / 6; // 1 g .. 1000 kg
    const c = view.ctx;
    c.fillStyle = "#fff";
    c.beginPath();
    c.arc(view.W / 2, view.H / 2, r, 0, Math.PI * 2);
    c.fill();
    c.font = '13px "Courier New", monospace';
    c.textAlign = "center";
    c.fillText(`${sci(massKg)} kg`, view.W / 2, view.H / 2 + r + 22);
    c.textAlign = "left";
  });

  lesson.append(
    el("p", {}, "Mass is a kind of energy. Einstein's equation says how much:"),
    el("p", { style: "font-size:20px;text-align:center" }, "E = m c²"),
    el("p", { class: "note" }, "c is the speed of light, 299,792,458 m/s. Squared, it's an enormous number, so a little mass is a lot of energy."),
  );
  const set = readout(lesson, [["m", "mass"], ["e", "rest energy"], ["tnt", "TNT equivalent"]]);
  const update = () => {
    const E = P.restEnergy(massKg);
    set("m", `${sci(massKg)} kg`);
    set("e", `${sci(E)} J`);
    set("tnt", `${sci(E / TNT_TON)} tons`);
  };
  slider(lesson, { label: "mass", min: -3, max: 3, step: 0.01, value: 0, format: (v) => `${sci(10 ** v)} kg`, oninput: (v) => { massKg = 10 ** v; update(); } });
  update();
  lesson.append(el("p", { class: "note" }, "A ton of TNT is defined as 4.184 × 10⁹ joules. Mass is also what gravity comes from — that's the next step."));
  choiceCheck(lesson, {
    question: "If you double the mass, the rest energy…",
    options: ["stays the same", "doubles", "quadruples"],
    correct: "doubles",
    explain: "E is proportional to m; c² is a constant.",
    onCorrect: done,
  });
  return () => view.destroy();
}

// ---------- 3. gravity in 3D ----------
function stepGravity({ lesson, stage, done }) {
  const canvas = el("canvas");
  stage.append(canvas);
  const view = createView(canvas, { distance: 14, pitch: 0.55 });
  let massSun = 1, probe = 2; // AU
  const accelAU = (p) => P.accelerationAt([{ m: massSun, x: [0, 0, 0] }], p, -1, 0.04);
  view.loop(() => {
    drawGravityDots(view, accelAU, { sources: [{ pos: [0, 0, 0], rMin: 0.25, rMax: 6, perShell: 34 }], ref: P.G_AU / 4 });
    view.dot([0, 0, 0], 7, "#fff");
    view.label([0, 0, 0], "star", { dx: 10 });
    view.orbit(probe, 0, 0, "rgba(255,255,255,0.35)");
    const pp = view.dot([probe, 0, 0], 4, "#fff");
    view.label([probe, 0, 0], "probe", { dx: 8 });
    if (pp) {
      const a = accelAU([probe, 0, 0]);
      view.line([probe, 0, 0], add([probe, 0, 0], scale(a, 1.2 / len(a))), `rgba(${GRAVITY_RED},0.95)`, 2);
    }
  });

  lesson.append(
    el("p", {}, "Every mass pulls on every other mass. The ", el("span", { class: "gravity" }, "red dots"), " sample the space around a star in three dimensions, packed closer together near the star, where the pull changes fastest. Each shows the ", el("b", {}, "gravitational acceleration"), " at that point: how quickly something placed there would start speeding up toward the star. Bigger, brighter dots mean a stronger pull; each tick points the way it pulls."),
    el("p", { class: "note" }, "Drag the view to turn it, scroll to zoom. The dots are samples of the pull, not material in space."),
  );
  const set = readout(lesson, [["d", "probe distance"], ["a", "acceleration there"]]);
  const update = () => {
    const aSI = (P.G * massSun * P.M_SUN) / (probe * P.AU) ** 2;
    set("d", `${probe.toFixed(2)} AU`);
    set("a", `${sci(aSI)} m/s²`);
  };
  slider(lesson, { label: "star mass", min: 0.1, max: 5, step: 0.05, value: 1, format: (v) => `${v.toFixed(2)} M☉`, oninput: (v) => { massSun = v; update(); } });
  slider(lesson, { label: "probe distance", min: 0.5, max: 5, step: 0.05, value: 2, format: (v) => `${v.toFixed(2)} AU`, oninput: (v) => { probe = v; update(); } });
  update();
  lesson.append(el("p", {}, "Newton's law: a = G M / r². Try doubling the distance and watch the number."));
  choiceCheck(lesson, {
    question: "Move twice as far from the star. The acceleration becomes…",
    options: ["half as strong", "a quarter as strong", "the same"],
    correct: "a quarter as strong",
    explain: "Gravity falls off with the square of distance: (1/2)² = 1/4.",
    onCorrect: done,
  });
  return () => view.destroy();
}

// ---------- 4. Newtonian motion ----------
function stepMotion({ lesson, stage, done }) {
  const canvas = el("canvas");
  stage.append(canvas);
  const view = createView(canvas, { distance: 9, pitch: 1.1, yaw: 0 });
  let k = 0.7; // launch speed as a fraction of circular speed at 1 AU
  let body, trail, status, sweep, orbited = false, everOrbited = false, answered = false;
  const reset = () => {
    orbited = false;
    body = { x: [1, 0, 0], v: [0, k * 2 * Math.PI, 0] };
    trail = [];
    status = "flying";
    sweep = 0;
  };
  reset();
  const star = [{ m: 1, x: [0, 0, 0] }];
  view.loop((dt) => {
    if (status === "flying") {
      const sub = 40, h = (dt * 0.6) / sub; // playback: 0.6 years per second
      for (let s = 0; s < sub; s++) {
        const a = P.accelerationAt(star, body.x);
        for (let i = 0; i < 3; i++) body.v[i] += a[i] * h;
        const before = Math.atan2(body.x[1], body.x[0]);
        for (let i = 0; i < 3; i++) body.x[i] += body.v[i] * h;
        let d = Math.atan2(body.x[1], body.x[0]) - before;
        if (d < -Math.PI) d += 2 * Math.PI;
        if (d > Math.PI) d -= 2 * Math.PI;
        sweep += d;
        const r = len(body.x);
        const E = 0.5 * len(body.v) ** 2 - P.G_AU / r;
        if (r < 0.06) { status = "fell into the star"; break; }
        if (E > 0 && r > 6) { status = "escaped"; break; }
        if (!orbited && Math.abs(sweep) >= 2 * Math.PI && E < 0) orbited = everOrbited = true;
      }
      trail.push([...body.x]);
      if (trail.length > 2000) trail.shift();
      setStatus();
    }
    view.dot([0, 0, 0], 7, "#fff");
    view.path(trail, "rgba(255,255,255,0.35)");
    const p = view.dot(body.x, 4, "#fff");
    if (p && status !== "fell into the star") {
      const v = body.v, a = P.accelerationAt(star, body.x);
      view.line(body.x, add(body.x, scale(v, 0.12)), "rgba(255,255,255,0.9)", 1.5);
      view.line(body.x, add(body.x, scale(a, 0.6 / Math.max(1, len(a)) * 0.5)), `rgba(${GRAVITY_RED},0.95)`, 2);
      view.label(body.x, "v", { dx: 8, dy: -8 });
    }
  });

  lesson.append(
    el("p", {}, "Newton: a body keeps moving in a straight line unless a force acts (first law), and the force changes its velocity (second law: F = m a). Here the only force is the star's gravity."),
    el("p", {}, "Launch a planet sideways from 1 AU. ", el("span", { class: "gravity" }, "Red"), " is its acceleration (always toward the star); white is its velocity."),
  );
  const set = readout(lesson, [["pos", "distance from star"], ["vel", "speed"], ["acc", "acceleration"], ["st", "status"]]);
  function setStatus() {
    const a = P.accelerationAt(star, body.x);
    set("pos", `${len(body.x).toFixed(2)} AU`);
    set("vel", `${(len(body.v) * P.AU / P.YEAR / 1000).toFixed(1)} km/s`);
    set("acc", `${sci(len(a) * P.AU / P.YEAR ** 2)} m/s²`);
    set("st", status === "flying" ? (orbited ? "in orbit (continuous free fall)" : "flying") : status);
    if (everOrbited && answered) done();
  }
  slider(lesson, { label: "launch speed", min: 0.2, max: 1.6, step: 0.01, value: k, format: (v) => `${(v * 29.8).toFixed(1)} km/s (${v.toFixed(2)}× circular)`, oninput: (v) => { k = v; reset(); } });
  lesson.append(el("div", { class: "control" }, el("button", { class: "sl-btn", onclick: reset }, "launch again")));
  lesson.append(el("p", { class: "note" }, "Too slow and it falls inward; fast enough (√2 × circular) and it escapes. In between, it orbits."));
  choiceCheck(lesson, {
    question: "Why doesn't an orbiting planet fall into its star?",
    options: ["Gravity switches off in orbit", "It is falling, but moving sideways fast enough to keep missing", "The star pushes it away"],
    correct: "It is falling, but moving sideways fast enough to keep missing",
    explain: "An orbit is continuous free fall. Now get a planet into orbit (status: in orbit).",
    onCorrect: () => { answered = true; if (everOrbited) done(); },
  });
  return () => view.destroy();
}

// ---------- 5. build a system ----------
const DEFAULT_SYSTEM = () => ({
  name: "my first system",
  star: { name: "my star", massSun: 1 },
  planets: [
    { name: "first", massEarth: 1, aAU: 1, inclinationDeg: 0, nodeDeg: 0, phaseDeg: 0 },
    { name: "second", massEarth: 95, aAU: 4, inclinationDeg: 6, nodeDeg: 40, phaseDeg: 120 },
  ],
});

async function loadOrCreate(ctx, shared) {
  if (shared.system) return;
  const id = ctx.store.get().level1.systemId;
  const list = (await ctx.api("GET", "/api/systems")).systems;
  const pick = id ? list.find((s) => s.id === id) : list[0];
  if (pick) {
    const { system } = await ctx.api("GET", `/api/systems/${encodeURIComponent(pick.id)}`);
    shared.system = system;
    shared.savedVersion = system.version;
    shared.dirty = false;
  } else {
    shared.system = DEFAULT_SYSTEM();
    shared.dirty = true;
  }
}

function stepBuild({ lesson, stage, done, ctx }, shared) {
  const canvas = el("canvas");
  stage.append(canvas);
  const view = createView(canvas, { distance: 16, pitch: 0.6 });
  let dots = true, t = 0;
  view.loop((dt) => {
    t += dt;
    if (!shared.system) return;
    const extent = drawSystem(view, shared.system, t, { dots });
    view.distance += (extent * 3.2 - view.distance) * 0.03;
  });

  const status = el("div", { class: "feedback" });
  const form = el("div");
  lesson.append(
    el("p", {}, "Design a star system: choose the star's mass, then each planet's mass, its distance from the star, and the tilt and direction of its orbital plane. Save it, and the next step puts it through a stability trial."),
    form,
    el("label", { class: "control", style: "display:flex;gap:8px;align-items:center;font-size:12px" },
      el("input", { type: "checkbox", checked: true, onchange: (e) => (dots = e.target.checked) }), el("span", { class: "gravity" }, "show red gravity dots")),
    status,
  );

  const markDirty = () => { shared.dirty = true; status.className = "feedback"; status.textContent = "unsaved changes"; };

  function renderForm() {
    const s = shared.system;
    form.innerHTML = "";
    const nameIn = el("input", { value: s.name, maxlength: 60, style: "width:100%;font:14px 'Courier New',monospace;background:#000;color:#fff;border:1px solid #666;padding:5px" });
    nameIn.addEventListener("input", () => { s.name = nameIn.value; markDirty(); });
    form.append(el("div", { class: "control" }, el("label", {}, el("span", {}, "system name")), nameIn));
    slider(form, { label: "star mass", min: Math.log10(P.LIMITS.starMassSun[0]), max: Math.log10(P.LIMITS.starMassSun[1]), step: 0.01, value: Math.log10(s.star.massSun), format: (v) => `${(10 ** v).toFixed(2)} M☉`, oninput: (v) => { s.star.massSun = +(10 ** v).toFixed(3); markDirty(); } });
    s.planets.forEach((p, i) => {
      const box = el("div", { style: "border-top:1px solid #333;margin-top:10px;padding-top:6px" });
      const pn = el("input", { value: p.name, maxlength: 40, style: "font:13px 'Courier New',monospace;background:#000;color:#fff;border:1px solid #555;padding:3px;width:60%" });
      pn.addEventListener("input", () => { p.name = pn.value; markDirty(); });
      box.append(el("div", { style: "display:flex;gap:6px;align-items:center" }, pn,
        s.planets.length > 1 ? el("button", { class: "sl-btn quiet", onclick: () => { s.planets.splice(i, 1); markDirty(); renderForm(); } }, "remove") : null));
      slider(box, { label: "mass", min: -2, max: Math.log10(5000), step: 0.01, value: Math.log10(p.massEarth), format: (v) => `${sci(10 ** v)} M⊕`, oninput: (v) => { p.massEarth = +(10 ** v).toPrecision(3); markDirty(); } });
      slider(box, { label: "orbital distance", min: Math.log10(0.05), max: Math.log10(60), step: 0.005, value: Math.log10(p.aAU), format: (v) => `${(10 ** v).toFixed(2)} AU`, oninput: (v) => { p.aAU = +(10 ** v).toFixed(3); markDirty(); } });
      slider(box, { label: "orbital plane tilt", min: 0, max: 90, step: 1, value: p.inclinationDeg, format: (v) => `${v}°`, oninput: (v) => { p.inclinationDeg = v; markDirty(); } });
      slider(box, { label: "tilt direction", min: 0, max: 359, step: 1, value: p.nodeDeg, format: (v) => `${v}°`, oninput: (v) => { p.nodeDeg = v; markDirty(); } });
      form.append(box);
    });
    form.append(el("div", { class: "nav" },
      s.planets.length < P.LIMITS.planets[1] ? el("button", { class: "sl-btn", onclick: () => {
        const outer = Math.max(...s.planets.map((q) => q.aAU));
        s.planets.push({ name: `planet ${s.planets.length + 1}`, massEarth: 10, aAU: Math.min(60, +(outer * 1.8).toFixed(2)), inclinationDeg: 0, nodeDeg: 0, phaseDeg: (s.planets.length * 97) % 360 });
        markDirty(); renderForm();
      } }, "add planet") : null,
      el("button", { class: "sl-btn", onclick: save }, "save system"),
    ));
  }

  async function save() {
    const s = shared.system;
    const errors = P.validateSystem(s);
    if (errors.length) { status.className = "feedback bad"; status.textContent = errors[0]; return; }
    try {
      const out = s.id
        ? await ctx.api("PUT", `/api/systems/${encodeURIComponent(s.id)}`, { expectedVersion: shared.savedVersion, system: s })
        : await ctx.api("POST", "/api/systems", { system: s });
      shared.system = out.system;
      shared.savedVersion = out.system.version;
      shared.dirty = false;
      status.className = "feedback good";
      status.textContent = `saved (version ${out.system.version})`;
      done();
    } catch (e) {
      status.className = "feedback bad";
      status.textContent = e.message;
    }
  }

  loadOrCreate(ctx, shared).then(() => {
    renderForm();
    if (!shared.dirty) { status.className = "feedback good"; status.textContent = `loaded "${shared.system.name}" (version ${shared.savedVersion})`; }
  }).catch((e) => { status.className = "feedback bad"; status.textContent = e.message; });
  return () => view.destroy();
}

// ---------- 6. stability trial ----------
function stepTrial({ lesson, stage, done, ctx, refreshNav }, shared) {
  const canvas = el("canvas");
  stage.append(canvas);
  const view = createView(canvas, { distance: 16, pitch: 0.6 });
  let sim = null, trails = [], simYears = 0;
  view.loop((dt) => {
    if (!sim) {
      if (shared.system) drawSystem(view, shared.system, 0, { dots: false });
      return;
    }
    const inner = Math.min(...shared.system.planets.map((p) => p.aAU));
    const h = Math.sqrt(inner ** 3 / shared.system.star.massSun) / 80;
    for (let s = 0; s < 30; s++) { P.step(sim, h); simYears += h; }
    sim.forEach((b, i) => { (trails[i] ||= []).push([...b.x]); if (trails[i].length > 600) trails[i].shift(); });
    sim.forEach((b, i) => {
      if (i === 0) { view.dot(b.x, 7, "#fff"); return; }
      view.path(trails[i], "rgba(255,255,255,0.3)");
      view.dot(b.x, 3.5, "#fff");
      view.label(b.x, b.name);
    });
    const extent = Math.max(...shared.system.planets.map((p) => p.aAU)) * 1.15;
    view.distance += (extent * 3.2 - view.distance) * 0.03;
    view.ctx.font = '11px "Courier New", monospace';
    view.ctx.fillStyle = "#888";
    view.ctx.fillText(`simulated: ${simYears.toFixed(1)} years · playback accelerated`, 16, view.H - 16);
  });

  const out = el("div");
  const runBtn = el("button", { class: "sl-btn", onclick: run }, "run the stability trial");
  lesson.append(
    el("p", {}, "Every planet tugs on every other planet. The trial simulates your whole system with full Newtonian gravity between all bodies, for 10 orbits of the outermost planet."),
    el("p", { class: "note" }, "It fails if a planet is flung out, falls into the star, or two planets come within 3 mutual Hill radii of each other (close enough for one to capture or scatter the other). The game's server re-runs the same calculation to confirm your result."),
    el("div", { class: "control" }, runBtn),
    out,
  );

  async function run() {
    out.innerHTML = "";
    if (!shared.system?.id || shared.dirty) {
      out.append(el("div", { class: "feedback bad" }, "Save your system in the previous step first."));
      return;
    }
    runBtn.disabled = true;
    sim = P.initialState(shared.system);
    sim[0].name = shared.system.star.name;
    trails = [];
    simYears = 0;
    try {
      const res = await ctx.api("POST", "/api/mastery/level1", { systemId: shared.system.id });
      ctx.store.set({ version: res.version, progress: res.progress });
      const t = res.trial;
      out.append(
        el("div", { class: `feedback ${t.passed ? "good" : "bad"}` }, `${t.passed ? "PASSED" : "FAILED"}: ${t.reason}`),
        el("table", {},
          el("tr", {}, el("td", {}, "simulated"), el("td", {}, `${t.years} years (${t.steps.toLocaleString()} steps)`)),
          t.energyDrift != null ? el("tr", {}, el("td", {}, "energy drift"), el("td", {}, `${t.energyDrift} (numerical accuracy check)`)) : null,
          ...t.spacing.map((s) => el("tr", {}, el("td", {}, `${s.inner} ↔ ${s.outer}`), el("td", {}, `${s.hillRadii.toFixed(1)} mutual Hill radii apart`))),
        ),
        el("p", { class: "note" }, "Rule of thumb: neighbouring planets spaced more than about 10 mutual Hill radii apart tend to stay stable for a long time."),
      );
      if (t.passed) {
        done();
        refreshNav();
      } else {
        out.append(el("p", {}, "Go back, spread the planets further apart or make them lighter, save, and try again."));
      }
    } catch (e) {
      out.append(el("div", { class: "feedback bad" }, e.message));
    } finally {
      runBtn.disabled = false;
    }
  }

  loadOrCreate(ctx, shared).catch(() => {});
  return () => view.destroy();
}

// ---------- 7. gravity at human scale ----------
function stepHuman({ lesson, stage, done }) {
  const worlds = [];
  const solar = typeof SOLAR_SYSTEM !== "undefined" ? SOLAR_SYSTEM : null;
  if (solar) {
    for (const b of solar.bodies) {
      if (b.kind === "planet" && b.mass && b.radiusKm) worlds.push({ name: b.name, g: P.surfaceGravity(b.mass * P.M_EARTH, b.radiusKm * 1000), gas: ["Jupiter", "Saturn", "Uranus", "Neptune"].includes(b.name) });
      if (b.name === "Pluto") { const m = parseSci(b.massText); if (m && b.radiusKm) worlds.push({ name: "Pluto", g: P.surfaceGravity(m, b.radiusKm * 1000) }); }
      for (const m of b.moons || []) if (m.name === "Moon") { const mk = parseSci(m.massText); if (mk) worlds.push({ name: "the Moon", g: P.surfaceGravity(mk, m.radiusKm * 1000) }); }
    }
  }
  worlds.sort((a, b) => a.g - b.g);
  let massKg = 70;

  const canvas = el("canvas");
  stage.append(canvas);
  const c = canvas.getContext("2d");
  let raf;
  const draw = () => {
    const dpr = devicePixelRatio || 1, r = canvas.getBoundingClientRect();
    canvas.width = r.width * dpr; canvas.height = r.height * dpr;
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    c.clearRect(0, 0, r.width, r.height);
    const maxG = Math.max(...worlds.map((w) => w.g));
    const top = 90, rowH = Math.min(40, (r.height - top - 40) / worlds.length);
    c.font = '12px "Courier New", monospace';
    worlds.forEach((w, i) => {
      const y = top + i * rowH;
      const bw = (r.width - 260) * (w.g / maxG);
      c.fillStyle = "#fff";
      c.fillText(w.name, 20, y + rowH * 0.55);
      c.fillStyle = `rgba(${GRAVITY_RED},0.85)`;
      c.fillRect(130, y + rowH * 0.25, bw, rowH * 0.4);
      c.fillStyle = "#bbb";
      c.fillText(`${(massKg * w.g / 9.80665).toFixed(0)} kg-weight`, 140 + bw, y + rowH * 0.55);
    });
    raf = requestAnimationFrame(draw);
  };
  raf = requestAnimationFrame(draw);

  lesson.append(
    el("p", {}, "The same law that holds planets in orbit holds you on the ground. Your weight is your mass times the local gravitational acceleration, W = m g, with g = G M / R² at a world's surface."),
  );
  slider(lesson, { label: "your mass", min: 20, max: 150, step: 1, value: massKg, format: (v) => `${v} kg`, oninput: (v) => { massKg = v; renderTable(); } });
  const table = el("table");
  lesson.append(table);
  function renderTable() {
    table.innerHTML = "";
    table.append(el("tr", {}, el("th", {}, "world"), el("th", {}, "g (m/s²)"), el("th", {}, "your weight")));
    for (const w of worlds) table.append(el("tr", {}, el("td", {}, w.name + (w.gas ? "*" : "")), el("td", {}, w.g.toFixed(2)), el("td", {}, `${(massKg * w.g).toFixed(0)} N`)));
  }
  renderTable();
  lesson.append(
    el("p", { class: "note" }, "g = GM/R² from NASA/JPL masses and mean radii, ignoring spin (fast-spinning giants feel a little lighter at their equators, so NASA's quoted values are slightly lower). *Gas giants have no solid surface; this is at about the 1-bar pressure level. Your mass is the same everywhere; your weight is not."),
    el("p", {}, "Gravity does one more thing, too subtle to feel: it changes how much time clocks record. Two clocks at different heights in the same gravity tick at slightly different rates. That's Level 2."),
  );
  done();
  return () => cancelAnimationFrame(raf);
}
