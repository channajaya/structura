// @ts-nocheck
/**
 * AUTO-GENERATED server engine for mortar.
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

function calculator(v){const wetOrder=v.wet*(1+v.waste/100); const dry=wetOrder*v.dryFactor; const parts=v.cementPart+v.sandPart; const cementVol=dry*v.cementPart/parts; const cementKg=cementVol*1440; const bags=cementKg/v.bagMass; const sand=dry*v.sandPart/parts; const water=cementKg*v.waterRatio;
return result([m('Wet mortar to produce',wetOrder,'m³'),m('Dry materials volume',dry,'m³'),m('Cement',cementKg,'kg'),m('Cement bags',bags,'bags'),m('Sand',sand,'m³'),m('Indicative water',water,'L')],[q('Cement',bags,'bags',1),q('Sand',sand,'m³',0.1),q('Water',water,'L',10)],[mixNote]);}

export function computeMortar(
  raw: NumericInputs,
): EngineResult {
  const v = coerceInputs(raw);
  const out = calculator(v);
  return toEngineResult(out, [
    "Server-backed STRUCTURA material quantity calculation.",
    "Masonry Mortar Material Calculator",
  ]);
}

export const mortarEngine: CalculatorEngine = {
  id: "mortar",
  version: "1.0",
  title: "Masonry Mortar Material Calculator",
  category: "Masonry",
  compute: computeMortar,
};
