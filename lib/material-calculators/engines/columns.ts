// @ts-nocheck
/**
 * AUTO-GENERATED server engine for columns.
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

function calculator(v){const net=v.qty*v.width*v.depth*v.height; const order=net*(1+v.waste/100); const form=v.qty*2*(v.width+v.depth)*v.height; const steel=net*v.rebarRate;
return result([m('Concrete volume',net,'m³'),m('Concrete to order',order,'m³'),m('Four-face formwork',form,'m²'),m('Reinforcement allowance',steel,'kg')],[q('Concrete',order,'m³',0.1),q('Formwork',form,'m²',1),q('Reinforcement',steel,'kg',5)],[`Reinforcement allowance is for estimating only and must be replaced by the bar schedule.`]);}

export function computeColumns(
  raw: NumericInputs,
): EngineResult {
  const v = coerceInputs(raw);
  const out = calculator(v);
  return toEngineResult(out, [
    "Server-backed STRUCTURA material quantity calculation.",
    "Columns Material Calculator",
  ]);
}

export const columnsEngine: CalculatorEngine = {
  id: "columns",
  version: "1.0",
  title: "Columns Material Calculator",
  category: "Reinforced Concrete",
  compute: computeColumns,
};
