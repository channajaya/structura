// @ts-nocheck
/**
 * AUTO-GENERATED server engine for roofSheets.
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

function calculator(v){const slope=(v.width/2+v.overhang)/Math.cos(v.pitch*Math.PI/180); const across=Math.ceil(v.length/v.coverW); const effective=Math.max(0.1,v.sheetL-v.endLap); const segments=Math.ceil(Math.max(0,slope-v.endLap)/effective); const exact=2*across*segments; const order=exact*(1+v.waste/100); const area=2*slope*v.length;
return result([m('Slope length',slope,'m'),m('Sloping roof area',area,'m²'),m('Sheets across each slope',across,'no.'),m('Segments up each slope',segments,'no.'),m('Exact sheet count',exact,'no.'),m('Sheets incl. wastage',order,'no.')],[q('Roofing sheets',order,'no.',1),q('Nominal sheet length',v.sheetL,'m',0.1)],[`Effective cover width must allow for sidelap. Confirm maximum supplied length and end-lap requirements.`]);}

export function computeRoofSheets(
  raw: NumericInputs,
): EngineResult {
  const v = coerceInputs(raw);
  const out = calculator(v);
  return toEngineResult(out, [
    "Server-backed STRUCTURA material quantity calculation.",
    "Metal Roofing Sheets Material Calculator",
  ]);
}

export const roofSheetsEngine: CalculatorEngine = {
  id: "roofSheets",
  version: "1.0",
  title: "Metal Roofing Sheets Material Calculator",
  category: "Roofing",
  compute: computeRoofSheets,
};
