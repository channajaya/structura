// @ts-nocheck
/**
 * AUTO-GENERATED server engine for gutters.
 * Source formula extracted from Stage-1 calculator HTML — do not edit lightly.
 */
import {
  coerceInputs,
  m,
  q,
  result,
  toEngineResult,
} from "../helpers";
import type { CalculatorEngine, EngineResult, NumericInputs } from "../types";

function calculator(v){const gutter=v.eavesLength*v.runs*(1+v.waste/100); const pieces=gutter/v.gutterStock; const downs=Math.max(v.runs,Math.ceil(v.eavesLength/v.downSpacing)*v.runs); const downLen=downs*v.downHeight*(1+v.waste/100); const brackets=v.eavesLength*v.runs/v.bracketSpacing+v.runs; const outlets=downs;
return result([m('Gutter length incl. allowance',gutter,'m'),m('Standard gutter lengths',pieces,'pieces'),m('Downpipes',downs,'no.'),m('Downpipe length',downLen,'m'),m('Gutter brackets',brackets,'no.'),m('Outlets',outlets,'no.')],[q(`${v.gutterStock} m gutter lengths`,pieces,'pieces',1),q('Downpipes',downs,'no.',1),q('Downpipe length',downLen,'m',1),q('Gutter brackets',brackets,'no.',1),q('Outlets',outlets,'no.',1)],[`Hydraulic capacity and outlet locations require rainfall and roof-catchment design checks.`]);}

export function computeGutters(
  raw: NumericInputs,
): EngineResult {
  const v = coerceInputs(raw);
  const out = calculator(v);
  return toEngineResult(out, [
    "Server-backed STRUCTURA material quantity calculation.",
    "Gutters and Downpipes Material Calculator",
  ]);
}

export const guttersEngine: CalculatorEngine = {
  id: "gutters",
  version: "1.0",
  title: "Gutters and Downpipes Material Calculator",
  category: "Roofing",
  compute: computeGutters,
};
