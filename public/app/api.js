// Small fetch wrapper for the starlight API. Mutations carry the CSRF header.
export async function api(method, path, body) {
  const res = await fetch(path, {
    method,
    credentials: "same-origin",
    headers: body !== undefined ? { "content-type": "application/json", "x-starlight": "1" } : {},
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(json.error || `Request failed (${res.status})`);
    err.status = res.status;
    err.body = json;
    throw err;
  }
  return json;
}

// Progress store: keeps the latest server copy and saves with compare-and-swap.
// Saves are queued so two quick saves from this tab never race each other; a conflict
// (another tab or device saved first) refreshes and retries once.
export function createProgressStore(initial) {
  let state = initial; // { version, progress }
  let queue = Promise.resolve();
  const listeners = new Set();
  const emit = () => listeners.forEach((fn) => fn(state.progress));

  async function saveNow(update) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        state = await api("PUT", "/api/progress", { version: state.version, progress: update });
        emit();
        return state.progress;
      } catch (e) {
        if (e.status !== 409 || attempt) throw e;
        state = await api("GET", "/api/progress");
      }
    }
  }

  return {
    get: () => state.progress,
    set(next) { if (!state || next.version >= state.version) { state = next; emit(); } },
    onChange(fn) { listeners.add(fn); return () => listeners.delete(fn); },
    save(update) {
      const p = queue.then(() => saveNow(update));
      queue = p.catch(() => {});
      return p;
    },
  };
}
