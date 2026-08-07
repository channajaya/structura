// @ts-nocheck
/**
 * AUTO-GENERATED server engine for floorScreed.
 * Source formula extracted from Stage-1 calculator HTML — do not edit lightly.
 */
import {
  coerceInputs,
  m,
  q,
  result,
  toEngineResult,
  mixNote,
} from "../helpers";
import type { CalculatorEngine, EngineResult, NumericInputs } from "../types";

function calculator(v){const area=Math.max(0,v.length*v.width-v.deduct); const wet=area*v.thickness/1000; const order=wet*(1+v.waste/100); const dry=order*1.33; const parts=v.cementPart+v.sandPart; const bags=dry*v.cementPart/parts*1440/50; const sand=dry*v.sandPart/parts;
return result([m('Net screed area',area,'m²'),m('Wet screed volume',wet,'m³'),m('Wet volume incl. wastage',order,'m³'),m('Cement',bags,'50 kg bags'),m('Sand',sand,'m³')],[q('Cement',bags,'bags',1),q('Screed sand',sand,'m³',0.1)],[mixNote]);}

export function computeFloorScreed(
  raw: NumericInputs,
): EngineResult {
  const v = coerceInputs(raw);
  const out = calculator(v);
  return toEngineResult(out, [
    "Server-backed STRUCTURA material quantity calculation.",
    "Floor Screed Material Calculator",
  ]);
}

export const floorScreedEngine: CalculatorEngine = {
  id: "floorScreed",
  version: "1.0",
  title: "Floor Screed Material Calculator",
  category: "Finishes",
  compute: computeFloorScreed,
};
