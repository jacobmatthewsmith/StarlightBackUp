// App shell: accounts, Game/Explore mode switch, level list, level loading.
// The intro (starlight.js) and the neighbourhood map (neighborhood.js) are classic
// scripts; this module talks to them through window hooks and DOM events.

import { api, createProgressStore } from "./api.js";
import "./explore/explore.js";

// The redesigned Game: three levels, one big idea each. Levels 2 and 3 are being rebuilt.
const LEVELS = [
  { n: 1, title: "gravity", line: "the solar system at true scale · launch, bend, orbit, slingshot", module: "./game/level1.js" },
  { n: 2, title: "the light clock", line: "same light, longer path", module: null },
  { n: 3, title: "near light speed", line: "a journey to Proxima Centauri", module: null },
];

const $ = (sel) => document.querySelector(sel);
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

const state = { user: null, store: null, level: null, mapReady: false };

// ---------- account panel ----------

function openAccount(mode = "signup") {
  const box = $("#account");
  const signup = mode === "signup";
  box.innerHTML = "";
  const err = el("div", { class: "error", role: "alert" });
  const form = el("form", { novalidate: true },
    el("h2", {}, signup ? "create your account" : "sign in"),
    el("p", {}, signup ? "Level 1 begins here. Your account keeps your progress, your star systems, and Explore mode." : "Welcome back."),
    signup ? [el("label", { for: "acc-name" }, "display name"), el("input", { id: "acc-name", name: "displayName", autocomplete: "nickname", required: true, maxlength: 32 })] : null,
    el("label", { for: "acc-email" }, "email (never shown to other players)"),
    el("input", { id: "acc-email", name: "email", type: "email", autocomplete: "email", required: true }),
    el("label", { for: "acc-pass" }, signup ? "password (10+ characters)" : "password"),
    el("input", { id: "acc-pass", name: "password", type: "password", autocomplete: signup ? "new-password" : "current-password", required: true, minlength: signup ? 10 : 1 }),
    err,
    el("div", { class: "row" },
      el("button", { class: "sl-btn", type: "submit" }, signup ? "create account" : "sign in"),
      el("button", { class: "sl-btn quiet", type: "button", onclick: () => openAccount(signup ? "login" : "signup") }, signup ? "have an account? sign in" : "new here? create one"),
      el("button", { class: "sl-btn quiet", type: "button", onclick: closeAccount }, "close"),
    ),
  );
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(form));
    err.textContent = "";
    try {
      const { user } = await api("POST", signup ? "/api/auth/signup" : "/api/auth/login", data);
      closeAccount();
      await signedIn(user, { justCreated: signup });
    } catch (ex) {
      err.textContent = ex.message;
    }
  });
  box.append(form);
  box.hidden = false;
  window.starlightPaused = false;
  form.querySelector("input").focus();
}

function closeAccount() {
  $("#account").hidden = true;
}

// ---------- signed-in shell ----------

async function signedIn(user, { justCreated = false } = {}) {
  state.user = user;
  state.store = createProgressStore(await api("GET", "/api/progress"));
  $("#auth-cta").classList.remove("show");
  renderTopbar();
  const p = state.store.get();
  // Carry over things done before signing in.
  const update = {};
  if (state.mapReady || p.intro.done || justCreated) update.intro = { done: true, ...(window.__foundClosest ? { foundClosest: true } : {}) };
  if (justCreated) update.mode = "game";
  if (Object.keys(update).length) await state.store.save(update);
  setMode(state.store.get().mode, { save: false });
}

function renderTopbar() {
  const bar = $("#topbar");
  const mode = state.store.get().mode;
  bar.innerHTML = "";
  bar.append(
    el("span", { class: "brand" }, "starlight"),
    el("nav", { class: "modes", "aria-label": "mode" },
      el("button", { class: `sl-btn${mode === "game" ? " on" : ""}`, onclick: () => setMode("game"), "aria-pressed": mode === "game" }, "game"),
      el("button", { class: `sl-btn${mode === "explore" ? " on" : ""}`, onclick: () => setMode("explore"), "aria-pressed": mode === "explore" }, "explore"),
    ),
    el("span", { class: "who" }, state.user.displayName),
    el("button", { class: "sl-btn quiet", onclick: signOut }, "sign out"),
  );
  bar.hidden = false;
  document.body.classList.add("has-topbar");
}

async function signOut() {
  await api("POST", "/api/auth/logout", {});
  location.reload();
}

// Switching modes only changes what's on screen; progress is saved either way.
async function setMode(mode, { save = true } = {}) {
  // Choosing a mode means they're past the intro, whether or not they watched it all.
  if (save) await state.store.save({ mode, intro: { done: true } });
  renderTopbar();
  if (mode === "game") {
    window.dispatchEvent(new CustomEvent("starlight:leave-explore"));
    window.starlightPaused = true;
    document.body.classList.add("mode-game");
    document.body.classList.remove("mode-explore");
    $("#game").hidden = false;
    if (state.level) return; // stay inside the open level
    renderGameHome();
  } else {
    closeLevel();
    $("#game").hidden = true;
    document.body.classList.remove("mode-game");
    document.body.classList.add("mode-explore");
    window.starlightPaused = false;
    window.starlightSkipToMap?.();
    window.dispatchEvent(new CustomEvent("starlight:explore", { detail: { store: state.store, user: state.user } }));
  }
}

// ---------- game home ----------

const unlocked = (p, n) => LEVELS.find((L) => L.n === n)?.module != null;

function renderGameHome() {
  const game = $("#game");
  game.innerHTML = "";
  const list = el("ol", { class: "game-levels" });
  for (const L of LEVELS) {
    const open = unlocked(null, L.n);
    list.append(el("li", { class: open ? "" : "locked" },
      el("button", { class: "level-row", disabled: !open, onclick: () => openLevel(L) },
        el("span", { class: "n" }, String(L.n)),
        el("span", { class: "title" }, L.title),
        el("span", { class: "line" }, open ? L.line : "being rebuilt"))));
  }
  game.append(el("div", { class: "game-home" }, el("h1", {}, "game"), list));
}

async function openLevel(L) {
  closeLevel();
  const game = $("#game");
  game.innerHTML = "";
  const host = el("div", { class: "level-host" });
  game.append(host);
  const mod = await import(L.module);
  state.level = mod.mount(host, {
    api,
    store: state.store,
    user: state.user,
    exit: () => { closeLevel(); renderGameHome(); },
    next: (n) => { closeLevel(); const nextL = LEVELS.find((x) => x.n === n); if (nextL && unlocked(state.store.get(), n)) openLevel(nextL); else renderGameHome(); },
  });
}

function closeLevel() {
  state.level?.unmount?.();
  state.level = null;
}

// ---------- hooks from the intro / map ----------

window.addEventListener("starlight:map-ready", () => {
  state.mapReady = true;
  if (state.user) state.store?.save({ intro: { done: true } });
  else $("#auth-cta").classList.add("show");
});

window.addEventListener("starlight:closest-found", () => {
  window.__foundClosest = true;
  if (state.user) state.store?.save({ intro: { done: true, foundClosest: true } });
  else setTimeout(() => !state.user && openAccount("signup"), 3500);
});

// ---------- start ----------

$("#cta-signup").addEventListener("click", () => openAccount("signup"));
$("#cta-login").addEventListener("click", () => openAccount("login"));

(async () => {
  try {
    const { user } = await api("GET", "/api/me");
    if (!user) return; // the intro plays; the call to action appears with the map
    const progress = await api("GET", "/api/progress");
    if (!progress.progress.intro.done) {
      // Signed in but hasn't seen the intro: let it play, then hand over.
      state.user = user;
      state.store = createProgressStore(progress);
      renderTopbar();
      return;
    }
    await signedIn(user);
  } catch (e) {
    console.warn("starlight: offline or server unavailable", e);
  }
})();
