// @ts-nocheck
/**
 * AUTO-GENERATED server engine for stairs.
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

function calculator(v){const horizontal=v.steps*v.tread; const rise=v.steps*v.riser; const slope=Math.hypot(horizontal,rise); const waistVol=slope*v.width*v.waist; const stepVol=v.steps*0.5*v.tread*v.riser*v.width; const landingVol=v.landing*v.width*v.landingT; const net=waistVol+stepVol+landingVol; const order=net*(1+v.waste/100); const steel=net*v.rebarRate;
return result([m('Flight slope length',slope,'m'),m('Waist-slab concrete',waistVol,'m³'),m('Step concrete',stepVol,'m³'),m('Landing concrete',landingVol,'m³'),m('Total concrete to order',order,'m³'),m('Reinforcement allowance',steel,'kg')],[q('Concrete',order,'m³',0.1),q('Reinforcement',steel,'kg',5),q('Flight soffit formwork',slope*v.width,'m²',1)],[`Geometric method includes triangular step wedges above the waist slab.`]);}

export function computeStairs(
  raw: NumericInputs,
): EngineResult {
  const v = coerceInputs(raw);
  const out = calculator(v);
  return toEngineResult(out, [
    "Server-backed STRUCTURA material quantity calculation.",
    "Stairs Material Calculator",
  ]);
}

export const stairsEngine: CalculatorEngine = {
  id: "stairs",
  version: "1.0",
  title: "Stairs Material Calculator",
  category: "Reinforced Concrete",
  compute: computeStairs,
};
