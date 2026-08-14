# Structura UK Load Builder — staged AI build prompt

Use this prompt to continue the load platform without losing its engineering assumptions, unit discipline, or downstream data contract.

## Master prompt

You are a senior UK structural engineer, calculation-software product architect, and Next.js/TypeScript engineer. Extend **Structura UK Load Builder** as the single source of truth for characteristic actions used later by beam, bearing, timber, masonry and foundation calculators.

The software is for competent-person preliminary design and must be transparent, inspectable and independently verifiable. Never present a project convention as a value mandated by a British Standard. Keep permanent actions (`Gk`) separate from variable actions (`Qk`) at every stage. A value called “design load” must be factored; `Gk + Qk` must instead be labelled **characteristic total**.

### Standards/version policy

1. Use first-generation `BS EN 1991-1-1:2002` with the 2019 UK National Annex for densities, self-weight and imposed loads unless the project authority or specification explicitly adopts another basis.
2. Display that BSI states first-generation UK Eurocodes remain applicable until **30 March 2028**, unless the relevant authority or project specification says otherwise.
3. Use the UK National Annex to `BS EN 1990` for action combinations. For persistent/transient STR checks expose either Expression 6.10, or the envelope of 6.10a and 6.10b as configured by the project. The current MVP shows:
   - `6.10a = 1.35Gk + 1.5ψ0Qk`
   - `6.10b = 0.925 × 1.35Gk + 1.5Qk`, displayed as `1.25Gk + 1.5Qk` after rounding.
4. Do not generate generic snow or wind values. Route snow to `BS EN 1991-1-3 + UK NA` and wind to `BS EN 1991-1-4 + UK NA`; require location, altitude, geometry and exposure inputs.
5. Treat Category A domestic/residential floor UDL `qk = 1.5 kN/m²` as a code-reference record, not as a permanent load. Concentrated actions remain separate checks.
6. For Category H roofs not accessible except for maintenance, make the plan-area UDL pitch-dependent:
   - `α < 30°: qk = 0.60 kN/m²`
   - `30° ≤ α < 60°: qk = 0.60(60 − α)/30 kN/m²`
   - `α ≥ 60°: qk = 0`
   - also flag the separate concentrated action `Qk = 0.9 kN` for local verification.
7. For movable partitions, expose `0.5`, `0.8`, or `1.2 kN/m²` based on partition line self-weight, and do not silently use `1.0 kN/m²` as a code value.

### Step 1 — create a versioned data model

Create immutable built-in records and device-local custom records. Each record needs:

```ts
type LoadRecord = {
  id: string;
  name: string;
  category: "Roofs" | "Floors" | "Walls" | "Ceilings" | "Openings" | "Imposed loads";
  origin: "Project preset" | "Calculated assembly" | "UK code reference" | "Custom";
  outputBasis: "plan-area" | "wall-face";
  pitchDeg?: number;
  notes: string;
  reference?: string;
  components: LoadComponent[];
  revision?: string;
  sourceVersion?: string;
};

type LoadComponent = {
  id: string;
  label: string;
  action: "Gk" | "Qk";
  method: "direct" | "mass-per-area" | "thickness-density" | "uk-na-roof-imposed";
  directKnM2?: number;
  massKgM2?: number;
  thicknessMm?: number;
  densityKnM3?: number;
  inputBasis?: "plan" | "roof-slope" | "wall-face";
  note?: string;
};
```

Never store only a final total when component information is known. Store the inputs, method, unit, reference and computed result.

### Step 2 — implement the unit-safe calculation engine

Implement and unit-test these rules:

- Mass per area to area action: `w = mass × 9.80665 / 1000` kN/m².
- Material layer: `w = thickness(m) × density(kN/m³)`.
- Sloping roof surface action to horizontal plan action: `w_plan = w_slope / cos(α)`.
- Wall-face self-weight to beam line action: `w_line = w_wall-face × wall height` kN/m.
- Area action to supporting-member line action: `w_line = w_area × tributary width` kN/m.
- Characteristic total: `Gk + Qk`; do not label it ULS.
- Keep full precision internally and round only for display.
- Reject or clearly flag negative values, non-finite values, roof pitch at/above 90° for cosine conversion, and missing unit bases.

### Step 3 — seed the supplied project database

Seed the following values exactly as **Project preset** records. They are editable starting assumptions, not universal code values.

| Location/loading type | Gk kN/m² | Qk kN/m² |
|---|---:|---:|
| Tiled roof | 1.20 | 0.75 |
| Flat roof | 0.80 | 0.75 |
| Timber floor (first floor) | 0.75 | 1.50 |
| Timber floor | 0.75 | 1.50 |
| Ground floor | 1.50 | 1.50 |
| Dormer wall | 1.50 | 0 |
| External cavity wall | 4.60 | 0 |
| Solid brick wall, 230 mm | 5.06 | 0 |
| Single brick wall, 103 mm | 2.26 | 0 |
| Ceiling | 0.25 | 0 |
| Glazed windows | 1.00 | 0 |
| Internal timber stud wall | 0.50 | 0 |
| External timber tiled wall | 1.00 | 0 |
| Single block wall, 140 mm | 2.94 | 0 |
| Beam-and-block floor | 2.00 | 1.50 |
| Solid brick wall, 330 mm | 7.26 | 0 |
| Single block wall, 215 mm | 4.515 | 0 |
| Hempcrete wall, 300 mm | 1.80 | 0 |
| Tiled roof with solar | 1.45 | 0.75 |
| Timber floor with partition walls | 1.75 | 1.50 |

For wall records, set `outputBasis = "wall-face"`. Show these transparent checks where possible, while requiring product verification:

- 230 mm brick: `0.230 × 22 = 5.06 kN/m²`
- 103 mm brick: `0.103 × 22 = 2.266 kN/m²`
- 330 mm brick: `0.330 × 22 = 7.26 kN/m²`
- 140 mm block: `0.140 × 21 = 2.94 kN/m²`
- 215 mm block: `0.215 × 21 = 4.515 kN/m²`
- 300 mm hempcrete: `0.300 × 6 = 1.80 kN/m²`

### Step 4 — reproduce the attached worked examples

Create **Calculated assembly** records that show every row and formula.

#### 45° tiled roof with solar

- Clay tiles: `82.5 × 9.80665 / 1000 / cos(45°) = 1.144 kN/m² plan`
- Solar panels: `25 × 9.80665 / 1000 / cos(45°) = 0.347 kN/m² plan`
- 9.5 mm OSB sarking: approximately `0.17 kN/m² plan`
- Battens and felt: `0.05 kN/m²`
- Trussed rafters: `0.15 kN/m²`
- Ceiling dead load: `0.25 kN/m²`
- The source reports `Gk = 2.12 kN/m²`, while the visible rounded rows and reproducible inputs sum to about `2.11 kN/m²`; flag this 0.01 discrepancy instead of inventing a correction.
- Project roof imposed action: `0.75 kN/m²`
- Ceiling imposed action: `0.25 kN/m²`
- Variable total: `Qk = 1.00 kN/m²`
- The source reports characteristic total `Gk + Qk = 3.12 kN/m²`; the visible/reproducible rows produce about `3.11 kN/m²` because of the same source rounding discrepancy.

The roof imposed action above is a project assumption. Also offer a separate UK Category H code-reference record that changes with pitch.

#### Attic floor

- Underfloor heating: `15 × 9.80665 / 1000 = 0.147 kN/m²`
- 22 mm plywood deck: `0.16 kN/m²`
- Joists: `0.20 kN/m²`
- Two 12.5 mm plasterboard ceiling layers: `0.24 kN/m²`
- Permanent total rounds to `Gk = 0.75 kN/m²`
- Partition allowance: `0.50 kN/m²`
- Domestic floor imposed action: `1.50 kN/m²`
- Variable total: `Qk = 2.00 kN/m²`
- Characteristic total: `2.75 kN/m²`

### Step 5 — build the visual database interface

Create a dedicated `/uk-calculators/load-database` route. Use a server `page.tsx` for metadata and a focused Client Component only for search, filters, local persistence, clipboard and live calculations.

The interface must provide:

1. category and source filters;
2. search by name, material and tag;
3. a left database rail and a large live engineering viewport;
4. clear `Gk` and `Qk` colour coding;
5. an assembly graphic for roofs, floors and walls;
6. pitch control for roof calculations;
7. height control and wall-face-to-line-load conversion for walls;
8. every component formula, value and note;
9. characteristic and ULS results with correct labels;
10. copy-to-clipboard with a complete auditable text trace;
11. duplicate-and-edit, saved to versioned browser storage;
12. deletion only for custom records;
13. a visible source/assumption panel and engineering-use warning;
14. keyboard focus, semantic controls, mobile layout and reduced-motion support.

### Step 6 — define the downstream hand-off

For plan-area records, store this versioned transfer payload and offer “Use in Load takedown”:

```ts
type LoadTransferV1 = {
  name: string;
  gk: number;
  qk: number;
  basis: "plan-area";
  savedAt: string;
};
```

The load-takedown calculator reads this payload, populates its area actions and keeps Gk/Qk separate. Wall-face records must first be converted using wall height and then populate a line-action field; never place wall-face kN/m² directly into a plan-area field.

Future member calculators should receive actions plus provenance, not just totals:

```ts
type MemberActionInput = {
  sourceLoadIds: string[];
  gkLineKnM: number;
  qkLineKnM: number;
  gkPointKn?: number;
  qkPointKn?: number;
  tributaryGeometry: { widthM?: number; heightM?: number; spanM?: number };
  combinationPolicyId: string;
  calculationRevision: string;
};
```

### Step 7 — validation and release gates

Before deployment:

- unit-test all conversion functions and boundary pitches 0°, 30°, 45°, 60° and 89°;
- prove the supplied wall material checks above;
- prove the two attached examples within display rounding;
- verify built-in records cannot be overwritten or deleted;
- verify custom records survive refresh and fail safely on malformed storage;
- verify clipboard output contains basis, components, Gk, Qk, combinations and reference;
- verify a transferred plan-area load populates Load takedown correctly;
- run lint, TypeScript/build, and a production route health check;
- deploy first to a preview URL, verify it, then promote the exact verified deployment to production;
- record deployment URL, commit/branch, standards versions and calculation-engine revision.

Do not market the result as code-compliant design software until the calculation engine, test corpus, licensed datasets and reporting workflow have been independently checked and signed off by a competent UK structural engineer.

## Research sources used for the initial implementation

- BSI, current 2019 UK National Annex to BS EN 1991-1-1 and Eurocode transition note: <https://knowledge.bsigroup.com/products/uk-national-annex-to-eurocode-1-actions-on-structures-general-actions-densities-self-weight-imposed-loads-for-buildings>
- BSI, PD 6688-1-1:2011 complementary UK information: <https://knowledge.bsigroup.com/products/recommendations-for-the-design-of-structures-to-bs-en-1991-1-1>
- UK Government, Approved Document A (Structure): <https://www.gov.uk/government/publications/structure-approved-document-a>
- European Commission JRC, Eurocode 1 overview: <https://eurocodes.jrc.ec.europa.eu/EN-Eurocodes/eurocode-1-actions-structures>
- SteelConstruction.info, UK National Annex load combinations and ψ factors: <https://www.steelconstruction.info/Design_codes_and_standards>
- SCI P399, Category H roof imposed action by pitch: <https://steelconstruction.info/images/4/45/SCI_P399.pdf>
- Example UK public calculation-report pattern used only as evidence of industry presentation, not as standards authority: <https://docs.planning.org.uk/20210329/125/QQ82HYBIFUL00/ybzktxvl09kbxhux.pdf>
