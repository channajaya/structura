import { combineActions } from "./engine";

export const LOAD_TRANSFER_KEY = "structura.uk-load-transfer.v1";
export const CUSTOM_LOADS_KEY = "structura.uk-load-library.v1";

export type LoadCategory =
  | "Roofs"
  | "Floors"
  | "Walls"
  | "Ceilings"
  | "Openings"
  | "Imposed loads";

export type LoadOrigin = "Project preset" | "Calculated assembly" | "UK code reference" | "Custom";
export type LoadAction = "Gk" | "Qk";
export type LoadOutputBasis = "plan-area" | "wall-face";
export type LoadComponentMethod =
  | "direct"
  | "mass-per-area"
  | "thickness-density"
  | "uk-na-roof-imposed";

export type LoadComponent = {
  id: string;
  label: string;
  action: LoadAction;
  method: LoadComponentMethod;
  directKnM2?: number;
  massKgM2?: number;
  thicknessMm?: number;
  densityKnM3?: number;
  inputBasis?: "plan" | "roof-slope" | "wall-face";
  note?: string;
};

export type LoadPreset = {
  id: string;
  name: string;
  category: LoadCategory;
  origin: LoadOrigin;
  outputBasis: LoadOutputBasis;
  pitchDeg?: number;
  notes: string;
  reference?: string;
  components: LoadComponent[];
  tags?: string[];
  custom?: boolean;
};

export type EvaluatedComponent = LoadComponent & {
  valueKnM2: number;
  formula: string;
};

const tidy = (value: number, digits = 3) =>
  Number(value.toFixed(digits)).toString();

const direct = (
  id: string,
  label: string,
  action: LoadAction,
  value: number,
  note?: string,
): LoadComponent => ({
  id,
  label,
  action,
  method: "direct",
  directKnM2: value,
  inputBasis: "plan",
  note,
});

const wallMaterial = (
  id: string,
  label: string,
  thicknessMm: number,
  densityKnM3: number,
  note?: string,
): LoadComponent => ({
  id,
  label,
  action: "Gk",
  method: "thickness-density",
  thicknessMm,
  densityKnM3,
  inputBasis: "wall-face",
  note,
});

function projectPreset(
  id: string,
  name: string,
  category: LoadCategory,
  gk: number,
  qk: number,
  notes: string,
  components?: LoadComponent[],
  outputBasis: LoadOutputBasis = "plan-area",
): LoadPreset {
  return {
    id,
    name,
    category,
    origin: "Project preset",
    outputBasis,
    notes,
    reference: "Client-supplied small-works loading schedule; verify for the project construction and use.",
    components: components ?? [
      direct(`${id}-gk`, "Assumed permanent action", "Gk", gk),
      ...(qk > 0 ? [direct(`${id}-qk`, "Assumed imposed action", "Qk", qk)] : []),
    ],
    tags: ["small works", "client schedule"],
  };
}

export const LOAD_PRESETS: LoadPreset[] = [
  projectPreset("tiled-roof", "Tiled roof", "Roofs", 1.2, 0.75, "Typical project assumption. Roof imposed action is not a universal code value."),
  projectPreset("flat-roof", "Flat roof", "Roofs", 0.8, 0.75, "Typical project assumption; confirm build-up, access category, snow and plant."),
  projectPreset("timber-floor-first", "Timber floor (first floor)", "Floors", 0.75, 1.5, "Domestic floor project preset."),
  projectPreset("timber-floor", "Timber floor", "Floors", 0.75, 1.5, "Domestic floor project preset."),
  projectPreset("ground-floor", "Ground floor", "Floors", 1.5, 1.5, "Construction-specific permanent action with domestic imposed action."),
  projectPreset("dormer-wall", "Dormer wall", "Walls", 1.5, 0, "Surface self-weight per square metre of wall face; multiply by wall height for a line load.", undefined, "wall-face"),
  projectPreset("external-cavity-wall", "External cavity wall", "Walls", 4.6, 0, "Composite wall-face assumption; replace with leaf-by-leaf material densities where known.", undefined, "wall-face"),
  projectPreset("solid-brick-230", "Solid brick wall (230 mm)", "Walls", 5.06, 0, "Wall-face self-weight using an assumed masonry density of 22 kN/m³.", [wallMaterial("solid-brick-230-gk", "230 mm brick masonry", 230, 22, "Confirm masonry unit and mortar density.")], "wall-face"),
  projectPreset("single-brick-103", "Single brick wall (103 mm)", "Walls", 2.26, 0, "Wall-face self-weight using an assumed masonry density of 22 kN/m³.", [wallMaterial("single-brick-103-gk", "103 mm brick masonry", 103, 22, "Calculated result is 2.266 kN/m² before rounding.")], "wall-face"),
  projectPreset("ceiling", "Ceiling", "Ceilings", 0.25, 0, "Ceiling and lightweight support allowance."),
  projectPreset("glazed-windows", "Glazed windows", "Openings", 1, 0, "Surface self-weight per square metre of opening; verify glazing specification.", undefined, "wall-face"),
  projectPreset("timber-stud-internal", "Timber stud wall (internal)", "Walls", 0.5, 0, "Lightweight wall-face self-weight; verify linings and insulation.", undefined, "wall-face"),
  projectPreset("timber-tiled-external", "Timber tiled wall (external)", "Walls", 1, 0, "External timber wall project assumption; verify cladding and sheathing.", undefined, "wall-face"),
  projectPreset("single-block-140", "Single block wall (140 mm)", "Walls", 2.94, 0, "Wall-face self-weight using an assumed blockwork density of 21 kN/m³.", [wallMaterial("single-block-140-gk", "140 mm blockwork", 140, 21, "Confirm block density from the declared product value.")], "wall-face"),
  projectPreset("beam-block-floor", "Bison beam and block floor", "Floors", 2, 1.5, "Project preset only; use the selected manufacturer span table and declared self-weight."),
  projectPreset("solid-brick-330", "Solid brick wall (330 mm)", "Walls", 7.26, 0, "Wall-face self-weight using an assumed masonry density of 22 kN/m³.", [wallMaterial("solid-brick-330-gk", "330 mm brick masonry", 330, 22, "Confirm masonry unit and mortar density.")], "wall-face"),
  projectPreset("single-block-215", "Single block wall (215 mm)", "Walls", 4.515, 0, "Wall-face self-weight using an assumed blockwork density of 21 kN/m³.", [wallMaterial("single-block-215-gk", "215 mm blockwork", 215, 21, "Confirm block density from the declared product value.")], "wall-face"),
  projectPreset("hempcrete-300", "Hempcrete wall (300 mm)", "Walls", 1.8, 0, "Wall-face self-weight using an assumed density of 6 kN/m³.", [wallMaterial("hempcrete-300-gk", "300 mm hempcrete", 300, 6, "Product density can vary materially; use supplier data.")], "wall-face"),
  projectPreset("tiled-roof-solar", "Tiled roof with solar", "Roofs", 1.45, 0.75, "Typical project assumption; pitch conversion and panel system should be checked."),
  projectPreset("timber-floor-partitions", "Timber floor with partition walls", "Floors", 1.75, 1.5, "Client schedule preset. Confirm whether the partition allowance belongs in Gk or Qk for the chosen design model."),
  {
    id: "example-roof-45-solar",
    name: "Attached example — 45° tiled roof + solar",
    category: "Roofs",
    origin: "Calculated assembly",
    outputBasis: "plan-area",
    pitchDeg: 45,
    notes: "Recreated from the attached loading sheet. Sloping layers are converted to horizontal plan area. The visible rounded rows sum to about 3.11 kN/m² while the source reports 3.12 kN/m², indicating hidden precision or a 0.01 rounding discrepancy. Both are characteristic, not factored ULS actions.",
    reference: "Client-attached assumed-load calculation sheet.",
    components: [
      { id: "roof-tiles", label: "Clay roof tiles", action: "Gk", method: "mass-per-area", massKgM2: 82.5, inputBasis: "roof-slope", note: "82.5 kg/m² on slope." },
      { id: "roof-solar", label: "Solar panels", action: "Gk", method: "mass-per-area", massKgM2: 25, inputBasis: "roof-slope", note: "25 kg/m² on slope." },
      { id: "roof-osb", label: "9.5 mm OSB roof sarking", action: "Gk", method: "direct", directKnM2: 0.12, inputBasis: "roof-slope", note: "Back-calculated sloping-surface action to reproduce 0.17 kN/m² on plan." },
      direct("roof-battens", "Battens and felt", "Gk", 0.05),
      direct("roof-rafters", "Trussed rafters", "Gk", 0.15),
      direct("roof-ceiling-gk", "Ceiling dead load", "Gk", 0.25),
      direct("roof-imposed", "Roof imposed load (project assumption)", "Qk", 0.75, "Do not treat as a universal Category H value."),
      direct("roof-ceiling-qk", "Ceiling imposed load", "Qk", 0.25),
    ],
    tags: ["worked example", "pitched roof", "solar"],
  },
  {
    id: "example-attic-floor",
    name: "Attached example — attic floor",
    category: "Floors",
    origin: "Calculated assembly",
    outputBasis: "plan-area",
    notes: "Recreated from the attached loading sheet. Component values reproduce Gk ≈ 0.75 and Qk = 2.00 kN/m².",
    reference: "Client-attached assumed-load calculation sheet.",
    components: [
      { id: "attic-ufh", label: "Underfloor heating", action: "Gk", method: "mass-per-area", massKgM2: 15, inputBasis: "plan", note: "15 kg/m²." },
      direct("attic-plywood", "22 mm plywood floor deck", "Gk", 0.16),
      direct("attic-joists", "Timber joists", "Gk", 0.2),
      direct("attic-ceiling", "2 × 12.5 mm plasterboard ceiling", "Gk", 0.24),
      direct("attic-partitions", "Movable partition allowance", "Qk", 0.5, "The UK NA uses 0.5, 0.8 or 1.2 kN/m² depending on partition self-weight."),
      direct("attic-imposed", "Domestic floor imposed action", "Qk", 1.5),
    ],
    tags: ["worked example", "attic", "domestic"],
  },
  {
    id: "uk-na-category-a-domestic",
    name: "Category A domestic floor imposed action",
    category: "Imposed loads",
    origin: "UK code reference",
    outputBasis: "plan-area",
    notes: "Characteristic uniformly distributed imposed action for self-contained dwelling areas. Check concentrated actions and the exact occupancy subcategory separately.",
    reference: "NA to BS EN 1991-1-1:2002 (2019), Tables NA.2/NA.3; first-generation UK Eurocodes remain applicable until 30 March 2028 unless the project authority or specification states otherwise.",
    components: [direct("category-a-qk", "Category A domestic/residential UDL", "Qk", 1.5)],
    tags: ["EN 1991-1-1", "UK NA", "domestic"],
  },
  {
    id: "uk-na-category-h-roof",
    name: "Category H roof imposed action",
    category: "Imposed loads",
    origin: "UK code reference",
    outputBasis: "plan-area",
    pitchDeg: 30,
    notes: "For roofs not accessible except for normal maintenance and repair. The UDL changes with slope; local verification also requires the separate concentrated action Qk = 0.9 kN.",
    reference: "NA to BS EN 1991-1-1:2002 (2019), Category H/Table NA.7 as reproduced by SCI P399.",
    components: [{ id: "category-h-qk", label: "Category H roof UDL", action: "Qk", method: "uk-na-roof-imposed", inputBasis: "plan", note: "0.6 kN/m² below 30°; linearly reduces to zero from 30° to 60°." }],
    tags: ["EN 1991-1-1", "UK NA", "roof", "maintenance"],
  },
];

export function evaluateComponent(
  component: LoadComponent,
  pitchDeg = 0,
  outputBasis: LoadOutputBasis = "plan-area",
): EvaluatedComponent {
  let rawValue = 0;
  let formula = "";

  if (component.method === "direct") {
    rawValue = Math.max(0, component.directKnM2 ?? 0);
    formula = `${tidy(rawValue)} kN/m²`;
  } else if (component.method === "mass-per-area") {
    const mass = Math.max(0, component.massKgM2 ?? 0);
    rawValue = mass * 9.80665 / 1000;
    formula = `${tidy(mass)} × 9.80665 ÷ 1000`;
  } else if (component.method === "thickness-density") {
    const thickness = Math.max(0, component.thicknessMm ?? 0);
    const density = Math.max(0, component.densityKnM3 ?? 0);
    rawValue = thickness / 1000 * density;
    formula = `(${tidy(thickness)} ÷ 1000) × ${tidy(density)}`;
  } else {
    const pitch = Math.max(0, Math.min(90, pitchDeg));
    rawValue = pitch < 30 ? 0.6 : pitch < 60 ? 0.6 * (60 - pitch) / 30 : 0;
    formula = pitch < 30
      ? "0.60 (pitch < 30°)"
      : pitch < 60
        ? `0.60 × (60 − ${tidy(pitch, 1)}) ÷ 30`
        : "0.00 (pitch ≥ 60°)";
  }

  const needsPlanConversion =
    component.inputBasis === "roof-slope" && outputBasis === "plan-area";
  if (needsPlanConversion) {
    const safePitch = Math.max(0, Math.min(89, pitchDeg));
    const cosine = Math.cos(safePitch * Math.PI / 180);
    rawValue /= Math.max(cosine, 0.01);
    formula = `(${formula}) ÷ cos(${tidy(safePitch, 1)}°)`;
  }

  return { ...component, valueKnM2: rawValue, formula };
}

export function evaluatePreset(preset: LoadPreset, pitchOverride?: number) {
  const pitchDeg = pitchOverride ?? preset.pitchDeg ?? 0;
  const components = preset.components.map((component) =>
    evaluateComponent(component, pitchDeg, preset.outputBasis));
  const gk = components
    .filter((component) => component.action === "Gk")
    .reduce((total, component) => total + component.valueKnM2, 0);
  const qk = components
    .filter((component) => component.action === "Qk")
    .reduce((total, component) => total + component.valueKnM2, 0);
  return {
    pitchDeg,
    components,
    gk,
    qk,
    characteristic: gk + qk,
    combinations: combineActions(gk, qk, preset.category === "Roofs" ? 0.7 : 0.7),
  };
}

export function createCustomPreset(
  id: string,
  name: string,
  category: LoadCategory,
  gk: number,
  qk: number,
  notes: string,
  outputBasis: LoadOutputBasis = "plan-area",
): LoadPreset {
  return {
    id,
    name,
    category,
    origin: "Custom",
    outputBasis,
    notes,
    reference: "Device-local user copy. Review and independently verify before design use.",
    components: [
      direct(`${id}-gk`, "Custom permanent action", "Gk", Math.max(0, gk)),
      direct(`${id}-qk`, "Custom imposed action", "Qk", Math.max(0, qk)),
    ],
    tags: ["custom"],
    custom: true,
  };
}
