// Nearby-star facts for the neighbourhood map, compiled from the NASA Exoplanet
// Archive (confirmed planets only), SIMBAD/Gaia, NASA planetary fact sheets and
// cited Wikipedia articles. Sources for each star are listed in `sources`.
// Generated; edit the research JSON and regenerate rather than editing by hand.
const STAR_DATA = {
  "Proxima Centauri": {
    "distance_ly": 4.25,
    "ra": 14.4953,
    "dec": -62.679,
    "components": [
      {
        "name": "Proxima Centauri (Alpha Centauri C)",
        "short": "Alpha Centauri C",
        "mass": 0.1221
      }
    ],
    "age": "4.85",
    "constellation": "Centaurus",
    "planets": [
      {
        "name": "Proxima Centauri d",
        "label": "d",
        "host": "Proxima Centauri",
        "a": 0.02881,
        "period": 5.12338,
        "mass": 0.26,
        "massMin": true,
        "radius": null,
        "disputed": false
      },
      {
        "name": "Proxima Centauri b",
        "label": "b",
        "host": "Proxima Centauri",
        "a": 0.04848,
        "period": 11.18465,
        "mass": 1.055,
        "massMin": true,
        "radius": null,
        "disputed": false
      }
    ],
    "candidates": "not confirmed: Proxima Centauri c",
    "sources": [
      "https://exoplanetarchive.ipac.caltech.edu/TAP/sync (pscomppars table)",
      "https://exoplanetarchive.ipac.caltech.edu/overview/Proxima%20Cen",
      "https://simbad.cds.unistra.fr/simbad/sim-tap (SIMBAD basic table)",
      "https://en.wikipedia.org/wiki/Proxima_Centauri",
      "https://ui.adsabs.harvard.edu/abs/2025A&A...700A..11M/abstract"
    ]
  },
  "Alpha Centauri": {
    "distance_ly": 4.34,
    "ra": 14.6601,
    "dec": -60.834,
    "components": [
      {
        "name": "Alpha Centauri A (Rigil Kentaurus)",
        "short": "A (Rigil Kentaurus",
        "mass": 1.0788
      },
      {
        "name": "Alpha Centauri B (Toliman)",
        "short": "B (Toliman",
        "mass": 0.9092
      }
    ],
    "age": "6.22",
    "constellation": "Centaurus",
    "planets": [],
    "candidates": "not confirmed: Alpha Centauri Bb, Alpha Centauri Bc (informal), Alpha Centauri Ab / Candidate 1 (C1) / JWST S1",
    "sources": [
      "https://exoplanetarchive.ipac.caltech.edu/TAP/sync (pscomppars table)",
      "https://simbad.cds.unistra.fr/simbad/sim-tap (SIMBAD basic table)",
      "https://en.wikipedia.org/wiki/Alpha_Centauri",
      "https://ui.adsabs.harvard.edu/abs/2021AJ....162...14A/abstract"
    ]
  },
  "Barnard's Star": {
    "distance_ly": 5.96,
    "ra": 17.9635,
    "dec": 4.693,
    "components": [
      {
        "name": "Barnard's Star",
        "short": "Star",
        "mass": 0.162
      }
    ],
    "age": "~10",
    "constellation": "Ophiuchus",
    "planets": [
      {
        "name": "Barnard d",
        "label": "d",
        "host": "Barnard's Star",
        "a": 0.0188,
        "period": 2.3402,
        "mass": 0.263,
        "massMin": true,
        "radius": null,
        "disputed": false
      },
      {
        "name": "Barnard b",
        "label": "b",
        "host": "Barnard's Star",
        "a": 0.0229,
        "period": 3.1542,
        "mass": 0.299,
        "massMin": true,
        "radius": null,
        "disputed": false
      },
      {
        "name": "Barnard c",
        "label": "c",
        "host": "Barnard's Star",
        "a": 0.0274,
        "period": 4.1244,
        "mass": 0.335,
        "massMin": true,
        "radius": null,
        "disputed": false
      },
      {
        "name": "Barnard e",
        "label": "e",
        "host": "Barnard's Star",
        "a": 0.0381,
        "period": 6.7392,
        "mass": 0.193,
        "massMin": true,
        "radius": null,
        "disputed": false
      }
    ],
    "candidates": "not confirmed: Barnard's Star b (2018 claim, Ribas et al.)",
    "sources": [
      "https://exoplanetarchive.ipac.caltech.edu/TAP/sync (pscomppars table)",
      "https://exoplanetarchive.ipac.caltech.edu/overview/Barnard%27s%20star",
      "https://simbad.cds.unistra.fr/simbad/sim-tap (SIMBAD basic table)",
      "https://en.wikipedia.org/wiki/Barnard%27s_Star",
      "https://ui.adsabs.harvard.edu/abs/2025ApJ...982L...1B/abstract"
    ]
  },
  "Luhman 16": {
    "distance_ly": 6.51,
    "ra": 10.8206,
    "dec": -53.318,
    "components": [
      {
        "name": "Luhman 16 A",
        "short": "A",
        "mass": 0.0338
      },
      {
        "name": "Luhman 16 B",
        "short": "B",
        "mass": 0.0281
      }
    ],
    "age": "0.4–0.8",
    "constellation": "Vela",
    "planets": [],
    "candidates": "not confirmed: Luhman 16 astrometric companion (2013 claim)",
    "sources": [
      "https://simbad.cds.unistra.fr/simbad/sim-tap (SIMBAD basic table)",
      "https://en.wikipedia.org/wiki/Luhman_16",
      "https://exoplanetarchive.ipac.caltech.edu/TAP/sync (pscomppars table)"
    ]
  },
  "WISE 0855-0714": {
    "distance_ly": 7.43,
    "ra": 8.9213,
    "dec": -7.247,
    "components": [
      {
        "name": "WISE 0855-0714",
        "short": "0855-0714",
        "mass": null
      }
    ],
    "age": "1–10",
    "constellation": "Hydra",
    "planets": [],
    "candidates": null,
    "sources": [
      "https://simbad.cds.unistra.fr/simbad/sim-tap (SIMBAD basic table)",
      "https://en.wikipedia.org/wiki/WISE_0855%E2%88%920714",
      "https://ui.adsabs.harvard.edu/abs/2021ApJS..253....7K/abstract"
    ]
  },
  "Wolf 359": {
    "distance_ly": 7.86,
    "ra": 10.9414,
    "dec": 7.015,
    "components": [
      {
        "name": "Wolf 359 (CN Leonis)",
        "short": "CN Leonis",
        "mass": 0.11
      }
    ],
    "age": "0.1–1.5",
    "constellation": "Leo",
    "planets": [],
    "candidates": "not confirmed: Wolf 359 b, Wolf 359 c",
    "sources": [
      "https://simbad.cds.unistra.fr/simbad/sim-tap (SIMBAD basic table)",
      "https://en.wikipedia.org/wiki/Wolf_359",
      "https://exoplanetarchive.ipac.caltech.edu/TAP/sync (pscomppars table)"
    ]
  },
  "Lalande 21185": {
    "distance_ly": 8.3,
    "ra": 11.0556,
    "dec": 35.97,
    "components": [
      {
        "name": "Lalande 21185 (GJ 411, HD 95735)",
        "short": "GJ 411, HD 95735",
        "mass": 0.389
      }
    ],
    "age": "3.5–12",
    "constellation": "Ursa Major",
    "planets": [
      {
        "name": "Lalande 21185 b (GJ 411 b)",
        "label": "b",
        "host": "Lalande 21185",
        "a": 0.07879,
        "period": 12.9394,
        "mass": 2.69,
        "massMin": true,
        "radius": null,
        "disputed": false
      },
      {
        "name": "Lalande 21185 c (HD 95735 c)",
        "label": "c",
        "host": "Lalande 21185",
        "a": 2.94,
        "period": 2946.0,
        "mass": 13.6,
        "massMin": true,
        "radius": null,
        "disputed": false
      }
    ],
    "candidates": "not confirmed: Lalande 21185 d",
    "sources": [
      "https://exoplanetarchive.ipac.caltech.edu/TAP/sync (pscomppars table)",
      "https://exoplanetarchive.ipac.caltech.edu/overview/GJ%20411%20b",
      "https://simbad.cds.unistra.fr/simbad/sim-tap (SIMBAD basic table)",
      "https://en.wikipedia.org/wiki/Lalande_21185",
      "https://ui.adsabs.harvard.edu/abs/2022AJ....163..218H/abstract"
    ]
  },
  "Sirius": {
    "distance_ly": 8.6,
    "ra": 6.7525,
    "dec": -16.716,
    "components": [
      {
        "name": "Sirius A",
        "short": "A",
        "mass": 2.063
      },
      {
        "name": "Sirius B",
        "short": "B",
        "mass": 1.018
      }
    ],
    "age": "0.2–0.3",
    "constellation": "Canis Major",
    "planets": [],
    "candidates": "not confirmed: Sirius C",
    "sources": [
      "https://simbad.cds.unistra.fr/simbad/sim-tap (SIMBAD basic table)",
      "https://en.wikipedia.org/wiki/Sirius",
      "https://exoplanetarchive.ipac.caltech.edu/TAP/sync (pscomppars table)"
    ]
  },
  "Luyten 726-8": {
    "distance_ly": 8.77,
    "ra": 1.6504,
    "dec": -17.951,
    "components": [
      {
        "name": "Luyten 726-8 A (BL Ceti)",
        "short": "A (BL Ceti",
        "mass": 0.122
      },
      {
        "name": "Luyten 726-8 B (UV Ceti)",
        "short": "B (UV Ceti",
        "mass": 0.116
      }
    ],
    "age": null,
    "constellation": "Cetus",
    "planets": [],
    "candidates": "not confirmed: Luyten 726-8 b (GJ 65 b)",
    "sources": [
      "https://simbad.cds.unistra.fr/simbad/sim-tap (SIMBAD basic table)",
      "https://en.wikipedia.org/wiki/Luyten_726-8"
    ]
  },
  "Ross 154": {
    "distance_ly": 9.71,
    "ra": 18.8304,
    "dec": -23.836,
    "components": [
      {
        "name": "Ross 154 (V1216 Sgr)",
        "short": "V1216 Sgr",
        "mass": 0.177
      }
    ],
    "age": "0.2–0.6",
    "constellation": "Sagittarius",
    "planets": [],
    "candidates": "not confirmed: Ross 154 (7-day signal)",
    "sources": [
      "https://simbad.cds.unistra.fr/simbad/sim-tap (SIMBAD basic table)",
      "https://en.wikipedia.org/wiki/Ross_154"
    ]
  },
  "Ross 248": {
    "distance_ly": 10.31,
    "ra": 23.6986,
    "dec": 44.177,
    "components": [
      {
        "name": "Ross 248",
        "short": "248",
        "mass": 0.145
      }
    ],
    "age": "2.6",
    "constellation": "Andromeda",
    "planets": [],
    "candidates": null,
    "sources": [
      "https://en.wikipedia.org/wiki/Ross_248",
      "https://simbad.cds.unistra.fr/simbad/ (SIMBAD TAP basic table: RA/Dec J2000, parallax)",
      "https://exoplanetarchive.ipac.caltech.edu/TAP/sync (pscomppars + ps tables, queried 2026-10-06)"
    ]
  },
  "Epsilon Eridani": {
    "distance_ly": 10.5,
    "ra": 3.5488,
    "dec": -9.458,
    "components": [
      {
        "name": "Epsilon Eridani",
        "short": "Eridani",
        "mass": 0.82
      }
    ],
    "age": "0.2–0.8",
    "constellation": "Eridanus",
    "planets": [
      {
        "name": "eps Eri b (AEgir)",
        "label": "b",
        "host": "Epsilon Eridani",
        "a": 3.53,
        "period": 2680.0,
        "mass": 317.83,
        "massMin": false,
        "radius": null,
        "disputed": false
      }
    ],
    "candidates": "not confirmed: eps Eri c",
    "sources": [
      "https://exoplanetarchive.ipac.caltech.edu/overview/eps%20Eri",
      "https://en.wikipedia.org/wiki/Epsilon_Eridani",
      "https://simbad.cds.unistra.fr/simbad/ (SIMBAD TAP basic table: RA/Dec J2000, parallax)",
      "https://exoplanetarchive.ipac.caltech.edu/TAP/sync (pscomppars + ps tables, queried 2026-10-06)"
    ]
  },
  "Lacaille 9352": {
    "distance_ly": 10.72,
    "ra": 23.0978,
    "dec": -35.853,
    "components": [
      {
        "name": "Lacaille 9352 (GJ 887)",
        "short": "GJ 887",
        "mass": 0.479
      }
    ],
    "age": "2.9–4.6",
    "constellation": "Piscis Austrinus",
    "planets": [
      {
        "name": "GJ 887 e",
        "label": "e",
        "host": "Lacaille 9352",
        "a": 0.0417,
        "period": 4.4249,
        "mass": 1.46,
        "massMin": true,
        "radius": null,
        "disputed": false
      },
      {
        "name": "GJ 887 b",
        "label": "b",
        "host": "Lacaille 9352",
        "a": 0.0683,
        "period": 9.2619,
        "mass": 3.9,
        "massMin": true,
        "radius": null,
        "disputed": false
      },
      {
        "name": "GJ 887 c",
        "label": "c",
        "host": "Lacaille 9352",
        "a": 0.121,
        "period": 21.784,
        "mass": 6.5,
        "massMin": true,
        "radius": null,
        "disputed": false
      },
      {
        "name": "GJ 887 d",
        "label": "d",
        "host": "Lacaille 9352",
        "a": 0.212,
        "period": 50.77,
        "mass": 6.1,
        "massMin": true,
        "radius": null,
        "disputed": false
      }
    ],
    "candidates": "not confirmed: GJ 887 f",
    "sources": [
      "https://exoplanetarchive.ipac.caltech.edu/overview/GJ%20887",
      "https://en.wikipedia.org/wiki/Lacaille_9352",
      "https://simbad.cds.unistra.fr/simbad/ (SIMBAD TAP basic table: RA/Dec J2000, parallax)",
      "https://exoplanetarchive.ipac.caltech.edu/TAP/sync (pscomppars + ps tables, queried 2026-10-06)"
    ]
  },
  "Ross 128": {
    "distance_ly": 11.01,
    "ra": 11.7957,
    "dec": 0.805,
    "components": [
      {
        "name": "Ross 128",
        "short": "128",
        "mass": 0.176
      }
    ],
    "age": "5",
    "constellation": "Virgo",
    "planets": [
      {
        "name": "Ross 128 b",
        "label": "b",
        "host": "Ross 128",
        "a": 0.0496,
        "period": 9.8658,
        "mass": 1.4,
        "massMin": true,
        "radius": null,
        "disputed": false
      }
    ],
    "candidates": null,
    "sources": [
      "https://exoplanetarchive.ipac.caltech.edu/overview/Ross%20128",
      "https://en.wikipedia.org/wiki/Ross_128",
      "https://simbad.cds.unistra.fr/simbad/ (SIMBAD TAP basic table: RA/Dec J2000, parallax)",
      "https://exoplanetarchive.ipac.caltech.edu/TAP/sync (pscomppars + ps tables, queried 2026-10-06)"
    ]
  },
  "EZ Aquarii": {
    "distance_ly": 11.11,
    "ra": 22.6427,
    "dec": -15.3,
    "components": [
      {
        "name": "EZ Aquarii A (Gl 866 A)",
        "short": "A (Gl 866 A",
        "mass": 0.1187
      },
      {
        "name": "EZ Aquarii C (Gl 866 C, also called Ab)",
        "short": "C (Gl 866 C, also called Ab",
        "mass": 0.093
      },
      {
        "name": "EZ Aquarii B (Gl 866 B)",
        "short": "B (Gl 866 B",
        "mass": 0.1145
      }
    ],
    "age": null,
    "constellation": "Aquarius",
    "planets": [],
    "candidates": null,
    "sources": [
      "https://en.wikipedia.org/wiki/EZ_Aquarii",
      "https://simbad.cds.unistra.fr/simbad/ (SIMBAD TAP basic table: RA/Dec J2000, parallax)",
      "https://exoplanetarchive.ipac.caltech.edu/TAP/sync (pscomppars + ps tables, queried 2026-10-06)"
    ]
  },
  "61 Cygni": {
    "distance_ly": 11.4,
    "ra": 21.115,
    "dec": 38.749,
    "components": [
      {
        "name": "61 Cygni A",
        "short": "A",
        "mass": 0.6771
      },
      {
        "name": "61 Cygni B",
        "short": "B",
        "mass": 0.6289
      }
    ],
    "age": null,
    "constellation": "Cygnus",
    "planets": [],
    "candidates": "not confirmed: 61 Cyg (A or B) b, van de Kamp / Soviet 1942-1977 claims",
    "sources": [
      "https://en.wikipedia.org/wiki/61_Cygni",
      "https://simbad.cds.unistra.fr/simbad/ (SIMBAD TAP basic table: RA/Dec J2000, parallax)",
      "https://exoplanetarchive.ipac.caltech.edu/TAP/sync (pscomppars + ps tables, queried 2026-10-06)"
    ]
  },
  "Procyon": {
    "distance_ly": 11.46,
    "ra": 7.655,
    "dec": 5.225,
    "components": [
      {
        "name": "Procyon A",
        "short": "A",
        "mass": 1.478
      },
      {
        "name": "Procyon B",
        "short": "B",
        "mass": 0.592
      }
    ],
    "age": "1.87",
    "constellation": "Canis Minor",
    "planets": [],
    "candidates": null,
    "sources": [
      "https://en.wikipedia.org/wiki/Procyon",
      "https://simbad.cds.unistra.fr/simbad/ (SIMBAD TAP basic table: RA/Dec J2000, parallax)",
      "https://exoplanetarchive.ipac.caltech.edu/TAP/sync (pscomppars + ps tables, queried 2026-10-06)"
    ]
  },
  "Struve 2398": {
    "distance_ly": 11.49,
    "ra": 18.713,
    "dec": 59.63,
    "components": [
      {
        "name": "Struve 2398 A (Gl 725 A)",
        "short": "A (Gl 725 A",
        "mass": 0.33
      },
      {
        "name": "Struve 2398 B (Gl 725 B)",
        "short": "B (Gl 725 B",
        "mass": 0.25
      }
    ],
    "age": "4–11",
    "constellation": "Draco",
    "planets": [
      {
        "name": "Gl 725 A b",
        "label": "b",
        "host": "Struve 2398 A",
        "a": 0.068,
        "period": 11.2201,
        "mass": 2.78,
        "massMin": true,
        "radius": null,
        "disputed": false
      },
      {
        "name": "Gl 725 B c",
        "label": "c",
        "host": "Struve 2398 B",
        "a": 0.139,
        "period": 37.9,
        "mass": 3.4,
        "massMin": true,
        "radius": null,
        "disputed": false
      }
    ],
    "candidates": "not confirmed: Gl 725 B b",
    "sources": [
      "https://exoplanetarchive.ipac.caltech.edu/overview/Gl%20725%20A",
      "https://exoplanetarchive.ipac.caltech.edu/overview/Gl%20725%20B",
      "https://en.wikipedia.org/wiki/Struve_2398",
      "https://simbad.cds.unistra.fr/simbad/ (SIMBAD TAP basic table: RA/Dec J2000, parallax)",
      "https://exoplanetarchive.ipac.caltech.edu/TAP/sync (pscomppars + ps tables, queried 2026-10-06)"
    ]
  },
  "Groombridge 34": {
    "distance_ly": 11.62,
    "ra": 0.3064,
    "dec": 44.023,
    "components": [
      {
        "name": "Groombridge 34 A (GX And, GJ 15 A)",
        "short": "A (GX And, GJ 15 A",
        "mass": 0.393
      },
      {
        "name": "Groombridge 34 B (GQ And, GJ 15 B)",
        "short": "B (GQ And, GJ 15 B",
        "mass": 0.15
      }
    ],
    "age": "3",
    "constellation": "Andromeda",
    "planets": [
      {
        "name": "GJ 15 A b",
        "label": "b",
        "host": "Groombridge 34 A",
        "a": 0.072,
        "period": 11.4407,
        "mass": 3.03,
        "massMin": true,
        "radius": null,
        "disputed": false
      },
      {
        "name": "GJ 15 A c",
        "label": "c",
        "host": "Groombridge 34 A",
        "a": 5.4,
        "period": 7600.0,
        "mass": 36.0,
        "massMin": true,
        "radius": null,
        "disputed": false
      }
    ],
    "candidates": null,
    "sources": [
      "https://exoplanetarchive.ipac.caltech.edu/overview/GJ%2015%20A",
      "https://en.wikipedia.org/wiki/Groombridge_34",
      "https://simbad.cds.unistra.fr/simbad/ (SIMBAD TAP basic table: RA/Dec J2000, parallax)",
      "https://exoplanetarchive.ipac.caltech.edu/TAP/sync (pscomppars + ps tables, queried 2026-10-06)"
    ]
  },
  "DX Cancri": {
    "distance_ly": 11.68,
    "ra": 8.497,
    "dec": 26.776,
    "components": [
      {
        "name": "DX Cancri",
        "short": "Cancri",
        "mass": 0.106
      }
    ],
    "age": "0.2",
    "constellation": "Cancer",
    "planets": [],
    "candidates": null,
    "sources": [
      "https://en.wikipedia.org/wiki/DX_Cancri",
      "https://simbad.cds.unistra.fr/simbad/ (SIMBAD TAP basic table: RA/Dec J2000, parallax)",
      "https://exoplanetarchive.ipac.caltech.edu/TAP/sync (pscomppars + ps tables, queried 2026-10-06)"
    ]
  },
  "Epsilon Indi": {
    "distance_ly": 11.87,
    "ra": 22.056,
    "dec": -56.786,
    "components": [
      {
        "name": "Epsilon Indi A",
        "short": "A",
        "mass": 0.782
      },
      {
        "name": "Epsilon Indi Ba",
        "short": "Ba",
        "mass": 0.0639
      },
      {
        "name": "Epsilon Indi Bb",
        "short": "Bb",
        "mass": 0.0508
      }
    ],
    "age": "2.5–4.3",
    "constellation": "Indus",
    "planets": [
      {
        "name": "eps Ind A b",
        "label": "b",
        "host": "Epsilon Indi A",
        "a": 15.76,
        "period": 25450.0,
        "mass": 2065.88,
        "massMin": false,
        "radius": null,
        "disputed": false
      }
    ],
    "candidates": null,
    "sources": [
      "https://exoplanetarchive.ipac.caltech.edu/TAP/sync (pscomppars + ps tables, queried 2026-10-06)",
      "https://exoplanetarchive.ipac.caltech.edu/overview/eps%20Ind%20A",
      "https://simbad.cds.unistra.fr/simbad/sim-tap (basic table: ICRS J2000 position, Gaia DR3 parallax)",
      "https://en.wikipedia.org/wiki/Epsilon_Indi"
    ]
  },
  "Tau Ceti": {
    "distance_ly": 11.91,
    "ra": 1.7345,
    "dec": -15.937,
    "components": [
      {
        "name": "Tau Ceti",
        "short": "Ceti",
        "mass": 0.8
      }
    ],
    "age": "8–10",
    "constellation": "Cetus",
    "planets": [
      {
        "name": "tau Cet g",
        "label": "g",
        "host": "Tau Ceti",
        "a": 0.133,
        "period": 20.0,
        "mass": 1.75,
        "massMin": true,
        "radius": null,
        "disputed": true
      },
      {
        "name": "tau Cet h",
        "label": "h",
        "host": "Tau Ceti",
        "a": 0.243,
        "period": 49.41,
        "mass": 1.83,
        "massMin": true,
        "radius": null,
        "disputed": true
      },
      {
        "name": "tau Cet f",
        "label": "f",
        "host": "Tau Ceti",
        "a": 1.334,
        "period": 636.13,
        "mass": 3.93,
        "massMin": true,
        "radius": null,
        "disputed": true
      }
    ],
    "candidates": "not confirmed: tau Cet b, tau Cet c, tau Cet d, tau Cet e",
    "sources": [
      "https://exoplanetarchive.ipac.caltech.edu/TAP/sync (pscomppars + ps tables, queried 2026-10-06)",
      "https://exoplanetarchive.ipac.caltech.edu/overview/tau%20Cet",
      "https://simbad.cds.unistra.fr/simbad/sim-tap (basic table: ICRS J2000 position, Gaia DR3 parallax)",
      "https://en.wikipedia.org/wiki/Tau_Ceti"
    ]
  },
  "GJ 1061": {
    "distance_ly": 11.98,
    "ra": 3.5999,
    "dec": -44.513,
    "components": [
      {
        "name": "GJ 1061",
        "short": "1061",
        "mass": 0.125
      }
    ],
    "age": ">7",
    "constellation": "Horologium",
    "planets": [
      {
        "name": "GJ 1061 b",
        "label": "b",
        "host": "GJ 1061",
        "a": 0.021,
        "period": 3.2073,
        "mass": 1.11,
        "massMin": false,
        "radius": null,
        "disputed": false
      },
      {
        "name": "GJ 1061 c",
        "label": "c",
        "host": "GJ 1061",
        "a": 0.0342,
        "period": 6.6821,
        "mass": 1.81,
        "massMin": false,
        "radius": null,
        "disputed": false
      },
      {
        "name": "GJ 1061 d",
        "label": "d",
        "host": "GJ 1061",
        "a": 0.054,
        "period": 13.066,
        "mass": 1.67,
        "massMin": false,
        "radius": null,
        "disputed": false
      }
    ],
    "candidates": null,
    "sources": [
      "https://exoplanetarchive.ipac.caltech.edu/TAP/sync (pscomppars + ps tables, queried 2026-10-06)",
      "https://exoplanetarchive.ipac.caltech.edu/overview/GJ%201061",
      "https://simbad.cds.unistra.fr/simbad/sim-tap (basic table: ICRS J2000 position, Gaia DR3 parallax)",
      "https://en.wikipedia.org/wiki/GJ_1061"
    ]
  },
  "YZ Ceti": {
    "distance_ly": 12.12,
    "ra": 1.2085,
    "dec": -16.999,
    "components": [
      {
        "name": "YZ Ceti",
        "short": "Ceti",
        "mass": 0.13
      }
    ],
    "age": "4–6",
    "constellation": "Cetus",
    "planets": [
      {
        "name": "YZ Cet b",
        "label": "b",
        "host": "YZ Ceti",
        "a": 0.01634,
        "period": 2.02087,
        "mass": 0.7,
        "massMin": true,
        "radius": null,
        "disputed": false
      },
      {
        "name": "YZ Cet c",
        "label": "c",
        "host": "YZ Ceti",
        "a": 0.02156,
        "period": 3.05989,
        "mass": 1.14,
        "massMin": true,
        "radius": null,
        "disputed": false
      },
      {
        "name": "YZ Cet d",
        "label": "d",
        "host": "YZ Ceti",
        "a": 0.02851,
        "period": 4.65626,
        "mass": 1.09,
        "massMin": true,
        "radius": null,
        "disputed": false
      }
    ],
    "candidates": "not confirmed: YZ Cet e",
    "sources": [
      "https://exoplanetarchive.ipac.caltech.edu/TAP/sync (pscomppars + ps tables, queried 2026-10-06)",
      "https://exoplanetarchive.ipac.caltech.edu/overview/YZ%20Cet",
      "https://simbad.cds.unistra.fr/simbad/sim-tap (basic table: ICRS J2000 position, Gaia DR3 parallax)",
      "https://en.wikipedia.org/wiki/YZ_Ceti"
    ]
  },
  "Luyten's Star": {
    "distance_ly": 12.35,
    "ra": 7.4568,
    "dec": 5.226,
    "components": [
      {
        "name": "Luyten's Star",
        "short": "Star",
        "mass": 0.29
      }
    ],
    "age": ">8",
    "constellation": "Canis Minor",
    "planets": [
      {
        "name": "GJ 273 c",
        "label": "c",
        "host": "Luyten's Star",
        "a": 0.036467,
        "period": 4.7234,
        "mass": 1.18,
        "massMin": true,
        "radius": null,
        "disputed": false
      },
      {
        "name": "GJ 273 b",
        "label": "b",
        "host": "Luyten's Star",
        "a": 0.091101,
        "period": 18.6498,
        "mass": 2.89,
        "massMin": true,
        "radius": null,
        "disputed": false
      }
    ],
    "candidates": "not confirmed: GJ 273 d, GJ 273 e",
    "sources": [
      "https://exoplanetarchive.ipac.caltech.edu/TAP/sync (pscomppars + ps tables, queried 2026-10-06)",
      "https://exoplanetarchive.ipac.caltech.edu/overview/GJ%20273",
      "https://simbad.cds.unistra.fr/simbad/sim-tap (basic table: ICRS J2000 position, Gaia DR3 parallax)",
      "https://en.wikipedia.org/wiki/Luyten%27s_Star"
    ]
  },
  "Teegarden's Star": {
    "distance_ly": 12.5,
    "ra": 2.8836,
    "dec": 16.881,
    "components": [
      {
        "name": "Teegarden's Star",
        "short": "Star",
        "mass": 0.097
      }
    ],
    "age": ">8",
    "constellation": "Aries",
    "planets": [
      {
        "name": "Teegarden's Star b",
        "label": "b",
        "host": "Teegarden's Star",
        "a": 0.0259,
        "period": 4.90634,
        "mass": 1.16,
        "massMin": true,
        "radius": null,
        "disputed": false
      },
      {
        "name": "Teegarden's Star c",
        "label": "c",
        "host": "Teegarden's Star",
        "a": 0.0455,
        "period": 11.416,
        "mass": 1.05,
        "massMin": true,
        "radius": null,
        "disputed": false
      },
      {
        "name": "Teegarden's Star d",
        "label": "d",
        "host": "Teegarden's Star",
        "a": 0.0791,
        "period": 26.13,
        "mass": 0.82,
        "massMin": true,
        "radius": null,
        "disputed": false
      }
    ],
    "candidates": "not confirmed: 172-day RV signal",
    "sources": [
      "https://exoplanetarchive.ipac.caltech.edu/TAP/sync (pscomppars + ps tables, queried 2026-10-06)",
      "https://exoplanetarchive.ipac.caltech.edu/overview/Teegarden%27s%20Star",
      "https://simbad.cds.unistra.fr/simbad/sim-tap (basic table: ICRS J2000 position, Gaia DR3 parallax)",
      "https://en.wikipedia.org/wiki/Teegarden%27s_Star"
    ]
  },
  "Kapteyn's Star": {
    "distance_ly": 12.83,
    "ra": 5.1946,
    "dec": -45.018,
    "components": [
      {
        "name": "Kapteyn's Star",
        "short": "Star",
        "mass": 0.281
      }
    ],
    "age": "10–12",
    "constellation": "Pictor",
    "planets": [
      {
        "name": "Kapteyn c",
        "label": "c",
        "host": "Kapteyn's Star",
        "a": 0.311,
        "period": 121.54,
        "mass": 7.0,
        "massMin": true,
        "radius": null,
        "disputed": true
      }
    ],
    "candidates": "not confirmed: Kapteyn b",
    "sources": [
      "https://exoplanetarchive.ipac.caltech.edu/TAP/sync (pscomppars + ps tables, queried 2026-10-06)",
      "https://exoplanetarchive.ipac.caltech.edu/overview/Kapteyn",
      "https://simbad.cds.unistra.fr/simbad/sim-tap (basic table: ICRS J2000 position, Gaia DR3 parallax)",
      "https://en.wikipedia.org/wiki/Kapteyn%27s_Star"
    ]
  },
  "Lacaille 8760": {
    "distance_ly": 12.95,
    "ra": 21.2876,
    "dec": -38.867,
    "components": [
      {
        "name": "Lacaille 8760",
        "short": "8760",
        "mass": 0.6
      }
    ],
    "age": "1.9–7.7",
    "constellation": "Microscopium",
    "planets": [],
    "candidates": null,
    "sources": [
      "https://exoplanetarchive.ipac.caltech.edu/TAP/sync (pscomppars + ps tables, queried 2026-10-06)",
      "https://simbad.cds.unistra.fr/simbad/sim-tap (basic table: ICRS J2000 position, Gaia DR3 parallax)",
      "https://en.wikipedia.org/wiki/Lacaille_8760"
    ]
  },
  "SCR 1845-6357": {
    "distance_ly": 13.06,
    "ra": 18.7515,
    "dec": -63.963,
    "components": [
      {
        "name": "SCR 1845-6357 A",
        "short": "A",
        "mass": 0.0753
      },
      {
        "name": "SCR 1845-6357 B",
        "short": "B",
        "mass": null
      }
    ],
    "age": ">1.5",
    "constellation": "Pavo",
    "planets": [],
    "candidates": null,
    "sources": [
      "https://simbad.cds.unistra.fr/simbad/sim-tap (basic table: ICRS J2000 position, Gaia DR3 parallax)",
      "https://en.wikipedia.org/wiki/SCR_1845-6357"
    ]
  },
  "Kruger 60": {
    "distance_ly": 13.08,
    "ra": 22.4665,
    "dec": 57.695,
    "components": [
      {
        "name": "Kruger 60 A",
        "short": "A",
        "mass": 0.271
      },
      {
        "name": "Kruger 60 B (DO Cephei)",
        "short": "B (DO Cephei",
        "mass": 0.176
      }
    ],
    "age": null,
    "constellation": "Cepheus",
    "planets": [],
    "candidates": null,
    "sources": [
      "https://simbad.cds.unistra.fr/simbad/sim-tap (basic table: ICRS J2000 position, Gaia DR3 parallax)",
      "https://en.wikipedia.org/wiki/Kruger_60"
    ]
  },
  "Ross 614": {
    "distance_ly": 13.42,
    "ra": 6.4898,
    "dec": -2.814,
    "components": [
      {
        "name": "Ross 614 A",
        "short": "A",
        "mass": 0.2228
      },
      {
        "name": "Ross 614 B",
        "short": "B",
        "mass": 0.0905
      }
    ],
    "age": null,
    "constellation": "Monoceros",
    "planets": [],
    "candidates": null,
    "sources": [
      "https://simbad.cds.unistra.fr/simbad/sim-id?Ident=Ross+614",
      "https://en.wikipedia.org/wiki/Ross_614",
      "https://gea.esac.esa.int/archive/ (Gaia DR3 cone search)",
      "https://exoplanetarchive.ipac.caltech.edu/TAP/sync (pscomppars/ps tables, queried 2026-10-06)"
    ]
  },
  "Wolf 1061": {
    "distance_ly": 14.05,
    "ra": 16.505,
    "dec": -12.663,
    "components": [
      {
        "name": "Wolf 1061",
        "short": "1061",
        "mass": 0.304
      }
    ],
    "age": null,
    "constellation": "Ophiuchus",
    "planets": [
      {
        "name": "Wolf 1061 b",
        "label": "b",
        "host": "Wolf 1061",
        "a": 0.0375,
        "period": 4.8869,
        "mass": 1.91,
        "massMin": true,
        "radius": null,
        "disputed": false
      },
      {
        "name": "Wolf 1061 c",
        "label": "c",
        "host": "Wolf 1061",
        "a": 0.089,
        "period": 17.8719,
        "mass": 3.41,
        "massMin": true,
        "radius": null,
        "disputed": false
      },
      {
        "name": "Wolf 1061 d",
        "label": "d",
        "host": "Wolf 1061",
        "a": 0.47,
        "period": 217.21,
        "mass": 7.7,
        "massMin": true,
        "radius": null,
        "disputed": false
      }
    ],
    "candidates": null,
    "sources": [
      "https://simbad.cds.unistra.fr/simbad/sim-id?Ident=Wolf+1061",
      "https://en.wikipedia.org/wiki/Wolf_1061",
      "https://exoplanetarchive.ipac.caltech.edu/overview/Wolf%201061",
      "https://exoplanetarchive.ipac.caltech.edu/TAP/sync (pscomppars/ps tables, queried 2026-10-06)",
      "https://ui.adsabs.harvard.edu/abs/2017A&A...602A..88A/abstract"
    ]
  },
  "Wolf 424": {
    "distance_ly": 14.37,
    "ra": 12.5548,
    "dec": 9.021,
    "components": [
      {
        "name": "Wolf 424 A",
        "short": "A",
        "mass": 0.1379
      },
      {
        "name": "Wolf 424 B",
        "short": "B",
        "mass": 0.1258
      }
    ],
    "age": null,
    "constellation": "Virgo",
    "planets": [],
    "candidates": null,
    "sources": [
      "https://simbad.cds.unistra.fr/simbad/sim-id?Ident=Wolf+424",
      "https://en.wikipedia.org/wiki/Wolf_424",
      "https://gea.esac.esa.int/archive/ (Gaia DR3 cone search)",
      "https://exoplanetarchive.ipac.caltech.edu/TAP/sync (pscomppars/ps tables, queried 2026-10-06)"
    ]
  },
  "Van Maanen's Star": {
    "distance_ly": 14.07,
    "ra": 0.8194,
    "dec": 5.389,
    "components": [
      {
        "name": "Van Maanen 2 (white dwarf)",
        "short": "dwarf)",
        "mass": 0.67
      }
    ],
    "age": "4.1",
    "constellation": "Pisces",
    "planets": [],
    "candidates": "not confirmed: van Maanen 2 b (unnamed)",
    "sources": [
      "https://simbad.cds.unistra.fr/simbad/sim-id?Ident=van+Maanen+2",
      "https://en.wikipedia.org/wiki/Van_Maanen_2",
      "https://exoplanetarchive.ipac.caltech.edu/TAP/sync (pscomppars/ps tables, queried 2026-10-06)"
    ]
  },
  "Gliese 1": {
    "distance_ly": 14.18,
    "ra": 0.0901,
    "dec": -37.357,
    "components": [
      {
        "name": "Gliese 1",
        "short": "1",
        "mass": 0.33
      }
    ],
    "age": "8.27",
    "constellation": "Sculptor",
    "planets": [],
    "candidates": null,
    "sources": [
      "https://simbad.cds.unistra.fr/simbad/sim-id?Ident=GJ+1",
      "https://en.wikipedia.org/wiki/Gliese_1",
      "https://exoplanetarchive.ipac.caltech.edu/TAP/sync (pscomppars/ps tables, queried 2026-10-06)"
    ]
  },
  "TZ Arietis": {
    "distance_ly": 14.58,
    "ra": 2.0036,
    "dec": 13.052,
    "components": [
      {
        "name": "TZ Arietis",
        "short": "Arietis",
        "mass": 0.14
      }
    ],
    "age": "4.8",
    "constellation": "Aries",
    "planets": [
      {
        "name": "TZ Arietis b (NASA archive name: GJ 9066 c)",
        "label": "b",
        "host": "TZ Arietis",
        "a": 0.88,
        "period": 771.36,
        "mass": 66.74,
        "massMin": true,
        "radius": null,
        "disputed": false
      }
    ],
    "candidates": "not confirmed: GJ 9066 b / ~240-day signal, ~2-day signal",
    "sources": [
      "https://simbad.cds.unistra.fr/simbad/sim-id?Ident=TZ+Ari",
      "https://en.wikipedia.org/wiki/TZ_Arietis",
      "https://exoplanetarchive.ipac.caltech.edu/overview/GJ%209066",
      "https://exoplanetarchive.ipac.caltech.edu/TAP/sync (pscomppars/ps tables, queried 2026-10-06)",
      "https://ui.adsabs.harvard.edu/abs/2022A&A...663A..48Q/abstract"
    ]
  },
  "Gliese 674": {
    "distance_ly": 14.85,
    "ra": 17.4778,
    "dec": -46.895,
    "components": [
      {
        "name": "Gliese 674",
        "short": "674",
        "mass": 0.353
      }
    ],
    "age": "0.1–1.0",
    "constellation": "Ara",
    "planets": [
      {
        "name": "GJ 674 b",
        "label": "b",
        "host": "Gliese 674",
        "a": 0.039,
        "period": 4.6938,
        "mass": 11.09,
        "massMin": true,
        "radius": null,
        "disputed": false
      }
    ],
    "candidates": null,
    "sources": [
      "https://simbad.cds.unistra.fr/simbad/sim-id?Ident=GJ+674",
      "https://en.wikipedia.org/wiki/Gliese_674",
      "https://exoplanetarchive.ipac.caltech.edu/overview/GJ%20674",
      "https://exoplanetarchive.ipac.caltech.edu/TAP/sync (pscomppars/ps tables, queried 2026-10-06)"
    ]
  },
  "Gliese 687": {
    "distance_ly": 14.84,
    "ra": 17.6072,
    "dec": 68.339,
    "components": [
      {
        "name": "Gliese 687",
        "short": "687",
        "mass": 0.4
      }
    ],
    "age": null,
    "constellation": "Draco",
    "planets": [
      {
        "name": "GJ 687 b",
        "label": "b",
        "host": "Gliese 687",
        "a": 0.163,
        "period": 38.142,
        "mass": 17.2,
        "massMin": true,
        "radius": null,
        "disputed": false
      },
      {
        "name": "GJ 687 c",
        "label": "c",
        "host": "Gliese 687",
        "a": 1.165,
        "period": 727.562,
        "mass": 16.0,
        "massMin": true,
        "radius": null,
        "disputed": false
      }
    ],
    "candidates": null,
    "sources": [
      "https://simbad.cds.unistra.fr/simbad/sim-id?Ident=GJ+687",
      "https://en.wikipedia.org/wiki/Gliese_687",
      "https://exoplanetarchive.ipac.caltech.edu/overview/GJ%20687",
      "https://exoplanetarchive.ipac.caltech.edu/TAP/sync (pscomppars/ps tables, queried 2026-10-06)"
    ]
  },
  "Gliese 440": {
    "distance_ly": 15.12,
    "ra": 11.7619,
    "dec": -64.842,
    "components": [
      {
        "name": "Gliese 440 (LAWD 37, white dwarf)",
        "short": "LAWD 37, white dwarf",
        "mass": 0.56
      }
    ],
    "age": null,
    "constellation": "Musca",
    "planets": [],
    "candidates": "not confirmed: LAWD 37 b (unnamed)",
    "sources": [
      "https://simbad.cds.unistra.fr/simbad/sim-id?Ident=GJ+440",
      "https://en.wikipedia.org/wiki/LAWD_37",
      "https://exoplanetarchive.ipac.caltech.edu/TAP/sync (pscomppars/ps tables, queried 2026-10-06)"
    ]
  },
  "Gliese 876": {
    "distance_ly": 15.24,
    "ra": 22.888,
    "dec": -14.264,
    "components": [
      {
        "name": "Gliese 876",
        "short": "876",
        "mass": 0.346
      }
    ],
    "age": null,
    "constellation": "Aquarius",
    "planets": [
      {
        "name": "GJ 876 d",
        "label": "d",
        "host": "Gliese 876",
        "a": 0.0208,
        "period": 1.93778,
        "mass": 6.83,
        "massMin": false,
        "radius": null,
        "disputed": false
      },
      {
        "name": "GJ 876 c",
        "label": "c",
        "host": "Gliese 876",
        "a": 0.1296,
        "period": 30.0881,
        "mass": 226.98,
        "massMin": false,
        "radius": null,
        "disputed": false
      },
      {
        "name": "GJ 876 b",
        "label": "b",
        "host": "Gliese 876",
        "a": 0.2083,
        "period": 61.1166,
        "mass": 723.22,
        "massMin": false,
        "radius": null,
        "disputed": false
      },
      {
        "name": "GJ 876 e",
        "label": "e",
        "host": "Gliese 876",
        "a": 0.3343,
        "period": 124.26,
        "mass": 14.6,
        "massMin": false,
        "radius": null,
        "disputed": false
      }
    ],
    "candidates": null,
    "sources": [
      "https://simbad.cds.unistra.fr/simbad/sim-id?Ident=GJ+876",
      "https://en.wikipedia.org/wiki/Gliese_876",
      "https://exoplanetarchive.ipac.caltech.edu/overview/GJ%20876",
      "https://exoplanetarchive.ipac.caltech.edu/TAP/sync (pscomppars/ps tables, queried 2026-10-06)",
      "https://ui.adsabs.harvard.edu/abs/2010ApJ...719..890R/abstract"
    ]
  },
  "LHS 288": {
    "distance_ly": 15.76,
    "ra": 10.739,
    "dec": -61.21,
    "components": [
      {
        "name": "LHS 288",
        "short": "288",
        "mass": 0.1085
      }
    ],
    "age": null,
    "constellation": "Carina",
    "planets": [],
    "candidates": "not confirmed: LHS 288 b (unnamed astrometric candidate)",
    "sources": [
      "https://simbad.cds.unistra.fr/simbad/sim-id?Ident=LHS+288",
      "https://en.wikipedia.org/wiki/LHS_288",
      "https://exoplanetarchive.ipac.caltech.edu/TAP/sync"
    ]
  },
  "GJ 1002": {
    "distance_ly": 15.81,
    "ra": 0.112,
    "dec": -7.538,
    "components": [
      {
        "name": "GJ 1002",
        "short": "1002",
        "mass": 0.12
      }
    ],
    "age": null,
    "constellation": "Cetus",
    "planets": [
      {
        "name": "GJ 1002 b",
        "label": "b",
        "host": "GJ 1002",
        "a": 0.0457,
        "period": 10.3465,
        "mass": 1.08,
        "massMin": true,
        "radius": null,
        "disputed": false
      },
      {
        "name": "GJ 1002 c",
        "label": "c",
        "host": "GJ 1002",
        "a": 0.0738,
        "period": 21.202,
        "mass": 1.36,
        "massMin": true,
        "radius": null,
        "disputed": false
      }
    ],
    "candidates": null,
    "sources": [
      "https://simbad.cds.unistra.fr/simbad/sim-id?Ident=GJ+1002",
      "https://en.wikipedia.org/wiki/Gliese_1002",
      "https://exoplanetarchive.ipac.caltech.edu/overview/GJ%201002",
      "https://ui.adsabs.harvard.edu/abs/2023A&A...670A...5S/abstract"
    ]
  },
  "Gliese 412": {
    "distance_ly": 16.0,
    "ra": 11.091,
    "dec": 43.527,
    "components": [
      {
        "name": "Gliese 412 A",
        "short": "A",
        "mass": 0.387
      },
      {
        "name": "Gliese 412 B (WX Ursae Majoris)",
        "short": "B (WX Ursae Majoris",
        "mass": 0.0952
      }
    ],
    "age": "3",
    "constellation": "Ursa Major",
    "planets": [],
    "candidates": null,
    "sources": [
      "https://simbad.cds.unistra.fr/simbad/sim-id?Ident=GJ+412+A",
      "https://simbad.cds.unistra.fr/simbad/sim-id?Ident=WX+UMa",
      "https://en.wikipedia.org/wiki/Gliese_412"
    ]
  },
  "Groombridge 1618": {
    "distance_ly": 15.89,
    "ra": 10.189,
    "dec": 49.454,
    "components": [
      {
        "name": "Groombridge 1618",
        "short": "1618",
        "mass": 0.67
      }
    ],
    "age": "6.6",
    "constellation": "Ursa Major",
    "planets": [],
    "candidates": "not confirmed: Groombridge 1618 (122-day RV signal)",
    "sources": [
      "https://simbad.cds.unistra.fr/simbad/sim-id?Ident=GJ+380",
      "https://en.wikipedia.org/wiki/Groombridge_1618"
    ]
  },
  "AD Leonis": {
    "distance_ly": 16.19,
    "ra": 10.327,
    "dec": 19.87,
    "components": [
      {
        "name": "AD Leonis",
        "short": "Leonis",
        "mass": 0.423
      }
    ],
    "age": "0.025–0.3",
    "constellation": "Leo",
    "planets": [],
    "candidates": "not confirmed: AD Leonis b",
    "sources": [
      "https://simbad.cds.unistra.fr/simbad/sim-id?Ident=AD+Leo",
      "https://en.wikipedia.org/wiki/AD_Leonis",
      "https://exoplanetarchive.ipac.caltech.edu/TAP/sync"
    ]
  },
  "Gliese 832": {
    "distance_ly": 16.2,
    "ra": 21.559,
    "dec": -49.009,
    "components": [
      {
        "name": "Gliese 832",
        "short": "832",
        "mass": 0.45
      }
    ],
    "age": "4.5–8.1",
    "constellation": "Grus",
    "planets": [
      {
        "name": "GJ 832 b",
        "label": "b",
        "host": "Gliese 832",
        "a": 3.7,
        "period": 3853.0,
        "mass": 314.65,
        "massMin": false,
        "radius": null,
        "disputed": false
      }
    ],
    "candidates": "not confirmed: Gliese 832 c",
    "sources": [
      "https://simbad.cds.unistra.fr/simbad/sim-id?Ident=GJ+832",
      "https://en.wikipedia.org/wiki/Gliese_832",
      "https://exoplanetarchive.ipac.caltech.edu/overview/GJ%20832",
      "https://ui.adsabs.harvard.edu/abs/2023A&A...678A.107P/abstract"
    ]
  },
  "40 Eridani": {
    "distance_ly": 16.34,
    "ra": 4.255,
    "dec": -7.653,
    "components": [
      {
        "name": "40 Eridani A (Keid)",
        "short": "A (Keid",
        "mass": 0.78
      },
      {
        "name": "40 Eridani B",
        "short": "B",
        "mass": 0.558
      },
      {
        "name": "40 Eridani C",
        "short": "C",
        "mass": 0.198
      }
    ],
    "age": null,
    "constellation": "Eridanus",
    "planets": [],
    "candidates": "not confirmed: 40 Eridani b (HD 26965 b, 'Vulcan')",
    "sources": [
      "https://simbad.cds.unistra.fr/simbad/sim-id?Ident=40+Eri",
      "https://simbad.cds.unistra.fr/simbad/sim-id?Ident=40+Eri+B",
      "https://simbad.cds.unistra.fr/simbad/sim-id?Ident=40+Eri+C",
      "https://en.wikipedia.org/wiki/40_Eridani",
      "https://science.nasa.gov/universe/exoplanets/discovery-alert-spocks-home-planet-goes-poof/",
      "https://astrobiology.com/2024/05/29/star-treks-vulcan-thought-to-orbit-40-eridani-a-is-not-a-planet-after-all/"
    ]
  },
  "70 Ophiuchi": {
    "distance_ly": 16.66,
    "ra": 18.091,
    "dec": 2.5,
    "components": [
      {
        "name": "70 Ophiuchi A",
        "short": "A",
        "mass": 0.8827
      },
      {
        "name": "70 Ophiuchi B",
        "short": "B",
        "mass": 0.7319
      }
    ],
    "age": "2.8–6.2",
    "constellation": "Ophiuchus",
    "planets": [],
    "candidates": "not confirmed: 70 Oph historical companion claims",
    "sources": [
      "https://simbad.cds.unistra.fr/simbad/sim-id?Ident=70+Oph",
      "https://simbad.cds.unistra.fr/simbad/sim-id?Ident=70+Oph+A",
      "https://simbad.cds.unistra.fr/simbad/sim-id?Ident=70+Oph+B",
      "https://en.wikipedia.org/wiki/70_Ophiuchi"
    ]
  },
  "Altair": {
    "distance_ly": 16.73,
    "ra": 19.846,
    "dec": 8.868,
    "components": [
      {
        "name": "Altair",
        "short": "Altair",
        "mass": 1.86
      }
    ],
    "age": "0.078–0.098",
    "constellation": "Aquila",
    "planets": [],
    "candidates": null,
    "sources": [
      "https://simbad.cds.unistra.fr/simbad/sim-id?Ident=alf+Aql",
      "https://en.wikipedia.org/wiki/Altair"
    ]
  },
  "Sun": {
    "distance_ly": 0.0,
    "ra": null,
    "dec": null,
    "components": [
      {
        "name": "Sun",
        "short": "Sun",
        "mass": 1.0
      }
    ],
    "age": "4.6",
    "constellation": null,
    "planets": [
      {
        "name": "Mercury",
        "label": "Mercury",
        "host": "Sun",
        "a": 0.387,
        "period": 88.0,
        "mass": 0.0553,
        "massMin": false,
        "radius": 0.383,
        "disputed": false
      },
      {
        "name": "Venus",
        "label": "Venus",
        "host": "Sun",
        "a": 0.723,
        "period": 224.7,
        "mass": 0.815,
        "massMin": false,
        "radius": 0.949,
        "disputed": false
      },
      {
        "name": "Earth",
        "label": "Earth",
        "host": "Sun",
        "a": 1.0,
        "period": 365.2,
        "mass": 1.0,
        "massMin": false,
        "radius": 1.0,
        "disputed": false
      },
      {
        "name": "Mars",
        "label": "Mars",
        "host": "Sun",
        "a": 1.52,
        "period": 687.0,
        "mass": 0.107,
        "massMin": false,
        "radius": 0.532,
        "disputed": false
      },
      {
        "name": "Jupiter",
        "label": "Jupiter",
        "host": "Sun",
        "a": 5.2,
        "period": 4331.0,
        "mass": 317.8,
        "massMin": false,
        "radius": 11.21,
        "disputed": false
      },
      {
        "name": "Saturn",
        "label": "Saturn",
        "host": "Sun",
        "a": 9.57,
        "period": 10747.0,
        "mass": 95.2,
        "massMin": false,
        "radius": 9.45,
        "disputed": false
      },
      {
        "name": "Uranus",
        "label": "Uranus",
        "host": "Sun",
        "a": 19.17,
        "period": 30589.0,
        "mass": 14.5,
        "massMin": false,
        "radius": 4.01,
        "disputed": false
      },
      {
        "name": "Neptune",
        "label": "Neptune",
        "host": "Sun",
        "a": 30.18,
        "period": 59800.0,
        "mass": 17.1,
        "massMin": false,
        "radius": 3.88,
        "disputed": false
      }
    ],
    "candidates": null,
    "sources": [
      "https://nssdc.gsfc.nasa.gov/planetary/factsheet/",
      "https://nssdc.gsfc.nasa.gov/planetary/factsheet/planet_table_ratio.html",
      "https://nssdc.gsfc.nasa.gov/planetary/factsheet/sunfact.html",
      "https://en.wikipedia.org/wiki/Sun"
    ]
  }
};
