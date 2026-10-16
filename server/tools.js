// Bounded runtime tools for agents (HTTP here; the MCP server in mcp.js wraps the same
// functions). Every tool returns a small page of compact results; full detail only for
// a selected object. Agents get the player's question, the selected object and these
// results — never the whole catalog.

import { HttpError } from "./errors.js";
import { summarize, SUMMARY_FIELDS } from "./catalog.js";
import { cruise, betaForShipTime } from "../public/shared/physics.js";

const MAX_LIMIT = 25;
const ALLOWED_FIELDS = ["id", "name", "type", "distance_ly", "distance_err_ly", "position_ly", "ids", "g_mag", "bp_rp", "teff_k", "source", "system", "note", "content"];

function pageArgs(q) {
  const limit = Math.min(MAX_LIMIT, Math.max(1, Number(q.limit) || 10));
  const offset = Math.max(0, Number(q.offset) || 0);
  const fields = q.fields ? String(q.fields).split(",").filter((f) => ALLOWED_FIELDS.includes(f)) : SUMMARY_FIELDS;
  return { limit, offset, fields: fields.length ? fields : SUMMARY_FIELDS };
}

// The tool implementations, shared by HTTP routes and the MCP server.
export function makeTools(ctx) {
  const needCatalog = () => { if (!ctx.catalog) throw new HttpError(503, "Catalog not built: run node catalog-build/build.mjs"); return ctx.catalog; };
  const findPlace = (idOrName) => {
    const cat = needCatalog();
    if (idOrName === "Sun" || idOrName === "actual:sol") return { id: "actual:sol", name: "Sun", p: [0, 0, 0], content: "ACTUAL" };
    const o = cat.byId.get(idOrName) || cat.search(idOrName, { limit: 1 }).items[0];
    if (o?.p) return { id: o.id, name: o.name || o.id, p: o.p, content: "ACTUAL" };
    return null;
  };

  return {
    search_universe: ({ query, type, limit, offset, fields }) => {
      const page = pageArgs({ limit, offset, fields });
      const r = needCatalog().search(query, { type: type || null, limit: page.limit, offset: page.offset });
      return { total: r.total, limit: page.limit, offset: page.offset, results: r.items.map((o) => summarize(o, page.fields)) };
    },
    get_object: ({ id, fields }) => {
      const o = needCatalog().byId.get(String(id || ""));
      if (!o) throw new HttpError(404, "No such object.");
      const featured = ctx.catalog.featured.find((f) => f.id === o.id);
      const fieldList = fields ? pageArgs({ fields }).fields : ALLOWED_FIELDS;
      return { object: summarize(o, fieldList), featured: featured ? { hook: featured.hook, story: featured.story, sources: featured.sources } : null };
    },
    list_region_objects: ({ x = 0, y = 0, z = 0, radius_ly = 10, type, limit, offset, fields }) => {
      const page = pageArgs({ limit, offset, fields });
      const radius = Math.min(500, Math.max(0.1, Number(radius_ly) || 10));
      const r = needCatalog().region([Number(x), Number(y), Number(z)], radius, { type: type || null, limit: page.limit, offset: page.offset });
      return { total: r.total, limit: page.limit, offset: page.offset, radius_ly: radius, results: r.items.map((o) => ({ ...summarize(o, page.fields), distance_from_center_ly: o._distanceFromCenterLy })) };
    },
    plan_nearby_journey: ({ origin = "Sun", destination, speed_c, target_ship_years }) => {
      const a = findPlace(String(origin)), b = findPlace(String(destination || ""));
      if (!a || !b) throw new HttpError(404, "Unknown origin or destination.");
      const d = Math.hypot(a.p[0] - b.p[0], a.p[1] - b.p[1], a.p[2] - b.p[2]);
      let beta = Number(speed_c);
      if (!(beta > 0 && beta < 1)) beta = target_ship_years ? betaForShipTime(d, Number(target_ship_years)) : 0.5;
      const t = cruise(d, beta);
      return {
        origin: { id: a.id, name: a.name, content: a.content }, destination: { id: b.id, name: b.name, content: b.content },
        distance_ly: +d.toFixed(4), speed_c: +beta.toFixed(6), gamma: +t.gamma.toFixed(6),
        external_years: +t.externalYears.toFixed(4), ship_years: +t.shipYears.toFixed(4), ship_frame_distance_ly: +t.contractedLy.toFixed(4),
        model: "constant-speed cruise; endpoints at rest in a shared frame; gravity and departure/arrival manoeuvres not modelled",
      };
    },
  };
}

export const TOOL_SCHEMAS = {
  search_universe: { description: "Search ACTUAL catalog objects by common name or catalog id. Returns a small page of summaries.", params: { query: "string (required)", type: "optional exact type, e.g. 'star', 'open cluster'", limit: "1–25 (default 10)", offset: "integer", fields: "comma-separated subset of " + ALLOWED_FIELDS.join(",") } },
  get_object: { description: "Full detail card for one ACTUAL object by id.", params: { id: "string (required)", fields: "optional comma-separated subset" } },
  list_region_objects: { description: "ACTUAL objects within a radius (ly, max 500) of a point in heliocentric galactic coordinates (ly), nearest first.", params: { x: "ly", y: "ly", z: "ly", radius_ly: "0.1–500", type: "optional", limit: "1–25", offset: "integer" } },
  plan_nearby_journey: { description: "Constant-speed cruise between two ACTUAL catalog objects: distance, external and ship-frame times.", params: { origin: "id or name (default Sun)", destination: "id or name (required)", speed_c: "0–1 exclusive, or omit and give target_ship_years" } },
};

export function toolRoutes(route, ctx) {
  const tools = makeTools(ctx);
  route("GET", "/api/tools", async () => ({ tools: TOOL_SCHEMAS }));
  route("GET", "/api/tools/:tool", async (req, res, { params, query, user }) => {
    const fn = tools[params.tool];
    if (!fn) throw new HttpError(404, "Unknown tool.");
    const args = Object.fromEntries(query.entries());
    const out = await fn(args);
    ctx.recordUsage?.(user?.id, "explore", { tool: params.tool });
    return out;
  });
}
