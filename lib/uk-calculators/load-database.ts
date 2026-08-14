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

export type LoadOrigin = "Calculated assembly" | "UK code reference" | "Custom";
export type LoadAction = "Gk" | "Qk";
export type LoadOutputBasis = "plan-area" | "wall-face";
export type LoadComponentMethod =
  | "direct"
  | "mass-per-area"
  | "thickness-density"
  | "uk-na-roof-imposed";
export type LoadVisualKind =
  | "tile"
  | "carpet"
  | "timber"
  | "board"
  | "gypsum"
  | "concrete"
  | "masonry"
  | "insulation"
  | "membrane"
  | "metal"
  | "glass"
  | "soil"
  | "load";

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
  visualKind?: LoadVisualKind;
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
  ukNaImposedCode?: string;
  concentratedKn?: number;
  storageHeightM?: number;
  roomQkKnM2?: number;
  roofPitchDeg?: number;
};

export type EvaluatedComponent = LoadComponent & {
  valueKnM2: number;
  formula: string;
};

type ComponentSeed = Omit<LoadComponent, "id"> & { key: string };

const UK_NA_DOMESTIC =
  "NA to BS EN 1991-1-1:2002 (2019), Category A. Verify the exact occupancy subcategory, concentrated action and project authority requirements.";
const UK_NA_ROOF =
  "NA to BS EN 1991-1-1:2002 (2019), Category H/Table NA.7 as reproduced by SCI P399. The separate 0.9 kN concentrated action is not added to the UDL.";
const TYPICAL_MATERIALS =
  "Calculated from nominal thickness and typical density, or a stated manufacturer mass. Replace with the selected product declaration and as-built thickness before design issue.";

const tidy = (value: number, digits = 3) => Number(value.toFixed(digits)).toString();

const d = (
  key: string,
  label: string,
  value: number,
  action: LoadAction = "Gk",
  visualKind: LoadVisualKind = action === "Qk" ? "load" : "board",
  note?: string,
  inputBasis: ComponentSeed["inputBasis"] = "plan",
): ComponentSeed => ({
  key,
  label,
  action,
  method: "direct",
  directKnM2: value,
  inputBasis,
  note,
  visualKind,
});

const m = (
  key: string,
  label: string,
  massKgM2: number,
  visualKind: LoadVisualKind,
  note?: string,
  inputBasis: ComponentSeed["inputBasis"] = "plan",
): ComponentSeed => ({
  key,
  label,
  action: "Gk",
  method: "mass-per-area",
  massKgM2,
  inputBasis,
  note,
  visualKind,
});

const t = (
  key: string,
  label: string,
  thicknessMm: number,
  densityKnM3: number,
  visualKind: LoadVisualKind,
  note?: string,
  inputBasis: ComponentSeed["inputBasis"] = "plan",
): ComponentSeed => ({
  key,
  label,
  action: "Gk",
  method: "thickness-density",
  thicknessMm,
  densityKnM3,
  inputBasis,
  note,
  visualKind,
});

const domesticQ = (): ComponentSeed =>
  d("uk-na-category-a", "UK NA Category A - domestic/residential floor", 1.5, "Qk", "load", "Uniformly distributed imposed action; check the separate concentrated action.");

const roofQ = (): ComponentSeed => ({
  key: "uk-na-category-h",
  label: "UK NA Category H - maintenance roof UDL",
  action: "Qk",
  method: "uk-na-roof-imposed",
  inputBasis: "plan",
  note: "0.60 kN/m2 below 30 degrees; linearly reduces to zero from 30 to 60 degrees.",
  visualKind: "load",
});

function assembly(
  id: string,
  name: string,
  category: LoadCategory,
  parts: ComponentSeed[],
  notes: string,
  options: {
    outputBasis?: LoadOutputBasis;
    pitchDeg?: number;
    reference?: string;
    tags?: string[];
    origin?: LoadOrigin;
  } = {},
): LoadPreset {
  return {
    id,
    name,
    category,
    origin: options.origin ?? "Calculated assembly",
    outputBasis: options.outputBasis ?? "plan-area",
    pitchDeg: options.pitchDeg,
    notes,
    reference: options.reference ?? TYPICAL_MATERIALS,
    tags: options.tags,
    components: parts.map(({ key, ...part }) => ({ ...part, id: `${id}-${key}` })),
  };
}

const floorFinish = {
  carpet: [m("carpet", "Carpet and underlay", 8, "carpet", "Typical combined mass; verify selected products.")],
  laminate: [t("laminate", "8 mm laminate flooring", 8, 9, "timber"), m("underlay", "Foam underlay", 1, "insulation")],
  vinyl: [m("vinyl", "Sheet vinyl and adhesive", 5, "membrane")],
  engineered: [t("engineered-board", "15 mm engineered timber flooring", 15, 7, "timber")],
  timber: [t("timber-board", "20 mm solid timber floorboards", 20, 5, "timber")],
  ceramic: [t("ceramic-tile", "10 mm ceramic floor tile", 10, 22, "tile"), m("adhesive", "Flexible tile adhesive", 4, "board")],
  porcelainUfh: [t("porcelain-tile", "12 mm porcelain floor tile", 12, 23, "tile"), m("adhesive", "Flexible tile adhesive", 4, "board"), m("electric-ufh", "Electric UFH mat and levelling compound", 12, "metal", "Typical assembly allowance; verify heating supplier and compound coverage."), m("backer", "Tile backer board", 12, "board")],
  stone: [t("stone", "20 mm natural stone floor finish", 20, 27, "tile"), m("adhesive", "Stone adhesive bed", 6, "board")],
  dryScreedCarpet: [m("carpet", "Carpet and underlay", 8, "carpet"), m("dry-screed", "Dry screed floor panels", 24, "board")],
  wetUfhTile: [t("ceramic-tile", "10 mm ceramic floor tile", 10, 22, "tile"), m("adhesive", "Flexible tile adhesive", 4, "board"), t("screed", "65 mm sand-cement screed with wet UFH", 65, 20, "concrete", "Domestic floating screed thickness; verify system specification."), d("ufh-pipes", "UFH pipework and water allowance", 0.03, "Gk", "metal")],
} satisfies Record<string, ComponentSeed[]>;

const timberFloorBase = [
  t("deck", "22 mm structural chipboard deck", 22, 7, "board", "Nominal density assumption; confirm declared board mass."),
  d("joists", "Timber joists and restraint allowance", 0.2, "Gk", "timber"),
  m("ceiling", "12.5 mm plasterboard ceiling", 7.7, "gypsum", "British Gypsum WallBoard minimum published mass."),
];
const timberFloorSpecs = [
  ["carpet", "Carpet", floorFinish.carpet],
  ["laminate", "Laminate", floorFinish.laminate],
  ["vinyl", "Vinyl", floorFinish.vinyl],
  ["engineered-timber", "Engineered Timber", floorFinish.engineered],
  ["solid-timber", "Solid Timber Boards", floorFinish.timber],
  ["ceramic-tile", "Ceramic Tile", floorFinish.ceramic],
  ["porcelain-electric-ufh", "Porcelain Tile + Electric UFH", floorFinish.porcelainUfh],
  ["natural-stone", "Natural Stone", floorFinish.stone],
  ["dry-screed-carpet", "Dry Screed + Carpet", floorFinish.dryScreedCarpet],
  ["wet-ufh-tile", "Wet UFH Screed + Ceramic Tile", floorFinish.wetUfhTile],
] as const;

const beamBlockFinishSpecs = [
  ["screed-carpet", "Screed + Carpet", [...floorFinish.carpet, t("screed", "65 mm sand-cement screed", 65, 20, "concrete")]],
  ["screed-vinyl", "Screed + Vinyl", [...floorFinish.vinyl, t("screed", "65 mm sand-cement screed", 65, 20, "concrete")]],
  ["ceramic-tile", "Ceramic Tile", [...floorFinish.ceramic, t("screed", "65 mm sand-cement screed", 65, 20, "concrete")]],
  ["engineered-timber", "Engineered Timber", [...floorFinish.engineered, t("screed", "65 mm sand-cement screed", 65, 20, "concrete")]],
  ["natural-stone", "Natural Stone", [...floorFinish.stone, t("screed", "65 mm sand-cement screed", 65, 20, "concrete")]],
  ["wet-ufh-tile", "Wet UFH Screed + Ceramic Tile", floorFinish.wetUfhTile],
] as const;

const rcFinishSpecs = [
  ["carpet", "Carpet", floorFinish.carpet],
  ["vinyl", "Vinyl", floorFinish.vinyl],
  ["ceramic-tile", "Ceramic Tile", floorFinish.ceramic],
  ["engineered-timber", "Engineered Timber", floorFinish.engineered],
  ["raised-access", "Raised Access Floor", [m("access-panels", "Raised access panels and pedestals", 45, "metal")]],
  ["wet-ufh-tile", "Wet UFH Screed + Ceramic Tile", floorFinish.wetUfhTile],
] as const;

const cltFinishSpecs = [
  ["carpet", "Carpet", floorFinish.carpet],
  ["engineered-timber", "Engineered Timber", floorFinish.engineered],
  ["dry-screed-tile", "Dry Screed + Ceramic Tile", [...floorFinish.ceramic, m("dry-screed", "Dry screed floor panels", 24, "board")]],
  ["acoustic-screed", "Acoustic Screed + Carpet", [...floorFinish.carpet, t("screed", "50 mm sand-cement screed", 50, 20, "concrete"), m("acoustic-mat", "Acoustic resilient layer", 3, "insulation")]],
] as const;

const groundFinishSpecs = [
  ["screed-carpet", "Insulated Slab + Screed + Carpet", [...floorFinish.carpet, t("screed", "65 mm sand-cement screed", 65, 20, "concrete")]],
  ["screed-vinyl", "Insulated Slab + Screed + Vinyl", [...floorFinish.vinyl, t("screed", "65 mm sand-cement screed", 65, 20, "concrete")]],
  ["ceramic-tile", "Insulated Slab + Ceramic Tile", floorFinish.ceramic],
  ["wet-ufh-tile", "Insulated Slab + Wet UFH + Ceramic Tile", floorFinish.wetUfhTile],
] as const;

const FLOOR_PRESETS: LoadPreset[] = [
  ...timberFloorSpecs.map(([id, finish, parts]) => assembly(
    `floor-timber-${id}`,
    `Floor - Timber Joists - ${finish}`,
    "Floors",
    [...parts, ...timberFloorBase, domesticQ()],
    "Suspended timber domestic floor; layers are listed from finish to ceiling.",
    { reference: `${TYPICAL_MATERIALS} ${UK_NA_DOMESTIC}`, tags: ["timber floor", finish.toLowerCase(), "domestic"] },
  )),
  ...beamBlockFinishSpecs.map(([id, finish, parts]) => assembly(
    `floor-beam-block-${id}`,
    `Floor - Beam and Block - ${finish}`,
    "Floors",
    [...parts, d("beam-block", "150 mm beam-and-block floor incl. grout", 2.4, "Gk", "concrete", "Representative Litecast configuration within its published range; select by span and beam centres."), domesticQ()],
    "Precast beam-and-block domestic floor; select the actual manufacturer configuration.",
    { reference: `Litecast 150 mm published self-weight range is approximately 2.17-2.97 kN/m2 including grout. ${UK_NA_DOMESTIC}`, tags: ["beam block", finish.toLowerCase(), "domestic"] },
  )),
  ...rcFinishSpecs.map(([id, finish, parts]) => assembly(
    `floor-rc-${id}`,
    `Floor - 150 mm RC Slab - ${finish}`,
    "Floors",
    [...parts, t("rc-slab", "150 mm reinforced concrete slab", 150, 25, "concrete"), domesticQ()],
    "In-situ normal-weight reinforced concrete domestic floor.",
    { reference: `${TYPICAL_MATERIALS} ${UK_NA_DOMESTIC}`, tags: ["concrete floor", finish.toLowerCase(), "domestic"] },
  )),
  ...cltFinishSpecs.map(([id, finish, parts]) => assembly(
    `floor-clt-${id}`,
    `Floor - 120 mm CLT - ${finish}`,
    "Floors",
    [...parts, t("clt", "120 mm cross-laminated timber panel", 120, 5, "timber", "Typical 500 kg/m3 density; confirm supplier layup."), domesticQ()],
    "Cross-laminated timber domestic floor; connections and vibration are outside this load preset.",
    { reference: `${TYPICAL_MATERIALS} ${UK_NA_DOMESTIC}`, tags: ["CLT", finish.toLowerCase(), "domestic"] },
  )),
  ...groundFinishSpecs.map(([id, finish, parts]) => assembly(
    `floor-ground-${id}`,
    `Floor - Ground-Bearing Slab - ${finish}`,
    "Floors",
    [...parts, t("rc-slab", "100 mm concrete ground-bearing slab", 100, 24, "concrete"), m("dpm", "DPM and insulation allowance", 3, "membrane"), domesticQ()],
    "Ground-bearing domestic floor. Do not apply slab self-weight to suspended members unless the load path requires it.",
    { reference: `${TYPICAL_MATERIALS} ${UK_NA_DOMESTIC}`, tags: ["ground floor", finish.toLowerCase(), "domestic"] },
  )),
];

type RoofCover = readonly [string, string, number, LoadVisualKind, string?, boolean?];
const pitchedCovers: RoofCover[] = [
  ["concrete-plain", "Concrete Plain Tile", 73.8, "tile", "Marley published tile weight."],
  ["concrete-interlocking", "Concrete Interlocking Tile", 47, "tile", "Marley Anglia published tile weight."],
  ["clay-handmade", "Handmade Clay Plain Tile", 74, "tile", "Marley Canterbury published tile weight."],
  ["clay-pantile", "Clay Pantile", 46.2, "tile", "Marley Lincoln published tile weight."],
  ["natural-slate", "Natural Slate", 35, "tile", "Typical allowance; verify slate size, headlap and fixing."],
  ["fibre-cement-slate", "Fibre-Cement Slate", 20, "tile", "Typical allowance; verify declared product mass."],
  ["standing-seam", "Standing-Seam Metal", 12, "metal", "Roof sheet and clips allowance; verify system."],
  ["profiled-steel", "Profiled Steel Sheet", 8, "metal", "Typical profiled sheet allowance; verify gauge and liner."],
  ["cedar-shingle", "Cedar Shingles", 12, "timber", "Typical installed covering mass; verify moisture condition."],
  ["concrete-interlocking-pv", "Concrete Interlocking Tile + PV", 47, "tile", "Marley Anglia published tile weight.", true],
  ["clay-pantile-pv", "Clay Pantile + PV", 46.2, "tile", "Marley Lincoln published tile weight.", true],
  ["natural-slate-pv", "Natural Slate + PV", 35, "tile", "Typical slate allowance; verify size and headlap.", true],
];

const PITCHED_ROOFS = pitchedCovers.map(([id, name, mass, visual, note, hasPv]) => assembly(
  `roof-pitched-${id}`,
  `Roof - Pitched Timber - ${name}`,
  "Roofs",
  [
    m("covering", name, mass, visual, note, "roof-slope"),
    ...(hasPv ? [m("pv", "PV modules and mounting rails", 15, "metal", "Typical system mass; verify module and mounting supplier.", "roof-slope")] : []),
    d("battens", "Battens and counter-battens", 0.08, "Gk", "timber", undefined, "roof-slope"),
    m("underlay", "Roof underlay", 1, "membrane", undefined, "roof-slope"),
    d("rafters", "Timber rafters/trusses allowance", 0.18, "Gk", "timber"),
    d("insulation", "Insulation allowance", 0.04, "Gk", "insulation"),
    m("ceiling", "12.5 mm plasterboard ceiling", 7.7, "gypsum"),
    roofQ(),
  ],
  "Insulated pitched timber roof. Sloping layers are converted to horizontal plan area.",
  { pitchDeg: 35, reference: `${TYPICAL_MATERIALS} ${UK_NA_ROOF}`, tags: ["pitched roof", name.toLowerCase()] },
));

const flatRoofSpecs = [
  ["warm-single-ply", "Warm Roof - Single-Ply Membrane", [m("membrane", "Single-ply membrane", 2, "membrane"), m("insulation", "Rigid insulation and adhesive", 8, "insulation"), t("deck", "18 mm OSB deck", 18, 7, "board"), d("joists", "Timber joists allowance", 0.2, "Gk", "timber"), m("ceiling", "12.5 mm plasterboard ceiling", 7.7, "gypsum")]],
  ["warm-bituminous", "Warm Roof - Bituminous Membrane", [m("membrane", "Multi-layer bituminous membrane", 8, "membrane"), m("insulation", "Rigid insulation and adhesive", 8, "insulation"), t("deck", "18 mm plywood deck", 18, 7, "board"), d("joists", "Timber joists allowance", 0.2, "Gk", "timber"), m("ceiling", "12.5 mm plasterboard ceiling", 7.7, "gypsum")]],
  ["warm-grp", "Warm Roof - GRP Finish", [m("grp", "GRP roof finish", 5, "membrane"), m("insulation", "Rigid insulation", 8, "insulation"), t("deck", "18 mm OSB deck", 18, 7, "board"), d("joists", "Timber joists allowance", 0.2, "Gk", "timber"), m("ceiling", "12.5 mm plasterboard ceiling", 7.7, "gypsum")]],
  ["cold-bituminous", "Cold Roof - Bituminous Membrane", [m("membrane", "Multi-layer bituminous membrane", 8, "membrane"), t("deck", "18 mm plywood deck", 18, 7, "board"), d("joists", "Timber joists and insulation allowance", 0.23, "Gk", "timber"), m("ceiling", "12.5 mm plasterboard ceiling", 7.7, "gypsum")]],
  ["inverted-ballast", "Inverted RC Roof - Gravel Ballast", [t("ballast", "50 mm washed gravel ballast", 50, 18, "masonry"), m("insulation", "Inverted roof insulation", 8, "insulation"), m("membrane", "Waterproof membrane", 5, "membrane"), t("rc-slab", "150 mm reinforced concrete slab", 150, 25, "concrete")]],
  ["green-sedum", "Warm Roof - Extensive Green Roof", [d("vegetation", "Vegetation and saturated substrate", 0.9, "Gk", "soil", "Saturated system allowance; obtain supplier declared maximum."), m("drainage", "Drainage and filter layers", 12, "membrane"), m("insulation", "Rigid insulation", 8, "insulation"), m("membrane", "Root-resistant membrane", 5, "membrane"), t("deck", "18 mm OSB deck", 18, 7, "board"), d("joists", "Timber joists allowance", 0.2, "Gk", "timber")]],
  ["terrace-pavers", "Inverted RC Roof - Terrace Pavers", [t("pavers", "50 mm concrete paving slabs", 50, 24, "tile"), d("pedestals", "Paving pedestals allowance", 0.1, "Gk", "metal"), m("insulation", "Inverted roof insulation", 8, "insulation"), m("membrane", "Waterproof membrane", 5, "membrane"), t("rc-slab", "150 mm reinforced concrete slab", 150, 25, "concrete")]],
  ["warm-pv", "Warm Roof - Single-Ply + PV", [m("pv", "PV modules and mounting rails", 15, "metal"), m("membrane", "Single-ply membrane", 2, "membrane"), m("insulation", "Rigid insulation", 8, "insulation"), t("deck", "18 mm OSB deck", 18, 7, "board"), d("joists", "Timber joists allowance", 0.2, "Gk", "timber"), m("ceiling", "12.5 mm plasterboard ceiling", 7.7, "gypsum")]],
] as const;

const FLAT_ROOFS = flatRoofSpecs.map(([id, name, parts]) => assembly(
  `roof-flat-${id}`,
  `Roof - Flat - ${name}`,
  "Roofs",
  [...parts, roofQ()],
  "Flat-roof build-up for normal maintenance access only; snow, ponding, plant and access loads are separate.",
  { pitchDeg: 0, reference: `${TYPICAL_MATERIALS} ${UK_NA_ROOF}`, tags: ["flat roof", name.toLowerCase()] },
));

const liningInternal = [t("plaster", "13 mm internal gypsum plaster", 13, 16, "gypsum")];
const cavityWallSpecs = [
  ["brick-aac100", "Facing Brick + 100 mm AAC Block", [t("outer-brick", "102.5 mm facing brick outer leaf", 102.5, 20, "masonry"), m("ties-insulation", "Wall ties and partial-fill insulation", 5, "insulation"), t("inner-block", "100 mm AAC block inner leaf", 100, 6, "masonry"), ...liningInternal]],
  ["brick-aac140", "Facing Brick + 140 mm AAC Block", [t("outer-brick", "102.5 mm facing brick outer leaf", 102.5, 20, "masonry"), m("ties-insulation", "Wall ties and partial-fill insulation", 5, "insulation"), t("inner-block", "140 mm AAC block inner leaf", 140, 6, "masonry"), ...liningInternal]],
  ["brick-light100", "Facing Brick + 100 mm Lightweight Block", [t("outer-brick", "102.5 mm facing brick outer leaf", 102.5, 20, "masonry"), m("ties-insulation", "Wall ties and insulation", 5, "insulation"), t("inner-block", "100 mm lightweight aggregate block", 100, 14, "masonry"), ...liningInternal]],
  ["brick-light140", "Facing Brick + 140 mm Lightweight Block", [t("outer-brick", "102.5 mm facing brick outer leaf", 102.5, 20, "masonry"), m("ties-insulation", "Wall ties and insulation", 5, "insulation"), t("inner-block", "140 mm lightweight aggregate block", 140, 14, "masonry"), ...liningInternal]],
  ["brick-dense100", "Facing Brick + 100 mm Dense Block", [t("outer-brick", "102.5 mm facing brick outer leaf", 102.5, 20, "masonry"), m("ties-insulation", "Wall ties and insulation", 5, "insulation"), t("inner-block", "100 mm dense concrete block", 100, 21, "concrete"), ...liningInternal]],
  ["brick-dense140", "Facing Brick + 140 mm Dense Block", [t("outer-brick", "102.5 mm facing brick outer leaf", 102.5, 20, "masonry"), m("ties-insulation", "Wall ties and insulation", 5, "insulation"), t("inner-block", "140 mm dense concrete block", 140, 21, "concrete"), ...liningInternal]],
  ["render-block-aac100", "Rendered Block + 100 mm AAC Block", [t("render", "15 mm external render", 15, 18, "masonry"), t("outer-block", "100 mm lightweight block outer leaf", 100, 14, "masonry"), m("ties-insulation", "Wall ties and insulation", 5, "insulation"), t("inner-block", "100 mm AAC block inner leaf", 100, 6, "masonry"), ...liningInternal]],
  ["stone-aac100", "Natural Stone + 100 mm AAC Block", [t("outer-stone", "100 mm natural stone outer leaf", 100, 25, "masonry"), m("ties-insulation", "Wall ties and insulation", 5, "insulation"), t("inner-block", "100 mm AAC block inner leaf", 100, 6, "masonry"), ...liningInternal]],
  ["brick-timber", "Facing Brick + Timber Stud Inner Leaf", [t("outer-brick", "102.5 mm facing brick outer leaf", 102.5, 20, "masonry"), m("ties-cavity", "Wall ties, breather layer and cavity insulation", 6, "insulation"), d("stud", "140 mm timber stud frame allowance", 0.18, "Gk", "timber"), t("sheathing", "11 mm OSB sheathing", 11, 7, "board"), m("lining", "12.5 mm plasterboard lining", 7.7, "gypsum")]],
  ["brick-aac-service", "Facing Brick + AAC Block + Service Lining", [t("outer-brick", "102.5 mm facing brick outer leaf", 102.5, 20, "masonry"), m("ties-insulation", "Wall ties and insulation", 5, "insulation"), t("inner-block", "100 mm AAC block inner leaf", 100, 6, "masonry"), d("service-battens", "Timber service battens", 0.06, "Gk", "timber"), m("lining", "12.5 mm plasterboard lining", 7.7, "gypsum")]],
  ["brick-light-insulated-lining", "Facing Brick + Lightweight Block + Insulated Lining", [t("outer-brick", "102.5 mm facing brick outer leaf", 102.5, 20, "masonry"), m("ties-insulation", "Wall ties and cavity insulation", 5, "insulation"), t("inner-block", "100 mm lightweight aggregate block", 100, 14, "masonry"), m("lining", "Insulated plasterboard lining", 12, "gypsum")]],
  ["brick-block215", "Facing Brick + 215 mm Dense Block", [t("outer-brick", "102.5 mm facing brick outer leaf", 102.5, 20, "masonry"), m("ties-insulation", "Wall ties and insulation", 5, "insulation"), t("inner-block", "215 mm dense concrete block", 215, 21, "concrete"), ...liningInternal]],
] as const;

const solidWallSpecs = [
  ["brick103", "103 mm Brick + Internal Plaster", [t("brick", "103 mm brick masonry", 103, 22, "masonry"), ...liningInternal]],
  ["brick215", "215 mm Solid Brick + Internal Plaster", [t("brick", "215 mm brick masonry", 215, 22, "masonry"), ...liningInternal]],
  ["brick230", "230 mm Solid Brick + Internal Plaster", [t("brick", "230 mm brick masonry", 230, 22, "masonry"), ...liningInternal]],
  ["brick330", "330 mm Solid Brick + Internal Plaster", [t("brick", "330 mm brick masonry", 330, 22, "masonry"), ...liningInternal]],
  ["aac100-render", "100 mm AAC Block + Render + Plaster", [t("render", "15 mm external render", 15, 18, "masonry"), t("block", "100 mm AAC blockwork", 100, 6, "masonry"), ...liningInternal]],
  ["light140-render", "140 mm Lightweight Block + Render + Plaster", [t("render", "15 mm external render", 15, 18, "masonry"), t("block", "140 mm lightweight aggregate block", 140, 14, "masonry"), ...liningInternal]],
  ["dense215-render", "215 mm Dense Block + Render + Plaster", [t("render", "15 mm external render", 15, 18, "masonry"), t("block", "215 mm dense concrete block", 215, 21, "concrete"), ...liningInternal]],
  ["hempcrete300", "300 mm Hempcrete + Lime Render", [t("external-render", "20 mm external lime render", 20, 17, "masonry"), t("hempcrete", "300 mm hempcrete", 300, 6, "insulation", "Density varies materially by product; use supplier data."), t("internal-plaster", "15 mm internal lime plaster", 15, 17, "masonry")]],
] as const;

const partitionSpecs = [
  ["stud70-single", "70 mm Timber Stud - Single Plasterboard Each Side", [m("board-a", "12.5 mm plasterboard - side A", 7.7, "gypsum"), d("stud", "70 mm timber studs and insulation", 0.12, "Gk", "timber"), m("board-b", "12.5 mm plasterboard - side B", 7.7, "gypsum")]],
  ["stud70-double", "70 mm Timber Stud - Double Plasterboard Each Side", [m("boards-a", "2 x 12.5 mm plasterboard - side A", 15.4, "gypsum"), d("stud", "70 mm timber studs and insulation", 0.12, "Gk", "timber"), m("boards-b", "2 x 12.5 mm plasterboard - side B", 15.4, "gypsum")]],
  ["stud92-acoustic", "92 mm Metal Stud - Acoustic Double Lining", [m("boards-a", "2 x 15 mm acoustic board - side A", 24, "gypsum"), d("stud", "92 mm metal studs and mineral wool", 0.1, "Gk", "metal"), m("boards-b", "2 x 15 mm acoustic board - side B", 24, "gypsum")]],
  ["aac100", "100 mm AAC Block + Plaster Both Sides", [t("plaster-a", "13 mm gypsum plaster - side A", 13, 16, "gypsum"), t("block", "100 mm AAC blockwork", 100, 6, "masonry"), t("plaster-b", "13 mm gypsum plaster - side B", 13, 16, "gypsum")]],
  ["light100", "100 mm Lightweight Block + Plaster Both Sides", [t("plaster-a", "13 mm gypsum plaster - side A", 13, 16, "gypsum"), t("block", "100 mm lightweight aggregate block", 100, 14, "masonry"), t("plaster-b", "13 mm gypsum plaster - side B", 13, 16, "gypsum")]],
  ["dense140", "140 mm Dense Block + Plaster Both Sides", [t("plaster-a", "13 mm gypsum plaster - side A", 13, 16, "gypsum"), t("block", "140 mm dense concrete block", 140, 21, "concrete"), t("plaster-b", "13 mm gypsum plaster - side B", 13, 16, "gypsum")]],
] as const;

const lightweightWallSpecs = [
  ["timber-cladding", "Timber Stud - Timber Cladding", [m("cladding", "Timber rainscreen cladding", 12, "timber"), m("sheathing", "11 mm OSB sheathing", 7.5, "board"), d("stud", "140 mm timber studs and insulation", 0.18, "Gk", "timber"), m("lining", "12.5 mm plasterboard lining", 7.7, "gypsum")]],
  ["fibre-cement", "Timber Stud - Fibre-Cement Cladding", [m("cladding", "Fibre-cement rainscreen cladding", 18, "tile"), m("sheathing", "11 mm OSB sheathing", 7.5, "board"), d("stud", "140 mm timber studs and insulation", 0.18, "Gk", "timber"), m("lining", "12.5 mm plasterboard lining", 7.7, "gypsum")]],
  ["tile-hanging", "Timber Stud - Clay Tile Hanging", [m("tiles", "Clay tile hanging incl. battens", 65, "tile"), m("sheathing", "11 mm OSB sheathing", 7.5, "board"), d("stud", "140 mm timber studs and insulation", 0.18, "Gk", "timber"), m("lining", "12.5 mm plasterboard lining", 7.7, "gypsum")]],
  ["sip-render", "SIP - Rendered Carrier Board", [t("render", "8 mm lightweight render system", 8, 14, "masonry"), m("carrier", "Render carrier board", 12, "board"), d("sip", "Structural insulated panel allowance", 0.25, "Gk", "insulation"), m("lining", "12.5 mm plasterboard lining", 7.7, "gypsum")]],
] as const;

const wallPreset = (id: string, name: string, parts: readonly ComponentSeed[], tags: string[]) => assembly(
  `wall-${id}`,
  `Wall - ${name}`,
  "Walls",
  parts.map((part) => ({ ...part, inputBasis: "wall-face" })),
  "Wall-face self-weight. Multiply by supported wall height to obtain line load in kN/m.",
  { outputBasis: "wall-face", reference: TYPICAL_MATERIALS, tags },
);

const WALL_PRESETS: LoadPreset[] = [
  ...cavityWallSpecs.map(([id, name, parts]) => wallPreset(`cavity-${id}`, `Cavity - ${name}`, parts, ["cavity wall", name.toLowerCase()])),
  ...solidWallSpecs.map(([id, name, parts]) => wallPreset(`solid-${id}`, `Solid - ${name}`, parts, ["solid wall", name.toLowerCase()])),
  ...partitionSpecs.map(([id, name, parts]) => wallPreset(`partition-${id}`, `Partition - ${name}`, parts, ["partition", name.toLowerCase()])),
  ...lightweightWallSpecs.map(([id, name, parts]) => wallPreset(`lightweight-${id}`, `Lightweight External - ${name}`, parts, ["lightweight wall", name.toLowerCase()])),
];

const ceilingSpecs = [
  ["single-12-5", "Timber Battens - 1 x 12.5 mm Plasterboard", [m("board", "12.5 mm plasterboard", 7.7, "gypsum"), d("battens", "Timber battens and fixings", 0.05, "Gk", "timber")]],
  ["double-12-5", "Timber Battens - 2 x 12.5 mm Plasterboard", [m("boards", "2 x 12.5 mm plasterboard", 15.4, "gypsum"), d("battens", "Timber battens and fixings", 0.05, "Gk", "timber")]],
  ["single-15-fire", "Timber Battens - 1 x 15 mm Fire Board", [m("board", "15 mm fire-resisting plasterboard", 12.5, "gypsum"), d("battens", "Timber battens and fixings", 0.05, "Gk", "timber")]],
  ["double-15-fire", "Timber Battens - 2 x 15 mm Fire Board", [m("boards", "2 x 15 mm fire-resisting plasterboard", 25, "gypsum"), d("battens", "Timber battens and fixings", 0.05, "Gk", "timber")]],
  ["resilient-bar", "Resilient Bar - 2 x 15 mm Acoustic Board", [m("boards", "2 x 15 mm acoustic plasterboard", 24, "gypsum"), m("bars", "Resilient bars and fixings", 2, "metal"), m("insulation", "Acoustic mineral wool", 3, "insulation")]],
  ["acoustic-board", "Direct Fix - Acoustic Board + Mineral Wool", [m("board", "15 mm acoustic plasterboard", 12, "gypsum"), m("insulation", "Acoustic mineral wool", 3, "insulation"), d("support", "Support and fixing allowance", 0.04, "Gk", "metal")]],
  ["lath-plaster", "Traditional Timber Lath and Plaster", [d("plaster", "Traditional plaster finish", 0.22, "Gk", "gypsum"), d("lath", "Timber laths and fixings", 0.08, "Gk", "timber")]],
  ["suspended-mf", "Suspended MF - Mineral Fibre Tile", [m("tiles", "Mineral fibre ceiling tiles", 4, "insulation"), d("grid", "Suspended metal grid and hangers", 0.08, "Gk", "metal"), d("services", "Light services allowance", 0.1, "Gk", "metal")]],
] as const;

const CEILING_PRESETS = ceilingSpecs.map(([id, name, parts]) => assembly(
  `ceiling-${id}`,
  `Ceiling - ${name}`,
  "Ceilings",
  [...parts],
  "Ceiling dead-load build-up per horizontal plan area; confirm support system and service allowance.",
  { reference: TYPICAL_MATERIALS, tags: ["ceiling", name.toLowerCase()] },
));

const openingSpecs = [
  ["upvc-double", "uPVC - Double Glazed", [m("glass", "Double-glazed insulating glass unit", 25, "glass"), d("frame", "uPVC frame allowance per opening area", 0.15, "Gk", "board")]],
  ["upvc-triple", "uPVC - Triple Glazed", [m("glass", "Triple-glazed insulating glass unit", 37.5, "glass"), d("frame", "uPVC frame allowance per opening area", 0.15, "Gk", "board")]],
  ["aluminium-double", "Aluminium - Double Glazed", [m("glass", "Double-glazed insulating glass unit", 25, "glass"), d("frame", "Aluminium frame allowance per opening area", 0.2, "Gk", "metal")]],
  ["timber-double", "Timber - Double Glazed", [m("glass", "Double-glazed insulating glass unit", 25, "glass"), d("frame", "Timber frame allowance per opening area", 0.22, "Gk", "timber")]],
  ["rooflight-triple", "Rooflight - Triple Glazed Aluminium", [m("glass", "Triple-glazed rooflight unit", 37.5, "glass"), d("frame", "Aluminium frame and kerb allowance", 0.25, "Gk", "metal")]],
] as const;

const OPENING_PRESETS = openingSpecs.map(([id, name, parts]) => assembly(
  `opening-${id}`,
  `Opening - ${name}`,
  "Openings",
  parts.map((part) => ({ ...part, inputBasis: "wall-face" })),
  "Opening self-weight per square metre of opening. Frame allowance is geometry-sensitive; replace with unit manufacturer total mass.",
  { outputBasis: "wall-face", reference: TYPICAL_MATERIALS, tags: ["window", "glazing", name.toLowerCase()] },
));

const IMPOSED_PRESETS: LoadPreset[] = [
  assembly("imposed-category-a", "Imposed - Category A - Dwelling Rooms", "Imposed loads", [domesticQ()], "Uniformly distributed imposed action for rooms in self-contained dwellings.", { origin: "UK code reference", reference: UK_NA_DOMESTIC, tags: ["UK NA", "domestic", "Category A"] }),
  assembly("imposed-category-b1", "Imposed - Category B1 - General Office Floors", "Imposed loads", [d("qk", "UK NA Category B1 office floor UDL", 2.5, "Qk", "load")], "Uniformly distributed imposed action for general office areas; verify the occupancy and concentrated action.", { origin: "UK code reference", reference: "NA to BS EN 1991-1-1:2002 (2019), office subcategory B1; reproduced by SCI design guidance.", tags: ["UK NA", "office", "Category B"] }),
  assembly("imposed-category-b2", "Imposed - Category B2 - Office Ground/Basement", "Imposed loads", [d("qk", "UK NA Category B2 office floor UDL", 3, "Qk", "load")], "Uniformly distributed imposed action for the relevant office ground/basement subcategory; verify classification.", { origin: "UK code reference", reference: "NA to BS EN 1991-1-1:2002 (2019), office subcategory B2; reproduced by SCI design guidance.", tags: ["UK NA", "office", "Category B"] }),
  assembly("imposed-category-h", "Imposed - Category H - Maintenance Roof", "Imposed loads", [roofQ()], "Pitch-dependent roof UDL for roofs not accessible except for normal maintenance and repair.", { pitchDeg: 30, origin: "UK code reference", reference: UK_NA_ROOF, tags: ["UK NA", "roof", "Category H"] }),
  assembly("imposed-partition-light", "Imposed - Movable Partitions - Up to 1.0 kN/m", "Imposed loads", [d("qk", "Equivalent movable-partition UDL", 0.5, "Qk", "load")], "Equivalent floor allowance for movable partitions with self-weight up to 1.0 kN/m wall length.", { origin: "UK code reference", reference: "NA to BS EN 1991-1-1:2002 (2019), movable partition allowance. Confirm partition line weight and applicability.", tags: ["UK NA", "partition allowance"] }),
  assembly("imposed-partition-medium", "Imposed - Movable Partitions - Up to 2.0 kN/m", "Imposed loads", [d("qk", "Equivalent movable-partition UDL", 0.8, "Qk", "load")], "Equivalent floor allowance for movable partitions with self-weight above 1.0 and up to 2.0 kN/m wall length.", { origin: "UK code reference", reference: "NA to BS EN 1991-1-1:2002 (2019), movable partition allowance. Confirm partition line weight and applicability.", tags: ["UK NA", "partition allowance"] }),
  assembly("imposed-partition-heavy", "Imposed - Movable Partitions - Up to 3.0 kN/m", "Imposed loads", [d("qk", "Equivalent movable-partition UDL", 1.2, "Qk", "load")], "Equivalent floor allowance for movable partitions with self-weight above 2.0 and up to 3.0 kN/m wall length.", { origin: "UK code reference", reference: "NA to BS EN 1991-1-1:2002 (2019), movable partition allowance. Heavier partitions require explicit design.", tags: ["UK NA", "partition allowance"] }),
];

export const LOAD_PRESETS: LoadPreset[] = [
  ...FLOOR_PRESETS,
  ...PITCHED_ROOFS,
  ...FLAT_ROOFS,
  ...WALL_PRESETS,
  ...CEILING_PRESETS,
  ...OPENING_PRESETS,
  ...IMPOSED_PRESETS,
];

export const LOAD_PRESET_COUNT = LOAD_PRESETS.length;

if (LOAD_PRESET_COUNT !== 100) {
  throw new Error(`UK load database must contain exactly 100 presets; found ${LOAD_PRESET_COUNT}.`);
}

if (new Set(LOAD_PRESETS.map((preset) => preset.id)).size !== LOAD_PRESET_COUNT) {
  throw new Error("UK load database preset IDs must be unique.");
}

export function evaluateComponent(
  component: LoadComponent,
  pitchDeg = 0,
  outputBasis: LoadOutputBasis = "plan-area",
): EvaluatedComponent {
  let rawValue = 0;
  let formula = "";

  if (component.method === "direct") {
    rawValue = Math.max(0, component.directKnM2 ?? 0);
    formula = `${tidy(rawValue)} kN/m2`;
  } else if (component.method === "mass-per-area") {
    const mass = Math.max(0, component.massKgM2 ?? 0);
    rawValue = mass * 9.80665 / 1000;
    formula = `${tidy(mass)} x 9.80665 / 1000`;
  } else if (component.method === "thickness-density") {
    const thickness = Math.max(0, component.thicknessMm ?? 0);
    const density = Math.max(0, component.densityKnM3 ?? 0);
    rawValue = thickness / 1000 * density;
    formula = `(${tidy(thickness)} / 1000) x ${tidy(density)}`;
  } else {
    const pitch = Math.max(0, Math.min(90, pitchDeg));
    rawValue = pitch < 30 ? 0.6 : pitch < 60 ? 0.6 * (60 - pitch) / 30 : 0;
    formula = pitch < 30
      ? "0.60 (pitch < 30 deg)"
      : pitch < 60
        ? `0.60 x (60 - ${tidy(pitch, 1)}) / 30`
        : "0.00 (pitch >= 60 deg)";
  }

  const needsPlanConversion = component.inputBasis === "roof-slope" && outputBasis === "plan-area";
  if (needsPlanConversion) {
    const safePitch = Math.max(0, Math.min(89, pitchDeg));
    const cosine = Math.cos(safePitch * Math.PI / 180);
    rawValue /= Math.max(cosine, 0.01);
    formula = `(${formula}) / cos(${tidy(safePitch, 1)} deg)`;
  }

  return { ...component, valueKnM2: rawValue, formula };
}

export function evaluatePreset(preset: LoadPreset, pitchOverride?: number) {
  const pitchDeg = pitchOverride ?? preset.pitchDeg ?? 0;
  const components = preset.components.map((component) => evaluateComponent(component, pitchDeg, preset.outputBasis));
  const gk = components.filter((component) => component.action === "Gk").reduce((total, component) => total + component.valueKnM2, 0);
  const qk = components.filter((component) => component.action === "Qk").reduce((total, component) => total + component.valueKnM2, 0);
  return {
    pitchDeg,
    components,
    gk,
    qk,
    characteristic: gk + qk,
    combinations: combineActions(gk, qk, 0.7),
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
  imposed?: {
    code: string;
    concentratedKn?: number;
    storageHeightM?: number;
    roomQkKnM2?: number;
    roofPitchDeg?: number;
  },
): LoadPreset {
  return {
    id,
    name,
    category,
    origin: "Custom",
    outputBasis,
    notes,
    reference: imposed?.code
      ? `Device-local user build. Imposed area action selected from NA to BS EN 1991-1-1:2002, ${imposed.code}; verify against the current project standard and exact use.`
      : "Device-local user copy. Review and independently verify before design use.",
    components: [
      {
        id: `${id}-gk`,
        label: "Custom permanent action",
        action: "Gk",
        method: "direct",
        directKnM2: Math.max(0, gk),
        inputBasis: outputBasis === "wall-face" ? "wall-face" : "plan",
        visualKind: "board",
      },
      {
        id: `${id}-qk`,
        label: imposed?.code ? `UK NA ${imposed.code} imposed area action` : "Custom imposed action",
        action: "Qk",
        method: "direct",
        directKnM2: Math.max(0, qk),
        inputBasis: outputBasis === "wall-face" ? "wall-face" : "plan",
        visualKind: "load",
        note: imposed?.concentratedKn !== undefined ? `Separate concentrated action Qk = ${imposed.concentratedKn} kN; do not add it to the UDL.` : undefined,
      },
    ],
    tags: ["custom"],
    custom: true,
    ukNaImposedCode: imposed?.code,
    concentratedKn: imposed?.concentratedKn,
    storageHeightM: imposed?.storageHeightM,
    roomQkKnM2: imposed?.roomQkKnM2,
    roofPitchDeg: imposed?.roofPitchDeg,
  };
}
