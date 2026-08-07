// @ts-nocheck
/**
 * AUTO-GENERATED server engine for groundBeam.
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

function calculator(v){const net=v.qty*v.length*v.width*v.depth; const order=net*(1+v.waste/100); const rebar=net*v.rebarRate;
let form=0; if(v.formSides==='3') form=v.qty*v.length*(2*v.depth+v.width); else if(v.formSides==='2') form=v.qty*v.length*2*v.depth;
return result([m('Concrete volume',net,'m³'),m('Concrete to order',order,'m³'),m('Reinforcement allowance',rebar,'kg'),m('Formwork area',form,'m²')],[q('Concrete',order,'m³',0.1),q('Reinforcement',rebar,'kg',5),q('Formwork',form,'m²',1)],[`Confirm whether the beam soffit is formed or cast against blinding/ground.`]);}

export function computeGroundBeam(
  raw: NumericInputs,
): EngineResult {
  const v = coerceInputs(raw);
  const out = calculator(v);
  return toEngineResult(out, [
    "Server-backed STRUCTURA material quantity calculation.",
    "Ground Beam Material Calculator",
  ]);
}

export const groundBeamEngine: CalculatorEngine = {
  id: "groundBeam",
  version: "1.0",
  title: "Ground Beam Material Calculator",
  category: "Foundations",
  compute: computeGroundBeam,
};
