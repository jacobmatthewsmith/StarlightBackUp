"""Turn the research JSON (stars_group*.json) into starlight/star-data.js."""
import json
import re
import sys
from pathlib import Path

SCRATCH = Path(__file__).parent
OUT = Path(__file__).parent.parent / "public" / "star-data.js"

entries = []
for g in range(1, 6):
    f = SCRATCH / f"stars_group{g}.json"
    if not f.exists():
        sys.exit(f"missing {f}")
    entries += json.loads(f.read_text())


def num(x):
    if x is None:
        return None
    if isinstance(x, (int, float)):
        return float(x)
    m = re.search(r"-?\d+(\.\d+)?", str(x))
    return float(m.group()) if m else None


def short_component(comp_name, system):
    if comp_name.startswith(system):
        rest = comp_name[len(system):].strip(" ()")
        if rest:
            return rest
    return comp_name.split()[-1]


def planet_label(name):
    # On-screen label: the planet's letter ("Proxima Centauri b" -> "b",
    # "eps Eri b (AEgir)" -> "b"); Solar System planets keep their names.
    base = re.sub(r"\s*\([^)]*\)\s*$", "", name)
    m = re.search(r"\b([b-z])$", base)
    return m.group(1) if m else name


data = {}
for e in entries:
    # "Luyten's Star (GJ 273)" -> "Luyten's Star", to match the game's names.
    name = re.sub(r"\s*\([^)]*\)$", "", e["name"])
    comps = e.get("components") or []
    comp_out = [
        {"name": c.get("name"), "short": short_component(c.get("name") or "", name), "mass": num(c.get("mass_msun"))}
        for c in comps
    ]
    planets = []
    for p in e.get("planets") or []:
        planets.append({
            "name": p["name"],
            "label": planet_label(p["name"]),
            "host": p.get("host"),
            "a": num(p.get("semi_major_axis_au")),
            "period": num(p.get("period_days")),
            "mass": num(p.get("mass_earth")),
            "massMin": bool(p.get("mass_is_minimum")),
            "radius": num(p.get("radius_earth")),
            "disputed": bool(re.search(r"unconfirmed|disputed", p.get("caveat") or "", re.I)),
        })
    planets.sort(key=lambda p: (p["a"] is None, p["a"] or 0))
    cands = [c.get("name") for c in (e.get("candidates") or []) if c.get("name")]
    age = e.get("age_gyr")
    age = None if age in (None, "") else str(age).replace("-", "–")
    dist = num(e.get("distance_ly"))
    data[name] = {
        "distance_ly": None if dist is None else round(dist, 2),
        "ra": num(e.get("ra_hours")),
        "dec": num(e.get("dec_deg")),
        "components": comp_out,
        "age": age,
        "constellation": e.get("constellation"),
        "planets": planets,
        "candidates": ("not confirmed: " + ", ".join(cands)) if cands else None,
        "sources": e.get("sources") or [],
    }

header = (
    "// Nearby-star facts for the neighbourhood map, compiled from the NASA Exoplanet\n"
    "// Archive (confirmed planets only), SIMBAD/Gaia, NASA planetary fact sheets and\n"
    "// cited Wikipedia articles. Sources for each star are listed in `sources`.\n"
    "// Generated; edit the research JSON and regenerate rather than editing by hand.\n"
)
OUT.write_text(header + "const STAR_DATA = " + json.dumps(data, indent=2, ensure_ascii=False) + ";\n")
print(f"wrote {len(data)} systems to {OUT}")
for k, v in data.items():
    if v["planets"]:
        print(f"  {k}: " + ", ".join(p["name"] for p in v["planets"]))
