// Shared bits for level screens: DOM helper, layout, step navigation, formatting.

export const el = (tag, attrs = {}, ...kids) => {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === "class") e.className = v;
    else if (k === "html") e.innerHTML = v;
    else if (k.startsWith("on")) e.addEventListener(k.slice(2), v);
    else if (v !== false && v != null) e.setAttribute(k, v === true ? "" : v);
  }
  for (const kid of kids.flat()) if (kid != null && kid !== false) e.append(kid.nodeType ? kid : document.createTextNode(kid));
  return e;
};

// Scientific notation with Unicode superscripts: 8.99 × 10¹⁶
const SUP = { "-": "⁻", 0: "⁰", 1: "¹", 2: "²", 3: "³", 4: "⁴", 5: "⁵", 6: "⁶", 7: "⁷", 8: "⁸", 9: "⁹" };
export function sci(x, digits = 3) {
  if (x === 0) return "0";
  if (!Number.isFinite(x)) return "∞";
  const e = Math.floor(Math.log10(Math.abs(x)));
  if (e >= -2 && e < 5) return Number(x.toPrecision(digits)).toLocaleString();
  const m = x / 10 ** e;
  return `${m.toFixed(digits - 1)} × 10${String(e).replace(/./g, (c) => SUP[c])}`;
}

export function parseSci(text) {
  // "7.35 × 10²² kg" -> 7.35e22
  const m = String(text || "").match(/([\d.]+)\s*×\s*10([⁻⁰¹²³⁴⁵⁶⁷⁸⁹]+)/);
  if (!m) return null;
  const inv = Object.fromEntries(Object.entries(SUP).map(([k, v]) => [v, k]));
  return Number(m[1]) * 10 ** Number(m[2].replace(/./g, (c) => inv[c]));
}

// Build the standard level layout and a step runner.
//   steps: [{ id, title, kicker, render(ui) -> cleanup? }]
//   ui passed to render: { lesson, stage, done(), next(), setNext(enabled) }
export function runLevel(host, { level, title, steps, ctx, startAt }) {
  const stage = el("div", { class: "stage" });
  const lesson = el("aside", { class: "lesson" });
  host.append(el("div", { class: "level-view" }, stage, lesson));
  let index = Math.max(0, steps.findIndex((s) => s.id === startAt));
  let cleanup = null;
  const key = `level${level}`;

  const progress = () => ctx.store.get()[key];
  const isDone = (id) => progress().completed.includes(id);

  async function markDone(id) {
    if (!isDone(id)) await ctx.store.save({ [key]: { completed: [id] } });
    navButtons();
  }

  let nextBtn, nav = null; // the level's own step navigation (steps may have their own .nav rows)
  function navButtons() {
    const s = steps[index];
    if (!nav) return;
    nav.innerHTML = "";
    nav.append(
      el("button", { class: "sl-btn quiet", onclick: () => ctx.exit() }, "← levels"),
      index > 0 ? el("button", { class: "sl-btn", onclick: () => go(index - 1) }, "back") : null,
    );
    nextBtn = el("button", { class: "sl-btn", disabled: !(isDone(s.id) || s.free) }, index === steps.length - 1 ? "finish" : "next");
    nextBtn.addEventListener("click", () => (index === steps.length - 1 ? (s.onFinish ? s.onFinish() : ctx.exit()) : go(index + 1)));
    nav.append(nextBtn);
  }

  async function go(i) {
    cleanup?.();
    cleanup = null;
    index = i;
    const s = steps[i];
    stage.innerHTML = "";
    lesson.innerHTML = "";
    lesson.append(
      el("div", { class: "kicker" }, `level ${level} · ${title} · ${i + 1}/${steps.length}`),
      el("h2", {}, s.title),
    );
    const body = el("div", { class: "body" });
    nav = el("div", { class: "nav level-nav" });
    lesson.append(body, nav);
    ctx.store.save({ [key]: { step: s.id } }).catch(() => {});
    cleanup = s.render({ lesson: body, stage, done: () => markDone(s.id), refreshNav: navButtons, ctx }) || null;
    navButtons();
  }

  go(index);
  return { unmount: () => { cleanup?.(); host.innerHTML = ""; } };
}

// A multiple-choice check. onCorrect runs once when answered correctly.
export function choiceCheck(container, { question, options, correct, explain, onCorrect }) {
  const fb = el("div", { class: "feedback" });
  const wrap = el("div", { class: "control" }, el("p", {}, question), el("div", { class: "choices" },
    options.map((o) => el("button", {
      class: "sl-btn",
      onclick: () => {
        const ok = o === correct;
        fb.className = `feedback ${ok ? "good" : "bad"}`;
        fb.textContent = ok ? `Yes. ${explain}` : "Not quite; try again.";
        if (ok) onCorrect?.();
      },
    }, o))), fb);
  container.append(wrap);
  return wrap;
}

export function slider(container, { label, min, max, step = "any", value, format = (v) => v, oninput }) {
  const out = el("span", {}, format(value));
  const input = el("input", { type: "range", min, max, step, value });
  input.addEventListener("input", () => { out.textContent = format(Number(input.value)); oninput(Number(input.value)); });
  container.append(el("div", { class: "control" }, el("label", {}, el("span", {}, label), out), input));
  return { input, out, set(v) { input.value = v; out.textContent = format(v); } };
}

export function readout(container, rows) {
  const box = el("div", { class: "readout" });
  const cells = {};
  for (const [key, label] of rows) {
    cells[key] = el("span", {}, "—");
    box.append(el("div", {}, el("span", {}, label), cells[key]));
  }
  container.append(box);
  return (key, text) => { cells[key].textContent = text; };
}
