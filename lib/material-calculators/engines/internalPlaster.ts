// @ts-nocheck
/**
 * AUTO-GENERATED server engine for internalPlaster.
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

function calculator(v){const area=Math.max(0,(v.length*v.height-v.openings)*v.faces); const wet=area*v.thickness/1000; const order=wet*(1+v.waste/100); const dry=order*1.33; const parts=v.cementPart+v.sandPart; const bags=dry*v.cementPart/parts*1440/50; const sand=dry*v.sandPart/parts;
return result([m('Net plaster area',area,'m²'),m('Wet plaster volume',wet,'m³'),m('Wet volume incl. wastage',order,'m³'),m('Cement',bags,'50 kg bags'),m('Sand',sand,'m³')],[q('Cement',bags,'bags',1),q('Plaster sand',sand,'m³',0.1)],[mixNote]);}

export function computeInternalPlaster(
  raw: NumericInputs,
): EngineResult {
  const v = coerceInputs(raw);
  const out = calculator(v);
  return toEngineResult(out, [
    "Server-backed STRUCTURA material quantity calculation.",
    "Internal Plaster Material Calculator",
  ]);
}

export const internalPlasterEngine: CalculatorEngine = {
  id: "internalPlaster",
  version: "1.0",
  title: "Internal Plaster Material Calculator",
  category: "Finishes",
  compute: computeInternalPlaster,
};
