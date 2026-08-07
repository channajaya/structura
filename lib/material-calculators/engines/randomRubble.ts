// @ts-nocheck
/**
 * AUTO-GENERATED server engine for randomRubble.
 * Source formula extracted from Stage-1 calculator HTML — do not edit lightly.
 */
import {
  coerceInputs,
  m,
  q,
  result,
  toEngineResult,
  mixNote,
} from "../helpers";
import type { CalculatorEngine, EngineResult, NumericInputs } from "../types";

function calculator(v){const gross=v.length*v.height*v.thickness; const net=Math.max(0,gross-v.openings); const order=net*(1+v.waste/100);
const wetMortar=order*v.mortarPct/100; const stone=order-wetMortar; const dry=wetMortar*v.dryFactor;
const totalParts=v.cementPart+v.sandPart; const cementVol=dry*v.cementPart/totalParts; const sand=dry*v.sandPart/totalParts; const bags=cementVol*1440/50;
return result([m('Net masonry volume',net,'m³'),m('Stone quantity',stone,'m³'),m('Wet mortar volume',wetMortar,'m³'),m('Cement',bags,'50 kg bags'),m('Sand',sand,'m³')],[q('Random rubble stone',stone,'m³',0.1),q('Cement',bags,'bags',1),q('Sand',sand,'m³',0.1)],[`Mortar proportion is editable; verify against the selected stone size, workmanship and specification. ${mixNote}`]);}

export function computeRandomRubble(
  raw: NumericInputs,
): EngineResult {
  const v = coerceInputs(raw);
  const out = calculator(v);
  return toEngineResult(out, [
    "Server-backed STRUCTURA material quantity calculation.",
    "Random Rubble Foundation Wall Material Calculator",
  ]);
}

export const randomRubbleEngine: CalculatorEngine = {
  id: "randomRubble",
  version: "1.0",
  title: "Random Rubble Foundation Wall Material Calculator",
  category: "Foundations",
  compute: computeRandomRubble,
};
