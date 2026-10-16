// The Explore guide: an optional AI helper for stars, space and finding things on the map.
// Its whole instruction set is server/harness/explore-guide.md (loaded verbatim as the
// system prompt). This file enforces the harness limits in code: Explore only, short
// questions, short answers, four tools, ≤3 tool calls, a daily cap, token logging, and a
// 100 ly limit on what it may show.

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { HttpError } from "./errors.js";
import { makeTools, TOOL_SCHEMAS } from "./tools.js";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const HARNESS = join(ROOT, "server", "harness", "explore-guide.md");
const MODEL = "gpt-5.6-sol";                   // via Portkey's OpenAI-compatible gateway
const GATEWAY = "https://api.portkey.ai/v1/chat/completions";
const MAX_TOOL_CALLS = 3;
const MAX_OUTPUT_TOKENS = 220;
const MAX_QUESTION = 280;
const DAILY_CAP = 25;
const MAX_LY = 100;
export const OFF_TOPIC = "I can only help with stars, space, and finding things on the map.";

function loadKey() {
  if (process.env.PORTKEY_API_KEY) return process.env.PORTKEY_API_KEY;
  try {
    // starlight/.env is a symlink to the one key file in AI Foundations/.env (never copied).
    const text = readFileSync(join(ROOT, ".env"), "utf8");
    const line = text.split("\n").find((l) => l.startsWith("PORTKEY_API_KEY="));
    return line ? line.slice("PORTKEY_API_KEY=".length).trim().replace(/^["']|["']$/g, "") : null;
  } catch { return null; }
}

const GUIDE_TOOLS = {
  search_universe: { description: TOOL_SCHEMAS.search_universe.description, params: { query: "name or catalog id" } },
  get_object: { description: TOOL_SCHEMAS.get_object.description, params: { id: "object id from a search" } },
  list_region_objects: { description: TOOL_SCHEMAS.list_region_objects.description, params: { x: "ly", y: "ly", z: "ly", radius_ly: "ly (max 100)" } },
  show_on_map: { description: "Fly the player's map to this object and open its card. Only objects within 100 light years.", params: { id: "object id" } },
};
const NUMERIC = new Set(["x", "y", "z", "radius_ly"]);
const toolDefs = () => Object.entries(GUIDE_TOOLS).map(([name, t]) => ({
  type: "function",
  function: {
    name,
    description: t.description,
    parameters: { type: "object", properties: Object.fromEntries(Object.entries(t.params).map(([k, d]) => [k, { type: NUMERIC.has(k) ? "number" : "string", description: d }])), required: name === "list_region_objects" ? ["x", "y", "z"] : [Object.keys(t.params)[0]] },
  },
}));

export function recordUsage(db, userId, kind, { model = null, tokensIn = 0, tokensOut = 0 } = {}) {
  db.prepare("INSERT INTO usage (user_id, kind, model, tokens_in, tokens_out, created_at) VALUES (?, ?, ?, ?, ?, ?)")
    .run(userId || null, kind, model, tokensIn, tokensOut, new Date().toISOString());
}

// Strip formatting the harness forbids, and cap length, in case the model slips.
function tidy(text) {
  const plain = String(text || "").replace(/^#+\s*/gm, "").replace(/\*\*|__|`/g, "").replace(/^\s*[-*•]\s+/gm, "").trim();
  const words = plain.split(/\s+/);
  return words.length > 90 ? `${words.slice(0, 90).join(" ")}…` : plain;
}

export function tutorRoutes(route, ctx) {
  const tools = makeTools(ctx);
  const distOf = (o) => (o?.d != null ? o.d : o?.p ? Math.hypot(...o.p) : Infinity);

  route("POST", "/api/guide", async (req, res, { user, body }) => {
    if (body.mode !== "explore") throw new HttpError(400, "The guide is only available in Explore.");
    const question = String(body.question || "").trim();
    if (question.length < 3) throw new HttpError(400, "Ask a question first.");
    if (question.length > MAX_QUESTION) throw new HttpError(400, `Keep questions under ${MAX_QUESTION} characters.`);
    const today = new Date().toISOString().slice(0, 10);
    const used = ctx.db.prepare("SELECT COUNT(*) AS n FROM usage WHERE user_id = ? AND kind = 'tutor' AND created_at >= ?").get(user.id, today).n;
    if (used >= DAILY_CAP) throw new HttpError(429, "The guide has answered plenty today; try again tomorrow.");
    const key = loadKey();
    if (!key) throw new HttpError(503, "The guide isn't configured on this server.");

    const harness = readFileSync(HARNESS, "utf8");
    const selected = body.selectedId && ctx.catalog?.byId.get(String(body.selectedId));
    const context = { selected: selected && distOf(selected) <= MAX_LY ? tools.get_object({ id: selected.id }).object : null };
    const messages = [
      { role: "system", content: harness },
      { role: "user", content: `Context: ${JSON.stringify(context)}\n\nQuestion: ${question}` },
    ];

    const actions = [];
    const run = async (name, args) => {
      if (name === "show_on_map") {
        const o = ctx.catalog?.byId.get(String(args.id || ""));
        if (!o || distOf(o) > MAX_LY) return { error: "Not on the map (only objects within 100 light years)." };
        actions.push({ type: "focus", id: o.id });
        return { ok: true, name: o.name || o.id };
      }
      if (name === "list_region_objects") args = { ...args, radius_ly: Math.min(MAX_LY, Number(args.radius_ly) || 10), limit: 10 };
      if (name === "search_universe") args = { ...args, limit: 8 };
      const out = await tools[name](args);
      // Keep results to the viewable sphere so the guide only talks about what's on the map.
      if (out.results) out.results = out.results.filter((r) => (r.distance_ly ?? 0) <= MAX_LY);
      return out;
    };

    let toolCalls = 0, tokensIn = 0, tokensOut = 0;
    for (let round = 0; round <= MAX_TOOL_CALLS; round++) {
      const r = await fetch(GATEWAY, {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${key}` },
        body: JSON.stringify({ model: MODEL, messages, max_completion_tokens: MAX_OUTPUT_TOKENS, ...(toolCalls < MAX_TOOL_CALLS && { tools: toolDefs() }) }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new HttpError(502, "The guide couldn't be reached right now.");
      tokensIn += j.usage?.prompt_tokens || 0;
      tokensOut += j.usage?.completion_tokens || 0;
      recordUsage(ctx.db, user.id, round === 0 ? "tutor" : "delegation", { model: MODEL, tokensIn: j.usage?.prompt_tokens || 0, tokensOut: j.usage?.completion_tokens || 0 });
      const msg = j.choices?.[0]?.message;
      if (!msg) throw new HttpError(502, "The guide gave no answer.");
      if (!msg.tool_calls?.length) return { answer: tidy(msg.content), actions, toolCalls, tokens: { in: tokensIn, out: tokensOut }, model: MODEL };
      messages.push(msg);
      for (const call of msg.tool_calls) {
        toolCalls++;
        let result;
        try {
          result = GUIDE_TOOLS[call.function.name] ? await run(call.function.name, JSON.parse(call.function.arguments || "{}")) : { error: "unknown tool" };
        } catch (e) { result = { error: e.message }; }
        recordUsage(ctx.db, user.id, "explore", {});
        messages.push({ role: "tool", tool_call_id: call.id, content: JSON.stringify(result).slice(0, 3000) });
      }
    }
    throw new HttpError(502, "The guide ran out of steps.");
  });

  // Per-player usage summary (tokens by kind), plus the project's research batches.
  route("GET", "/api/usage", async (req, res, { user }) => {
    const rows = ctx.db.prepare("SELECT kind, COUNT(*) AS requests, SUM(tokens_in) AS tokens_in, SUM(tokens_out) AS tokens_out FROM usage WHERE user_id = ? GROUP BY kind").all(user.id);
    let research = null;
    try { research = JSON.parse(readFileSync(join(ROOT, "research", "research_manifest.json"), "utf8")).totals; } catch {}
    return { you: rows, projectResearch: research };
  });
}
