// @ts-nocheck
/**
 * AUTO-GENERATED server engine for aluminiumDoors.
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

function calculator(v){const perimeter=v.qty*2*(v.width+v.height); const internal=v.qty*(v.mullions*v.height+v.transoms*v.width); const profile=(perimeter+internal)*(1+v.waste/100); const mass=profile*v.profileMass; const glass=v.qty*v.width*v.height*(1-v.glassDeduct/100); const sealant=perimeter*2;
return result([m('Frame/perimeter length',perimeter,'m'),m('Intermediate member length',internal,'m'),m('Aluminium profile incl. wastage',profile,'m'),m('Estimated profile mass',mass,'kg'),m('Glazing area',glass,'m²'),m('Sealant perimeter',sealant,'m')],[q('Aluminium profiles',profile,'m',1),q('Aluminium mass',mass,'kg',5),q('Glass',glass,'m²',0.1),q('Sealant',sealant,'m',1),q('Door hardware sets',v.qty,'sets',1)],[`Profile unit mass and framing arrangement must match the selected aluminium system.`]);}

export function computeAluminiumDoors(
  raw: NumericInputs,
): EngineResult {
  const v = coerceInputs(raw);
  const out = calculator(v);
  return toEngineResult(out, [
    "Server-backed STRUCTURA material quantity calculation.",
    "Aluminium Doors Material Calculator",
  ]);
}

export const aluminiumDoorsEngine: CalculatorEngine = {
  id: "aluminiumDoors",
  version: "1.0",
  title: "Aluminium Doors Material Calculator",
  category: "Doors and Windows",
  compute: computeAluminiumDoors,
};
