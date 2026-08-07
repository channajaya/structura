// @ts-nocheck
/**
 * AUTO-GENERATED server engine for foundationRebar.
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

function calculator(v){const base=v.barLength*v.count; const cut=base*(1+(v.lap+v.bend)/100); const unit=v.diameter*v.diameter/162; const net=cut*unit+v.chairs; const order=net*(1+v.waste/100);
return result([m('Base bar length',base,'m'),m('Cutting length incl. laps',cut,'m'),m('Unit mass',unit,'kg/m'),m('Net reinforcement',net,'kg'),m('Order quantity',order,'kg')],[q(`${v.diameter} mm reinforcement`,order,'kg',5)],[`The d²/162 unit-mass relationship is used. Confirm laps, anchorage, hooks and bar scheduling from the structural drawings.`]);}

export function computeFoundationRebar(
  raw: NumericInputs,
): EngineResult {
  const v = coerceInputs(raw);
  const out = calculator(v);
  return toEngineResult(out, [
    "Server-backed STRUCTURA material quantity calculation.",
    "Foundation Reinforcement Material Calculator",
  ]);
}

export const foundationRebarEngine: CalculatorEngine = {
  id: "foundationRebar",
  version: "1.0",
  title: "Foundation Reinforcement Material Calculator",
  category: "Foundations",
  compute: computeFoundationRebar,
};
