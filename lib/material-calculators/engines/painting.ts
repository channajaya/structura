// @ts-nocheck
/**
 * AUTO-GENERATED server engine for painting.
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

function calculator(v){const area=Math.max(0,(v.length*v.height-v.openings)*v.faces); const coatArea=area*v.coats; const litres=coatArea/v.coverage*(1+v.waste/100); const packs=litres/v.pack;
return result([m('Net paintable area',area,'m²'),m('Total coat area',coatArea,'m²'),m('Paint required',litres,'L'),m('Packs required',packs,'packs')],[q('Paint',litres,'L',1),q(`${v.pack} L packs`,packs,'packs',1)],[`Coverage varies by substrate, colour, application method and product. Use manufacturer data.`]);}

export function computePainting(
  raw: NumericInputs,
): EngineResult {
  const v = coerceInputs(raw);
  const out = calculator(v);
  return toEngineResult(out, [
    "Server-backed STRUCTURA material quantity calculation.",
    "Painting Material Calculator",
  ]);
}

export const paintingEngine: CalculatorEngine = {
  id: "painting",
  version: "1.0",
  title: "Painting Material Calculator",
  category: "Finishes",
  compute: computePainting,
};
