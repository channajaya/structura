// @ts-nocheck
/**
 * AUTO-GENERATED server engine for generalConcrete.
 * Source formula extracted from Stage-1 calculator HTML — do not edit lightly.
 */
import {
  coerceInputs,
  m,
  q,
  result,
  toEngineResult,
  mixMaterials,
  mixNote,
} from "../helpers";
import type { CalculatorEngine, EngineResult, NumericInputs } from "../types";

function calculator(v){const wet=Math.max(0,v.length*v.width*v.depth*v.qty-v.deduct); const mix=mixMaterials(wet,v.cementPart,v.sandPart,v.aggPart,v.dryFactor,v.waste);
return result([m('Net concrete volume',wet,'m³'),m('Concrete to order',mix.orderWet,'m³'),m('Cement',mix.bags,'50 kg bags'),m('Sand',mix.sand,'m³'),m('Aggregate',mix.aggregate,'m³')],[q('Concrete',mix.orderWet,'m³',0.1),q('Cement',mix.bags,'bags',1),q('Sand',mix.sand,'m³',0.1),q('Aggregate',mix.aggregate,'m³',0.1)],[mixNote]);}

export function computeGeneralConcrete(
  raw: NumericInputs,
): EngineResult {
  const v = coerceInputs(raw);
  const out = calculator(v);
  return toEngineResult(out, [
    "Server-backed STRUCTURA material quantity calculation.",
    "General Concrete Material Calculator",
  ]);
}

export const generalConcreteEngine: CalculatorEngine = {
  id: "generalConcrete",
  version: "1.0",
  title: "General Concrete Material Calculator",
  category: "Reinforced Concrete",
  compute: computeGeneralConcrete,
};
