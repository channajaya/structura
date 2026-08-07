// @ts-nocheck
/**
 * AUTO-GENERATED server engine for glazing.
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

function calculator(v){const net=v.qty*v.width*v.height*(1-v.deduct/100); const order=net*(1+v.waste/100); const vol=order*v.thickness/1000; const mass=vol*v.density; const perimeter=v.qty*2*(v.width+v.height)*v.sealantSides;
return result([m('Net glass area',net,'m²'),m('Order area incl. wastage',order,'m²'),m('Glass volume',vol,'m³'),m('Estimated glass mass',mass,'kg'),m('Sealant length',perimeter,'m')],[q(`${v.thickness} mm glass`,order,'m²',0.1),q('Glass mass',mass,'kg',5),q('Glazing sealant/gasket',perimeter,'m',1)],[`Glass type, thickness and safety classification require project-specific glazing design and specification.`]);}

export function computeGlazing(
  raw: NumericInputs,
): EngineResult {
  const v = coerceInputs(raw);
  const out = calculator(v);
  return toEngineResult(out, [
    "Server-backed STRUCTURA material quantity calculation.",
    "Glass and Glazing Material Calculator",
  ]);
}

export const glazingEngine: CalculatorEngine = {
  id: "glazing",
  version: "1.0",
  title: "Glass and Glazing Material Calculator",
  category: "Doors and Windows",
  compute: computeGlazing,
};
