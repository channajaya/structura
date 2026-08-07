// @ts-nocheck
/**
 * AUTO-GENERATED server engine for lintels.
 * Source formula extracted from Stage-1 calculator HTML — do not edit lightly.
 */
import {
  coerceInputs,
  m,
  q,
  result,
  toEngineResult,
  labelOf,
  setLabelContext,
} from "../helpers";
import type { CalculatorEngine, EngineResult, NumericInputs } from "../types";

function calculator(v){const one=v.clear+2*v.bearing/1000; const total=one*v.openings*(1+v.waste/100); const count=v.openings; let vol=0,mass=0;
if(v.type==='precast'||v.type==='timber') vol=total*(v.width/1000)*(v.depth/1000); if(v.type==='steel') mass=total*v.unitMass;
return result([m('Required length per lintel',one,'m'),m('Number of lintels',count,'no.'),m('Total length incl. allowance',total,'m'),m('Section volume',vol,'m³'),m('Steel mass',mass,'kg')],[q(`${labelOf('type')} lintels`,count,'no.',1),q('Total lintel length',total,'m',0.1)],[`This calculator establishes quantity and length only. Structural capacity, bearing and lintel selection require design/specification checks.`]);}

export function computeLintels(
  raw: NumericInputs,
): EngineResult {
  const v = coerceInputs(raw);
  setLabelContext(v);
  const out = calculator(v);
  return toEngineResult(out, [
    "Server-backed STRUCTURA material quantity calculation.",
    "Lintels Material Calculator",
  ]);
}

export const lintelsEngine: CalculatorEngine = {
  id: "lintels",
  version: "1.0",
  title: "Lintels Material Calculator",
  category: "Masonry",
  compute: computeLintels,
};
