// @ts-nocheck
/**
 * AUTO-GENERATED server engine for padFooting.
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

function calculator(v){const one=v.length*v.width*v.thickness+v.pedL*v.pedW*v.pedH; const net=one*v.qty; const order=net*(1+v.waste/100); const steel=net*v.rebarRate;
const form=v.qty*(2*(v.length+v.width)*v.thickness + 2*(v.pedL+v.pedW)*v.pedH);
return result([m('Concrete volume',net,'m³'),m('Concrete to order',order,'m³'),m('Indicative reinforcement',steel,'kg'),m('Side formwork',form,'m²')],[q('Concrete',order,'m³',0.1),q('Reinforcement',steel,'kg',5),q('Formwork contact area',form,'m²',1)],[`Reinforcement rate is a quantity allowance only; it is not a structural design.`]);}

export function computePadFooting(
  raw: NumericInputs,
): EngineResult {
  const v = coerceInputs(raw);
  const out = calculator(v);
  return toEngineResult(out, [
    "Server-backed STRUCTURA material quantity calculation.",
    "Pad Footing Material Calculator",
  ]);
}

export const padFootingEngine: CalculatorEngine = {
  id: "padFooting",
  version: "1.0",
  title: "Pad Footing Material Calculator",
  category: "Foundations",
  compute: computePadFooting,
};
