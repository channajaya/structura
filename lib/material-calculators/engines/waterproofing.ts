// @ts-nocheck
/**
 * AUTO-GENERATED server engine for waterproofing.
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

function calculator(v){const area=v.floorArea+v.perimeter*v.upstand+v.wallArea; const adjusted=area*(1+v.overlap/100); const kg=adjusted*v.coats*v.rate*(1+v.waste/100); const packs=kg/v.pack; const tape=v.perimeter*(1+v.waste/100);
return result([m('Waterproofed area',area,'m²'),m('Area incl. detailing',adjusted,'m²'),m('Membrane required',kg,'kg'),m('Packs required',packs,'packs'),m('Perimeter tape allowance',tape,'m')],[q('Waterproofing membrane',kg,'kg',1),q(`${v.pack} kg packs`,packs,'packs',1),q('Reinforcing / bond-breaker tape',tape,'m',1)],[`Coverage and coat thickness are product-specific. Include corners, penetrations and joints in the detailing allowance.`]);}

export function computeWaterproofing(
  raw: NumericInputs,
): EngineResult {
  const v = coerceInputs(raw);
  const out = calculator(v);
  return toEngineResult(out, [
    "Server-backed STRUCTURA material quantity calculation.",
    "Waterproofing Material Calculator",
  ]);
}

export const waterproofingEngine: CalculatorEngine = {
  id: "waterproofing",
  version: "1.0",
  title: "Waterproofing Material Calculator",
  category: "Finishes",
  compute: computeWaterproofing,
};
