// @ts-nocheck
/**
 * AUTO-GENERATED server engine for aluminiumWindows.
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

function calculator(v){const outer=v.qty*2*(v.width+v.height); const internal=v.qty*(v.mullions*v.height+v.transoms*v.width); const sash=v.sashExtra*outer; const profile=(outer+internal+sash)*(1+v.waste/100); const mass=profile*v.profileMass; const glass=v.qty*v.width*v.height*(1-v.glassDeduct/100); const sealant=outer*2;
return result([m('Outer-frame length',outer,'m'),m('Internal members',internal,'m'),m('Sash/profile allowance',sash,'m'),m('Profile length incl. wastage',profile,'m'),m('Estimated aluminium mass',mass,'kg'),m('Glazing area',glass,'m²'),m('Sealant length',sealant,'m')],[q('Aluminium profiles',profile,'m',1),q('Aluminium mass',mass,'kg',5),q('Glass',glass,'m²',0.1),q('Sealant',sealant,'m',1)],[`Set the sash/profile factor to suit sliding, casement or fixed-light system geometry.`]);}

export function computeAluminiumWindows(
  raw: NumericInputs,
): EngineResult {
  const v = coerceInputs(raw);
  const out = calculator(v);
  return toEngineResult(out, [
    "Server-backed STRUCTURA material quantity calculation.",
    "Aluminium Windows Material Calculator",
  ]);
}

export const aluminiumWindowsEngine: CalculatorEngine = {
  id: "aluminiumWindows",
  version: "1.0",
  title: "Aluminium Windows Material Calculator",
  category: "Doors and Windows",
  compute: computeAluminiumWindows,
};
