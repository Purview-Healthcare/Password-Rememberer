# Claim Inspector

Offline revenue-cycle workbench for **family medicine**. Open `index.html` in a browser (no build, no server, nothing leaves the device).

| Tab | What it does |
|---|---|
| Home | 12-step end-to-end RCM cycle with checklists, pitfalls and KPI targets |
| Inspect claim | CMS-1500-style scrubber: ~90 rules (modifiers 25/59/X/QW/33/95, NCCI-style pairs, age/sex edits, POS, vaccines, Medicare G-codes, dx pointers, medical necessity, taxonomy scope) with one-click fixes |
| Match lab | CPT ↔ ICD-10 necessity, service/dx ↔ patient age & sex, dx ↔ provider taxonomy; reverse dx → services |
| E/M leveler | 2021+ MDM table, time thresholds, new vs. established, 99417 / G2212, G2211 |
| Modifiers | Decision tree + reference for ~55 modifiers |
| Charge capture | "What did you do?" → codes you may have missed |
| Preventive | Pediatric to 65+ schedules with CPT and ICD-10 |
| Programs | CCM, PCM, APCM, TCM, RPM, BHI, AWV/IPPE, ACP, telehealth + documentation coach |
| Denials | CARC/RARC fixes, appeal-letter generator, timely-filing table |
| Code explorer / Reference | Built-in code set, dx families, taxonomies, CMS-1500 map, POS, quality measures |

`engine.js` is a pure module (works in Node): `node test/engine.test.js`.

**Caveat:** a decision-support reference, not a payer. Code sets and payer/Medicare rules change (CPT yearly, ICD-10-CM each October, NCCI quarterly). Verify against current sources. Don't enter patient identifiers.
