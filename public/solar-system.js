// The Solar System for the neighbourhood map: planets (JPL elements, NSSDC fact
// sheets), major moons (JPL satellite elements), dwarf planets and large bodies
// (JPL Small-Body Database). Moon counts checked against NASA/JPL in Oct 2026.
// Generated; regenerate from the research JSON rather than editing by hand.
const SOLAR_SYSTEM = {
  "bodies": [
    {
      "name": "Mercury",
      "kind": "planet",
      "a": 0.38709927,
      "e": 0.20563593,
      "varpi": 77.45779628,
      "period": 87.969,
      "radiusKm": 2439.7,
      "mass": 0.055273,
      "moonsKnown": 0,
      "moonsAsOf": null,
      "moons": []
    },
    {
      "name": "Venus",
      "kind": "planet",
      "a": 0.72333566,
      "e": 0.00677672,
      "varpi": 131.60246718,
      "period": 224.701,
      "radiusKm": 6051.8,
      "mass": 0.81499,
      "moonsKnown": 0,
      "moonsAsOf": null,
      "moons": []
    },
    {
      "name": "Earth",
      "kind": "planet",
      "a": 1.00000261,
      "e": 0.01671123,
      "varpi": 102.93768193,
      "period": 365.256,
      "radiusKm": 6371.0,
      "mass": 1.0,
      "moonsKnown": 1,
      "moonsAsOf": null,
      "moons": [
        {
          "name": "Moon",
          "kind": "moon",
          "a": 0.0025695552897999907,
          "e": 0.0554,
          "varpi": 0,
          "period": 27.322,
          "retro": false,
          "radiusKm": 1737.4,
          "massText": "7.35 × 10²² kg"
        }
      ]
    },
    {
      "name": "Mars",
      "kind": "planet",
      "a": 1.52371034,
      "e": 0.0933941,
      "varpi": 336.05637041,
      "period": 686.98,
      "radiusKm": 3389.5,
      "mass": 0.10745,
      "moonsKnown": 2,
      "moonsAsOf": null,
      "moons": [
        {
          "name": "Phobos",
          "kind": "moon",
          "a": 6.266800427126668e-05,
          "e": 0.015,
          "varpi": 0,
          "period": 0.3187,
          "retro": false,
          "radiusKm": 11.08,
          "massText": "1.06 × 10¹⁶ kg"
        },
        {
          "name": "Deimos",
          "kind": "moon",
          "a": 0.00015680036012705095,
          "e": 0,
          "varpi": 0,
          "period": 1.2625,
          "retro": false,
          "radiusKm": 6.2,
          "massText": "1.44 × 10¹⁵ kg"
        }
      ]
    },
    {
      "name": "Jupiter",
      "kind": "planet",
      "a": 5.202887,
      "e": 0.04838624,
      "varpi": 14.72847983,
      "period": 4332.589,
      "radiusKm": 69911,
      "mass": 317.83,
      "moonsKnown": 115,
      "moonsAsOf": "October 2026",
      "moons": [
        {
          "name": "Io",
          "kind": "moon",
          "a": 0.0028195588481728304,
          "e": 0.004,
          "varpi": 0,
          "period": 1.762732,
          "retro": false,
          "radiusKm": 1821.49,
          "massText": "8.93 × 10²² kg"
        },
        {
          "name": "Europa",
          "kind": "moon",
          "a": 0.004486026417754354,
          "e": 0.009,
          "varpi": 0,
          "period": 3.525463,
          "retro": false,
          "radiusKm": 1560.8,
          "massText": "4.80 × 10²² kg"
        },
        {
          "name": "Ganymede",
          "kind": "moon",
          "a": 0.007155182055676145,
          "e": 0.001,
          "varpi": 0,
          "period": 7.155588,
          "retro": false,
          "radiusKm": 2631.2,
          "massText": "1.48 × 10²³ kg"
        },
        {
          "name": "Callisto",
          "kind": "moon",
          "a": 0.012585072175094802,
          "e": 0.007,
          "varpi": 0,
          "period": 16.69044,
          "retro": false,
          "radiusKm": 2410.3,
          "massText": "1.08 × 10²³ kg"
        },
        {
          "name": "Amalthea",
          "kind": "moon",
          "a": 0.001212584103979496,
          "e": 0.003,
          "varpi": 0,
          "period": 0.499918,
          "retro": false,
          "radiusKm": 83.5,
          "massText": "2.47 × 10¹⁸ kg"
        }
      ]
    },
    {
      "name": "Saturn",
      "kind": "planet",
      "a": 9.53667594,
      "e": 0.05386179,
      "varpi": 92.59887831,
      "period": 10755.699,
      "radiusKm": 58232,
      "mass": 95.161,
      "moonsKnown": 293,
      "moonsAsOf": "October 2026",
      "moons": [
        {
          "name": "Mimas",
          "kind": "moon",
          "a": 0.001243333204741931,
          "e": 0.02,
          "varpi": 0,
          "period": 0.942422,
          "retro": false,
          "radiusKm": 198.2,
          "massText": "3.75 × 10¹⁹ kg"
        },
        {
          "name": "Enceladus",
          "kind": "moon",
          "a": 0.0015936055699487975,
          "e": 0.005,
          "varpi": 0,
          "period": 1.370218,
          "retro": false,
          "radiusKm": 252.1,
          "massText": "1.08 × 10²⁰ kg"
        },
        {
          "name": "Tethys",
          "kind": "moon",
          "a": 0.0019719532010691915,
          "e": 0.001,
          "varpi": 0,
          "period": 1.887802,
          "retro": false,
          "radiusKm": 531.1,
          "massText": "6.18 × 10²⁰ kg"
        },
        {
          "name": "Dione",
          "kind": "moon",
          "a": 0.0025247685560807922,
          "e": 0.002,
          "varpi": 0,
          "period": 2.736916,
          "retro": false,
          "radiusKm": 561.4,
          "massText": "1.10 × 10²¹ kg"
        },
        {
          "name": "Rhea",
          "kind": "moon",
          "a": 0.0035241143308599246,
          "e": 0.001,
          "varpi": 0,
          "period": 4.517503,
          "retro": false,
          "radiusKm": 763.5,
          "massText": "2.31 × 10²¹ kg"
        },
        {
          "name": "Titan",
          "kind": "moon",
          "a": 0.008167897004699814,
          "e": 0.029,
          "varpi": 0,
          "period": 15.945448,
          "retro": false,
          "radiusKm": 2574.76,
          "massText": "1.35 × 10²³ kg"
        },
        {
          "name": "Hyperion",
          "kind": "moon",
          "a": 0.009903215821640703,
          "e": 0.105,
          "varpi": 0,
          "period": 21.276658,
          "retro": false,
          "radiusKm": 135.0,
          "massText": "5.55 × 10¹⁸ kg"
        },
        {
          "name": "Iapetus",
          "kind": "moon",
          "a": 0.023808493953383525,
          "e": 0.028,
          "varpi": 0,
          "period": 79.331002,
          "retro": false,
          "radiusKm": 734.3,
          "massText": "1.81 × 10²¹ kg"
        }
      ]
    },
    {
      "name": "Uranus",
      "kind": "planet",
      "a": 19.18916464,
      "e": 0.04725744,
      "varpi": 170.9542763,
      "period": 30685.4,
      "radiusKm": 25362,
      "mass": 14.536,
      "moonsKnown": 29,
      "moonsAsOf": "October 2026",
      "moons": [
        {
          "name": "Miranda",
          "kind": "moon",
          "a": 0.0008679668994780686,
          "e": 0.001,
          "varpi": 0,
          "period": 1.413479,
          "retro": false,
          "radiusKm": 235.8,
          "massText": "6.44 × 10¹⁹ kg"
        },
        {
          "name": "Ariel",
          "kind": "moon",
          "a": 0.001276281534667592,
          "e": 0.001,
          "varpi": 0,
          "period": 2.520379,
          "retro": false,
          "radiusKm": 578.9,
          "massText": "1.25 × 10²¹ kg"
        },
        {
          "name": "Umbriel",
          "kind": "moon",
          "a": 0.001778006590303695,
          "e": 0.004,
          "varpi": 0,
          "period": 4.144177,
          "retro": false,
          "radiusKm": 584.7,
          "massText": "1.28 × 10²¹ kg"
        },
        {
          "name": "Titania",
          "kind": "moon",
          "a": 0.0029164719922714784,
          "e": 0.002,
          "varpi": 0,
          "period": 8.705869,
          "retro": false,
          "radiusKm": 788.9,
          "massText": "3.40 × 10²¹ kg"
        },
        {
          "name": "Oberon",
          "kind": "moon",
          "a": 0.0039005301163019834,
          "e": 0.002,
          "varpi": 0,
          "period": 13.463237,
          "retro": false,
          "radiusKm": 761.4,
          "massText": "3.08 × 10²¹ kg"
        }
      ]
    },
    {
      "name": "Neptune",
      "kind": "planet",
      "a": 30.06992276,
      "e": 0.00859048,
      "varpi": 44.96476227,
      "period": 60189.018,
      "radiusKm": 24622,
      "mass": 17.148,
      "moonsKnown": 16,
      "moonsAsOf": "October 2026",
      "moons": [
        {
          "name": "Triton",
          "kind": "moon",
          "a": 0.002371691510980845,
          "e": 0,
          "varpi": 0,
          "period": 5.876994,
          "retro": true,
          "radiusKm": 1352.6,
          "massText": "2.14 × 10²² kg"
        },
        {
          "name": "Proteus",
          "kind": "moon",
          "a": 0.0007861074455787693,
          "e": 0,
          "varpi": 0,
          "period": 1.122315,
          "retro": false,
          "radiusKm": 208.0,
          "massText": null
        },
        {
          "name": "Nereid",
          "kind": "moon",
          "a": 0.036858144933475986,
          "e": 0.751,
          "varpi": 0,
          "period": 360.133039,
          "retro": false,
          "radiusKm": 170.0,
          "massText": null
        }
      ]
    },
    {
      "name": "Ceres",
      "kind": "dwarf planet",
      "a": 2.7656,
      "e": 0.0797,
      "varpi": 153.54,
      "period": 1680.1499999999999,
      "radiusKm": 469.7,
      "massText": "9.38 × 10²⁰ kg",
      "moonsKnown": 0,
      "moonsAsOf": null,
      "moons": []
    },
    {
      "name": "Pluto",
      "kind": "dwarf planet",
      "a": 39.5886,
      "e": 0.2518,
      "varpi": 224.0,
      "period": 90980.1225,
      "radiusKm": 1188.3,
      "massText": "1.30 × 10²² kg",
      "moonsKnown": 5,
      "moonsAsOf": null,
      "moons": [
        {
          "name": "Charon",
          "kind": "moon",
          "a": 0.0001309895916854116,
          "e": 0.000161,
          "varpi": 0,
          "period": 6.387221,
          "retro": false,
          "radiusKm": 606.0,
          "massText": "1.59 × 10²¹ kg"
        },
        {
          "name": "Styx",
          "kind": "moon",
          "a": 0.0002887741636819969,
          "e": 0.025,
          "varpi": 0,
          "period": 20.16,
          "retro": false,
          "radiusKm": 5.2,
          "massText": null
        },
        {
          "name": "Nix",
          "kind": "moon",
          "a": 0.0003295501451278344,
          "e": 0.015,
          "varpi": 0,
          "period": 24.85,
          "retro": false,
          "radiusKm": 18.0,
          "massText": "2.25 × 10¹⁶ kg"
        },
        {
          "name": "Kerberos",
          "kind": "moon",
          "a": 0.0003897114292282504,
          "e": 0.01,
          "varpi": 0,
          "period": 32.17,
          "retro": false,
          "radiusKm": 6.0,
          "massText": null
        },
        {
          "name": "Hydra",
          "kind": "moon",
          "a": 0.0004358350803719027,
          "e": 0.009,
          "varpi": 0,
          "period": 38.2,
          "retro": false,
          "radiusKm": 18.5,
          "massText": "3.00 × 10¹⁶ kg"
        }
      ]
    },
    {
      "name": "Haumea",
      "kind": "dwarf planet",
      "a": 43.0603,
      "e": 0.1944,
      "varpi": 2.48,
      "period": 103208.6925,
      "radiusKm": 797.6,
      "massText": "3.95 × 10²¹ kg",
      "moonsKnown": 2,
      "moonsAsOf": null,
      "moons": [
        {
          "name": "Hiʻiaka",
          "kind": "moon",
          "a": 0.0003334272056587501,
          "e": 0.0513,
          "varpi": 0,
          "period": 49.462,
          "retro": false,
          "radiusKm": 185.0,
          "massText": "1.60 × 10¹⁹ kg"
        },
        {
          "name": "Namaka",
          "kind": "moon",
          "a": 0.00017150645179604153,
          "e": 0.249,
          "varpi": 0,
          "period": 18.2783,
          "retro": false,
          "radiusKm": 75.0,
          "massText": "1.18 × 10¹⁸ kg"
        }
      ]
    },
    {
      "name": "Makemake",
      "kind": "dwarf planet",
      "a": 45.5709,
      "e": 0.1589,
      "varpi": 16.39,
      "period": 112365.51,
      "radiusKm": 715.0,
      "massText": null,
      "moonsKnown": 1,
      "moonsAsOf": null,
      "moons": [
        {
          "name": "S/2015 (136472) 1 (MK2)",
          "kind": "moon",
          "a": null,
          "e": 0,
          "varpi": 0,
          "period": null,
          "retro": false,
          "radiusKm": 87.5,
          "massText": null
        }
      ]
    },
    {
      "name": "Eris",
      "kind": "dwarf planet",
      "a": 67.9339,
      "e": 0.4382,
      "varpi": 186.8,
      "period": 204518.08500000002,
      "radiusKm": 1163.0,
      "massText": "1.64 × 10²² kg",
      "moonsKnown": 1,
      "moonsAsOf": null,
      "moons": [
        {
          "name": "Dysnomia",
          "kind": "moon",
          "a": 0.0002491546158083118,
          "e": 0.0062,
          "varpi": 0,
          "period": 15.785899,
          "retro": false,
          "radiusKm": 307.5,
          "massText": "8.20 × 10¹⁹ kg"
        }
      ]
    },
    {
      "name": "Gonggong",
      "kind": "dwarf planet candidate",
      "a": 66.8667,
      "e": 0.5043,
      "varpi": 183.46,
      "period": 199715.0475,
      "radiusKm": 615.0,
      "massText": "1.75 × 10²¹ kg",
      "moonsKnown": 1,
      "moonsAsOf": null,
      "moons": [
        {
          "name": "Xiangliu",
          "kind": "moon",
          "a": 0.00016057046726401035,
          "e": 0.2908,
          "varpi": 0,
          "period": 25.22073,
          "retro": false,
          "radiusKm": null,
          "massText": null
        }
      ]
    },
    {
      "name": "Quaoar",
      "kind": "dwarf planet candidate",
      "a": 43.1562,
      "e": 0.0352,
      "varpi": 352.13,
      "period": 103552.0275,
      "radiusKm": 548.8,
      "massText": "1.21 × 10²¹ kg",
      "moonsKnown": 1,
      "moonsAsOf": null,
      "moons": [
        {
          "name": "Weywot",
          "kind": "moon",
          "a": 8.909886175271612e-05,
          "e": 0.01111,
          "varpi": 0,
          "period": 12.42727,
          "retro": false,
          "radiusKm": null,
          "massText": "2.40 × 10¹⁸ kg"
        }
      ]
    },
    {
      "name": "Orcus",
      "kind": "dwarf planet candidate",
      "a": 39.3769,
      "e": 0.2205,
      "varpi": 341.97,
      "period": 90253.275,
      "radiusKm": 455.0,
      "massText": "5.48 × 10²⁰ kg",
      "moonsKnown": 1,
      "moonsAsOf": null,
      "moons": [
        {
          "name": "Vanth",
          "kind": "moon",
          "a": 6.0159947182991556e-05,
          "e": 0.00091,
          "varpi": 0,
          "period": 9.539154,
          "retro": false,
          "radiusKm": 221.25,
          "massText": "8.70 × 10¹⁹ kg"
        }
      ]
    },
    {
      "name": "Sedna",
      "kind": "dwarf planet candidate",
      "a": 543.7195,
      "e": 0.8599,
      "varpi": 95.6,
      "period": 4630851.345,
      "radiusKm": null,
      "massText": null,
      "moonsKnown": 0,
      "moonsAsOf": null,
      "moons": []
    },
    {
      "name": "Vesta",
      "kind": "asteroid",
      "a": 2.3614,
      "e": 0.0902,
      "varpi": 255.17,
      "period": 1325.8575,
      "radiusKm": 261.385,
      "massText": "2.59 × 10²⁰ kg",
      "moonsKnown": 0,
      "moonsAsOf": null,
      "moons": []
    },
    {
      "name": "Pallas",
      "kind": "asteroid",
      "a": 2.7696,
      "e": 0.2307,
      "varpi": 123.86,
      "period": 1683.8025,
      "radiusKm": 256.5,
      "massText": "2.04 × 10²⁰ kg",
      "moonsKnown": 0,
      "moonsAsOf": null,
      "moons": []
    }
  ],
  "belts": [
    {
      "name": "asteroid belt",
      "inner": 2.06,
      "outer": 3.27
    },
    {
      "name": "Kuiper belt",
      "inner": 30,
      "outer": 50
    }
  ],
  "sources": [
    "Brown & Butler 2018, AJ 156:164 (Orcus size)",
    "Brown & Butler 2023, PSJ 4:193 (Dysnomia and Vanth masses)",
    "Brown 2013, ApJ 767:L7 (Makemake size)",
    "Brozovic & Jacobson 2024, AJ 167:256 (Pluto system orbits and masses)",
    "Fernandez-Valenzuela et al. 2025, Nature Communications 16 (Hi'iaka size and mass)",
    "Grundy et al. 2019, Icarus 334:62 (Orcus-Vanth orbit and system mass)",
    "Holler et al. 2021, Icarus 355:114130 (Dysnomia orbit, Eris system mass)",
    "IAU announcement 26 Mar 2026, 'IAU Minor Planet Center Confirms New Moons of Saturn and Jupiter': https://www.iau.org/IAU/IAU/News/Ann2026/MPC-New-Moons-Saturn-Jupiter.aspx (context for count history)",
    "JPL Planetary satellite mean elements (Pluto, PLU060): https://ssd.jpl.nasa.gov/sats/elem/",
    "JPL Planetary satellite physical parameters: https://ssd.jpl.nasa.gov/sats/phys_par/",
    "JPL Planets physical parameters, dwarf-planet table: https://ssd.jpl.nasa.gov/planets/phys_par.html",
    "JPL SSD Approximate Positions of the Planets, Table 1 (J2000 mean ecliptic/equinox, valid 1800-2050): https://ssd.jpl.nasa.gov/planets/approx_pos.html — a, e, longitude of perihelion",
    "JPL SSD Planetary Satellite Discovery Circumstances: https://ssd.jpl.nasa.gov/sats/discovery.html — IAU-recognized satellite counts (Mars 2, Jupiter 115, Saturn 293, Uranus 29, Neptune 16)",
    "JPL SSD Planetary Satellite Mean Elements: https://ssd.jpl.nasa.gov/sats/elem/ — moon a, e, i (for retrograde), sidereal period",
    "JPL SSD Planetary Satellite Physical Parameters: https://ssd.jpl.nasa.gov/sats/phys_par/ — moon GM and mean radius",
    "JPL Small-Body Database API (https://ssd-api.jpl.nasa.gov/sbdb.api, full-prec), queried 2026-10-06: orbital elements a, e, node, peri, period; Ceres/Vesta/Pallas physical params",
    "Kiss et al. 2019, Icarus 334:3 (Gonggong mass, size, Xiangliu orbit)",
    "Lellouch et al. 2013, A&A 557:A60 (Sedna thermal size)",
    "Marsset et al. 2020, Nature Astronomy 4:569 (Pallas)",
    "NASA NSSDC Planetary Fact Sheets (per-planet pages, e.g. https://nssdc.gsfc.nasa.gov/planetary/factsheet/jupiterfact.html), retrieved 2026-10-06 — planet mass, volumetric mean radius, sidereal orbit period",
    "NASA Science Kuiper Belt facts: https://science.nasa.gov/solar-system/kuiper-belt/facts/",
    "NASA Science moon pages: https://science.nasa.gov/saturn/moons/, https://science.nasa.gov/jupiter/jupiter-moons/, https://science.nasa.gov/uranus/moons/, https://science.nasa.gov/neptune/moons/ (retrieved 2026-10-06)",
    "Ortiz et al. 2017, Nature 550:219 (Haumea shape, ring)",
    "Park et al. 2016, Nature 537:515 (Ceres)",
    "Park et al. 2025, Nature Astronomy, doi:10.1038/s41550-025-02533-7 (Vesta)",
    "Parker et al. 2016, ApJ 825:L9 (Makemake moon discovery)",
    "Proudfoot et al. 2024, PSJ 5:69 (Haumea mass, Namaka mass)",
    "Proudfoot et al. 2025, PSJ, arXiv:2511.07351 (Quaoar size/mass, Weywot orbit)",
    "Ragozzine & Brown 2009, AJ 137:4766 (Haumea moon orbits)",
    "Sicardy et al. 2011, Nature 478:493 (Eris size)",
    "Sickafoose et al. 2019, Icarus 319:657 (Vanth occultation size)",
    "Vernazza et al. 2021, A&A 654:A56 (Pallas GM)",
    "Wikipedia articles (Eris, Dysnomia, Haumea, Moons of Haumea, Makemake, S/2015 (136472) 1, Gonggong, Xiangliu, Quaoar, Weywot, Orcus, Vanth, Sedna, Charon, Asteroid belt, Kuiper belt, Classical Kuiper belt object) used only to locate the cited papers above"
  ]
};
