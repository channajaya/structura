// @ts-nocheck
/**
 * AUTO-GENERATED server engine for blockWall.
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

function calculator(v){const area=Math.max(0,v.length*v.height-v.openings); const exact=area/(((v.blockL+v.joint)/1000)*((v.blockH+v.joint)/1000)); const order=exact*(1+v.waste/100);
const wallVol=area*v.blockT/1000; const solid=exact*(v.blockL*v.blockH*v.blockT/1e9); const wet=Math.max(0,wallVol-solid); const dry=wet*1.33; const parts=v.cementPart+v.sandPart; const bags=dry*v.cementPart/parts*1440/50; const sand=dry*v.sandPart/parts;
return result([m('Net wall area',area,'m²'),m('Exact block count',exact,'no.'),m('Blocks incl. wastage',order,'no.'),m('Wet mortar',wet,'m³'),m('Cement',bags,'50 kg bags'),m('Sand',sand,'m³')],[q('Concrete blocks',order,'no.',5),q('Cement',bags,'bags',1),q('Sand',sand,'m³',0.1)],[`Block dimensions are actual units; joint thickness forms the modular size.`]);}

export function computeBlockWall(
  raw: NumericInputs,
): EngineResult {
  const v = coerceInputs(raw);
  const out = calculator(v);
  return toEngineResult(out, [
    "Server-backed STRUCTURA material quantity calculation.",
    "Concrete Block Wall Material Calculator",
  ]);
}

export const blockWallEngine: CalculatorEngine = {
  id: "blockWall",
  version: "1.0",
  title: "Concrete Block Wall Material Calculator",
  category: "Masonry",
  compute: computeBlockWall,
};
