// @ts-nocheck
/**
 * AUTO-GENERATED server engine for steelRoof.
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

function calculator(v){const frames=Math.ceil(v.length/v.frameSpacing)+1; const slope=(v.width/2)/Math.cos(v.pitch*Math.PI/180); const mainLen=frames*(2*v.eavesH+2*slope); const rows=Math.floor(slope/v.purlinSpacing)+1; const purlinLen=rows*2*v.length; const mainKg=mainLen*v.mainMass; const purlinKg=purlinLen*v.purlinMass; const total=(mainKg+purlinKg)*(1+v.waste/100);
return result([m('Portal/truss frames',frames,'no.'),m('Rafter slope length',slope,'m'),m('Main-frame length',mainLen,'m'),m('Purlin rows',rows*2,'rows'),m('Purlin length',purlinLen,'m'),m('Estimated steel incl. allowance',total,'kg')],[q('Main-frame steel',mainKg*(1+v.waste/100),'kg',10),q('Purlin steel',purlinKg*(1+v.waste/100),'kg',10),q('Total structural steel',total,'kg',10)],[`Unit masses and framing geometry are estimating inputs. Final quantities must come from structural drawings and the steel schedule.`]);}

export function computeSteelRoof(
  raw: NumericInputs,
): EngineResult {
  const v = coerceInputs(raw);
  const out = calculator(v);
  return toEngineResult(out, [
    "Server-backed STRUCTURA material quantity calculation.",
    "Steel Roof Frame Material Calculator",
  ]);
}

export const steelRoofEngine: CalculatorEngine = {
  id: "steelRoof",
  version: "1.0",
  title: "Steel Roof Frame Material Calculator",
  category: "Roofing",
  compute: computeSteelRoof,
};
