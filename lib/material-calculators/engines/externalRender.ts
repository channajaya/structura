// @ts-nocheck
/**
 * AUTO-GENERATED server engine for externalRender.
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

function calculator(v){const area=Math.max(0,v.length*v.height-v.openings); const wet=area*v.coats*v.thickness/1000; const order=wet*(1+v.waste/100); const dry=order*1.33; const parts=v.cementPart+v.sandPart; const bags=dry*v.cementPart/parts*1440/50; const sand=dry*v.sandPart/parts;
return result([m('Net rendered area',area,'m²'),m('Total coat thickness',v.coats*v.thickness,'mm'),m('Wet render incl. wastage',order,'m³'),m('Cement',bags,'50 kg bags'),m('Sand',sand,'m³')],[q('Cement',bags,'bags',1),q('Render sand',sand,'m³',0.1)],[`Confirm coat build-up, substrate preparation and product specification.`]);}

export function computeExternalRender(
  raw: NumericInputs,
): EngineResult {
  const v = coerceInputs(raw);
  const out = calculator(v);
  return toEngineResult(out, [
    "Server-backed STRUCTURA material quantity calculation.",
    "External Render Material Calculator",
  ]);
}

export const externalRenderEngine: CalculatorEngine = {
  id: "externalRender",
  version: "1.0",
  title: "External Render Material Calculator",
  category: "Finishes",
  compute: computeExternalRender,
};
