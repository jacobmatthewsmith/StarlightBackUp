"""Turn solar_planets_moons.json + solar_dwarfs.json into starlight/solar-system.js."""
import json
from pathlib import Path

SCRATCH = Path(__file__).parent
OUT = Path(__file__).parent.parent / "public" / "solar-system.js"
EARTH_KG = 5.9722e24
COUNTS_CHECKED = "October 2026"  # moon counts were checked against NASA/JPL on 2026-10-06

pm = json.loads((SCRATCH / "solar_planets_moons.json").read_text())
dw = json.loads((SCRATCH / "solar_dwarfs.json").read_text())

SUP = str.maketrans("-0123456789", "⁻⁰¹²³⁴⁵⁶⁷⁸⁹")


def kg_text(kg):
    if kg is None:
        return None
    mant, exp = f"{kg:.2e}".split("e")
    return f"{mant} × 10{str(int(exp)).translate(SUP)} kg"


def moon(m):
    return {
        "name": m["name"],
        "kind": "moon",
        "a": None if m.get("semi_major_axis_km") is None else m["semi_major_axis_km"] / 149597870.7,
        "e": m.get("eccentricity") or 0,
        "varpi": 0,
        "period": m.get("orbital_period_days"),
        "retro": bool(m.get("retrograde")),
        "radiusKm": m.get("mean_radius_km"),
        "massText": kg_text(m.get("mass_kg")),
    }


bodies = []
for p in pm["planets"]:
    n = p.get("known_moons")
    bodies.append({
        "name": p["name"],
        "kind": "planet",
        "a": p["semi_major_axis_au"],
        "e": p["eccentricity"],
        "varpi": p["longitude_of_perihelion_deg"],
        "period": p["orbital_period_days"],
        "radiusKm": p["mean_radius_km"],
        "mass": p["mass_earth"],
        "moonsKnown": n,
        "moonsAsOf": COUNTS_CHECKED if n and n > 2 else None,
        "moons": [moon(m) for m in pm["moons"] if m["parent"] == p["name"]],
    })

KIND = {"dwarf planet": "dwarf planet", "dwarf planet candidate": "dwarf planet candidate", "asteroid": "asteroid"}
for b in dw["bodies"]:
    yrs = b.get("orbital_period_years")
    bodies.append({
        "name": b["name"],
        "kind": KIND.get(b.get("category"), b.get("category")),
        "a": b["semi_major_axis_au"],
        "e": b["eccentricity"],
        "varpi": b.get("longitude_of_perihelion_deg") or 0,
        "period": None if yrs is None else yrs * 365.25,
        "radiusKm": b.get("mean_radius_km"),
        "massText": kg_text(b.get("mass_kg")),
        "moonsKnown": b.get("known_moons"),
        "moonsAsOf": None,
        "moons": [moon(m) for m in (b.get("moons") or [])],
    })


def belt(name, d):
    inner = d.get("inner_au", d.get("inner_edge_au"))
    outer = d.get("outer_au", d.get("outer_edge_au"))
    if inner is None or outer is None:
        raise SystemExit(f"belt edges missing for {name}: {d}")
    return {"name": name, "inner": inner, "outer": outer}


belts = [belt("asteroid belt", dw["belts"]["asteroid_belt"]), belt("Kuiper belt", dw["belts"]["kuiper_belt"])]

sources = sorted(set(pm.get("sources", []) + dw.get("sources", [])))
header = (
    "// The Solar System for the neighbourhood map: planets (JPL elements, NSSDC fact\n"
    "// sheets), major moons (JPL satellite elements), dwarf planets and large bodies\n"
    "// (JPL Small-Body Database). Moon counts checked against NASA/JPL in Oct 2026.\n"
    "// Generated; regenerate from the research JSON rather than editing by hand.\n"
)
OUT.write_text(header + "const SOLAR_SYSTEM = " + json.dumps({"bodies": bodies, "belts": belts, "sources": sources}, indent=2, ensure_ascii=False) + ";\n")
print(f"wrote {len(bodies)} bodies, {sum(len(b['moons']) for b in bodies)} moons, belts {belts}")
