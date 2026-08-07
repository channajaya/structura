// @ts-nocheck
/**
 * AUTO-GENERATED server engine for timberRoof.
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

function calculator(v){const run=v.width/2+v.overhang; const slope=run/Math.cos(v.pitch*Math.PI/180); const sets=Math.ceil(v.length/v.rafterSpacing)+1; const rafterLen=sets*2*slope; const battenRows=Math.floor(slope/v.battenSpacing)+1; const battenLen=battenRows*2*v.length; const timberVol=rafterLen*(v.rafterB/1000)*(v.rafterD/1000)*(1+v.waste/100);
return result([m('Rafter/truss sets',sets,'no.'),m('Slope length',slope,'m'),m('Total rafter length',rafterLen,'m'),m('Batten rows per roof',battenRows*2,'rows'),m('Total batten length',battenLen,'m'),m('Rafter timber volume incl. wastage',timberVol,'m³')],[q('Rafter timber length',rafterLen*(1+v.waste/100),'m',1),q('Rafter timber volume',timberVol,'m³',0.01),q('Roof battens',battenLen*(1+v.waste/100),'m',1)],[`This is a material take-off, not a structural timber design. Add ties, purlins, ridge boards, bracing and trimmers separately where applicable.`]);}

export function computeTimberRoof(
  raw: NumericInputs,
): EngineResult {
  const v = coerceInputs(raw);
  const out = calculator(v);
  return toEngineResult(out, [
    "Server-backed STRUCTURA material quantity calculation.",
    "Timber Roof Frame Material Calculator",
  ]);
}

export const timberRoofEngine: CalculatorEngine = {
  id: "timberRoof",
  version: "1.0",
  title: "Timber Roof Frame Material Calculator",
  category: "Roofing",
  compute: computeTimberRoof,
};
