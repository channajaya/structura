// @ts-nocheck
/**
 * AUTO-GENERATED server engine for wallTies.
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

function calculator(v){const area=Math.max(0,v.length*v.height-v.openings); const density=1/((v.hSpacing/1000)*(v.vSpacing/1000)); const field=area*density; const extra=v.openingPerim/(v.extraSpacing/1000); const exact=field+extra; const order=exact*(1+v.waste/100);
return result([m('Net cavity-wall area',area,'m²'),m('Field tie density',density,'ties/m²'),m('Field ties',field,'no.'),m('Additional opening ties',extra,'no.'),m('Total ties incl. spare',order,'no.')],[q('Wall ties',order,'no.',10)],[`Spacing and opening rules are editable. Confirm the project specification, exposure, cavity width, insulation and relevant masonry standard.`]);}

export function computeWallTies(
  raw: NumericInputs,
): EngineResult {
  const v = coerceInputs(raw);
  const out = calculator(v);
  return toEngineResult(out, [
    "Server-backed STRUCTURA material quantity calculation.",
    "Wall Ties Material Calculator",
  ]);
}

export const wallTiesEngine: CalculatorEngine = {
  id: "wallTies",
  version: "1.0",
  title: "Wall Ties Material Calculator",
  category: "Masonry",
  compute: computeWallTies,
};
