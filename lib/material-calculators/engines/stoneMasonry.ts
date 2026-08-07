// @ts-nocheck
/**
 * AUTO-GENERATED server engine for stoneMasonry.
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

function calculator(v){const net=Math.max(0,v.length*v.height*v.thickness-v.openings); const order=net*(1+v.waste/100); const wet=order*v.mortarPct/100; const stone=order-wet; const dry=wet*1.33; const parts=v.cementPart+v.sandPart; const bags=dry*v.cementPart/parts*1440/50; const sand=dry*v.sandPart/parts;
return result([m('Net masonry volume',net,'m³'),m('Stone quantity',stone,'m³'),m('Wet mortar',wet,'m³'),m('Cement',bags,'50 kg bags'),m('Sand',sand,'m³')],[q('Masonry stone',stone,'m³',0.1),q('Cement',bags,'bags',1),q('Sand',sand,'m³',0.1)],[`Adjust the mortar percentage to suit random rubble, coursed stone and workmanship.`]);}

export function computeStoneMasonry(
  raw: NumericInputs,
): EngineResult {
  const v = coerceInputs(raw);
  const out = calculator(v);
  return toEngineResult(out, [
    "Server-backed STRUCTURA material quantity calculation.",
    "Stone Masonry Material Calculator",
  ]);
}

export const stoneMasonryEngine: CalculatorEngine = {
  id: "stoneMasonry",
  version: "1.0",
  title: "Stone Masonry Material Calculator",
  category: "Masonry",
  compute: computeStoneMasonry,
};
