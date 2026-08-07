import {
  asNumber,
  roundTo,
  type CalculatorEngine,
  type EngineResult,
  type NumericInputs,
} from "../types";

/**
 * Brick Wall quantity engine — server-only.
 * Formula matches the verified Stage-1 baseline (do not alter without a defect note).
 */
export function computeBrickWall(raw: NumericInputs): EngineResult {
  const length = asNumber(raw.length);
  const height = asNumber(raw.height);
  const openings = asNumber(raw.openings);
  const leaves = asNumber(raw.leaves, 1);
  const brickL = asNumber(raw.brickL);
  const brickH = asNumber(raw.brickH);
  const brickW = asNumber(raw.brickW);
  const joint = asNumber(raw.joint);
  const waste = asNumber(raw.waste);
  const cementPart = asNumber(raw.cementPart);
  const sandPart = asNumber(raw.sandPart);

  const area = Math.max(0, length * height - openings);
  const modL = (brickL + joint) / 1000;
  const modH = (brickH + joint) / 1000;
  const leaf = Number(leaves);
  const exact = (area / (modL * modH)) * leaf;
  const bricks = exact * (1 + waste / 100);
  const wallVol = area * (brickW / 1000) * leaf;
  const solid = exact * ((brickL * brickH * brickW) / 1e9);
  const wet = Math.max(0, wallVol - solid);
  const dry = wet * 1.33;
  const parts = cementPart + sandPart;
  const bags = ((dry * cementPart) / parts) * (1440 / 50);
  const sand = (dry * sandPart) / parts;

  return {
    metrics: [
      { label: "Net wall area", value: area, unit: "m²" },
      { label: "Exact brick count", value: exact, unit: "no." },
      { label: "Bricks incl. wastage", value: bricks, unit: "no." },
      { label: "Wet mortar", value: wet, unit: "m³" },
      { label: "Cement", value: bags, unit: "50 kg bags" },
      { label: "Sand", value: sand, unit: "m³" },
    ],
    materials: [
      {
        label: "Bricks",
        exact: bricks,
        order: roundTo(bricks, 10),
        unit: "no.",
      },
      {
        label: "Cement",
        exact: bags,
        order: roundTo(bags, 1),
        unit: "bags",
      },
      {
        label: "Sand",
        exact: sand,
        order: roundTo(sand, 0.1),
        unit: "m³",
      },
    ],
    notes: [
      "Count is based on the entered brick and joint dimensions. Confirm bond, closers and site breakage.",
    ],
    steps: [
      {
        label: "Net wall area",
        expression: "max(0, L×H − openings)",
        value: area,
        unit: "m²",
      },
      {
        label: "Modular brick face",
        expression: "(brickL+joint)/1000 × (brickH+joint)/1000",
        value: modL * modH,
        unit: "m²",
      },
      {
        label: "Exact brick count",
        expression: "area / modularFace × leaves",
        value: exact,
        unit: "no.",
      },
      {
        label: "Bricks incl. wastage",
        expression: "exact × (1 + waste/100)",
        value: bricks,
        unit: "no.",
      },
      {
        label: "Wall volume",
        expression: "area × brickW/1000 × leaves",
        value: wallVol,
        unit: "m³",
      },
      {
        label: "Solid brick volume",
        expression: "exact × brickL×brickH×brickW / 1e9",
        value: solid,
        unit: "m³",
      },
      {
        label: "Wet mortar",
        expression: "max(0, wallVol − solid)",
        value: wet,
        unit: "m³",
      },
      {
        label: "Dry mortar",
        expression: "wet × 1.33",
        value: dry,
        unit: "m³",
      },
      {
        label: "Cement bags",
        expression: "dry × cementPart/parts × 1440/50",
        value: bags,
        unit: "50 kg bags",
      },
      {
        label: "Sand",
        expression: "dry × sandPart/parts",
        value: sand,
        unit: "m³",
      },
    ],
    assumptions: [
      "Modular face size includes the mortar joint.",
      "Double-leaf selection doubles the face count.",
      "Dry mortar volume uses a 1.33 bulking factor on wet mortar.",
      "Cement ordered as 50 kg bags at 1440 kg/m³ (baseline formula preserved).",
      "Nominal mix quantities are indicative; use the project mix design or ready-mix supplier data for final procurement.",
    ],
  };
}

export const brickWallEngine: CalculatorEngine = {
  id: "brickWall",
  version: "1.0",
  title: "Brick Wall Material Calculator",
  category: "Masonry",
  compute: computeBrickWall,
};
