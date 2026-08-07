# STRUCTURA Material Calculators — Migration Report (Reference Stop)

**Status:** Brick Wall reference implementation complete — awaiting approval before migrating Sets 01–06.  
**Branch:** `material-calculators-platform`  
**Date:** 2026-08-07  
**Scope completed:** Brick Wall Material Calculator only

---

## Architectural objective

Convert independent HTML calculators into:

**ONE common STRUCTURA platform** + **36 calculator-specific engines**

without redesigning all calculators or altering verified formulas.

---

## What landed

### Package location

`/public/material-calculators/`

Includes the full Stage 1 library (36 calculators + icons + prior SVG QA docs).

### Shared platform modules

| Module | Path |
|---|---|
| Report / print engine | `/public/material-calculators/js/structura-report-engine.js` |
| Report / print CSS | `/public/material-calculators/css/structura-report.css` |
| Calculator core utils | `/public/material-calculators/js/structura-calculator-core.js` |
| Country / profile service | `/public/material-calculators/js/structura-country-service.js` |
| Translation engine | `/public/material-calculators/js/structura-i18n.js` |
| Project information | `/public/material-calculators/js/structura-project.js` |
| Validation / QA helpers | `/public/material-calculators/js/structura-validation.js` |
| API client | `/public/material-calculators/js/structura-api-client.js` |

### Backend contract (common, not 36 backends)

| Endpoint | Purpose |
|---|---|
| `POST /api/calculations` | Persist calculation payload |
| `GET /api/calculations/:id` | Retrieve calculation |
| `POST /api/reports` | Accept report payload (Stage 1 stub) |
| `GET /api/projects/:projectId` | Project stub |
| `GET /api/regions/:countryCode` | Region profile |
| `GET /api/material-data/:countryCode` | Material defaults |

Frontend payload shape:

`calculatorId`, `calculatorVersion`, `projectId`, `country`, `language`, `inputs`, `results`, `assumptions`, `timestamp` (+ warnings).

Basic client-side calculation does **not** require the backend.

### Site integration

- Route: `/material-calculators` → iframe of `public/material-calculators/index.html`
- Temporary public nav now includes **Material Calculators**
- Sitemap updated for temporary launch mode

---

## Brick Wall reference adapter

`window.STRUCTURA_CALCULATOR` exposes:

- `meta` (`id`, `title`, `category`, `version`, `printOrientation`)
- `getProjectData()`
- `getInputs()`
- `calculate()`
- `getResults()`
- `getCalculationSteps()`
- `getMaterialSchedule()`
- `getAssumptions()`
- `getWarnings()`
- `getSVG()`
- `reset()`

Print / Save PDF now calls:

`StructuraReport.print(window.STRUCTURA_CALCULATOR)`

Report generation rebuilds from **current** calculator values (never stale print DOM), clones the live SVG as vector artwork, and strips print-hostile SVG filter nodes from the clone.

Country and language are independent controls.

---

## Formula preservation

The Brick Wall `calculator(v)` formula was preserved verbatim, including:

- modular face with joint
- leaf multiplier
- wastage
- wet/dry mortar (`1.33`)
- cement bags `1440/50`

Baseline default inputs:

`L=10, H=2.7, openings=3, leaf=1, brick 215×65×102.5, joint=10, waste=5%, mix 1:6`

### Baseline vs refactored results

| Metric | Baseline | Refactored | Match |
|---|---:|---:|:---:|
| Net wall area (m²) | 24 | 24 | ✅ |
| Exact brick count | 1422.2222222222222 | 1422.2222222222222 | ✅ |
| Bricks incl. wastage | 1493.3333333333333 | 1493.3333333333333 | ✅ |
| Wet mortar (m³) | 0.4227555555555558 | 0.4227555555555558 | ✅ |
| Cement (50 kg bags) | 2.3133184000000013 | 2.3133184000000013 | ✅ |
| Sand (m³) | 0.48194133333333367 | 0.48194133333333367 | ✅ |
| Order bricks | 1500 | 1500 | ✅ |
| Order cement | 3 | 3 | ✅ |
| Order sand | 0.5 | 0.5 | ✅ |

Automated QA artifact:

`public/material-calculators/qa/brickWall-reference-qa.json`  
(runner: `qa/run-brickWall-reference-qa.js`)

---

## Migration register (Step 1)

| Calculator | Original baseline result | Refactored result | Calculation match | SVG test | Report test | Print test | Country test | Translation test | Status |
|---|---|---|---|---|---|---|---|---|---|
| Brick Wall (`brickWall`) | See baseline JSON / table above | Identical metrics & order quantities | ✅ Pass | ✅ Live SVG retained (`updateDiagram`) | ✅ Shared `StructuraReport.generate` | ✅ Button → `StructuraReport.print` + shared A4 CSS | ✅ Country service + profile banner | ✅ Language independent of country (`en`/`si`) | **Reference ready — awaiting approval** |
| Remaining 35 calculators | Standalone Stage 1 originals | Not migrated | n/a | n/a | n/a | n/a | n/a | n/a | **Blocked until reference approval** |

### Browser QA (executed 2026-08-07 on local Next.js)

| Check | Result |
|---|---|
| Calculator page loads | ✅ `qaStatus=pass` |
| Metrics match baseline | ✅ All 6 metrics identical |
| Live SVG present + responds to length change | ✅ |
| `StructuraReport.generate` mounts report | ✅ |
| Report SVG is vector clone | ✅ filters stripped |
| Country AU applies brick L=230, language stays EN | ✅ |
| Language SI/EN labels swap independently | ✅ |
| API payload shape via `StructuraApi.buildPayload` | ✅ |
| Temporary nav includes Material Calculators | ✅ `/material-calculators` |

Print dialog itself was exercised via shared `StructuraReport.print` binding (function present; browser automation did not dismiss native print UI).  

---

## Backend calculation protection (Brick Wall)

Brick Wall quantity formulas were moved out of public HTML into server-only code:

- Engine: `lib/material-calculators/engines/brickWall.ts`
- Registry: `lib/material-calculators/registry.ts`
- API: `POST /api/calculations/compute`
- Client: calls API only — **no offline formula fallback**
- Live SVG remains client-side (geometry from inputs only)

Verified baseline (defaults): net area 24, bricks incl. wastage 1493.33…, cement bags 2.313… — match pre-move results.

Set 01 and other calculators still ship formulas in HTML until their server engines are added.

---


Migrated via shared `structura-framework-boot.js` (preserves calculator-specific formulas + SVG):

| Calculator | Calculation match | SVG | Report | Print wiring | Country | Translation | Status |
|---|---|---|---|---|---|---|---|
| Foundation Excavation | ✅ defaults → 18 m³ excav. | ✅ | ✅ | ✅ | ✅ | ✅ | Migrated |
| Random Rubble | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | Migrated |
| Strip Footing | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | Migrated |
| Pad Footing | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | Migrated |
| Ground Beam | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | Migrated |
| Foundation Reinforcement | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | Migrated |

Register: `public/material-calculators/qa/set01-migration-register.json`

Formulas and live SVGs were not rewritten — only application-level shell concerns moved into shared modules.

---

## Planned remaining migration sequence

2. Set 02 — Masonry (remaining; Brick Wall already done)  
3. Set 03 — Reinforced Concrete  
4. Set 04 — Finishes  
5. Set 05 — Roofing  
6. Set 06 — Doors and Windows  

---

## STOP / next gate

Set 01 Foundations is complete. Approve to continue with Set 02 Masonry (remaining calculators).

