// @ts-nocheck
/**
 * AUTO-GENERATED server engine for roofGeometry.
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

function calculator(v){const run=v.width/2+v.eaves; const angle=v.pitch*Math.PI/180; const slope=run/Math.cos(angle); const roofLength=v.length+2*v.gable; const area=2*slope*roofLength; const plan=2*run*roofLength; const rise=run*Math.tan(angle); const ridge=roofLength; const eaves=2*roofLength;
return result([m('Horizontal run per slope',run,'m'),m('Vertical rise',rise,'m'),m('Slope length',slope,'m'),m('Sloping roof area',area,'m²'),m('Plan roof area',plan,'m²'),m('Ridge length',ridge,'m'),m('Total eaves length',eaves,'m')],[q('Roof covering area',area,'m²',1),q('Ridge',ridge,'m',0.1),q('Eaves',eaves,'m',0.1)],[`Simple symmetrical gable roof. Hips, valleys, dormers and unequal slopes require separate geometry.`]);}

export function computeRoofGeometry(
  raw: NumericInputs,
): EngineResult {
  const v = coerceInputs(raw);
  const out = calculator(v);
  return toEngineResult(out, [
    "Server-backed STRUCTURA material quantity calculation.",
    "Roof Geometry and Pitch Material Calculator",
  ]);
}

export const roofGeometryEngine: CalculatorEngine = {
  id: "roofGeometry",
  version: "1.0",
  title: "Roof Geometry and Pitch Material Calculator",
  category: "Roofing",
  compute: computeRoofGeometry,
};
