// @ts-nocheck
/**
 * AUTO-GENERATED server engine for timberDoors.
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

function calculator(v){const leafArea=v.qty*v.width*v.height; const leafVol=leafArea*v.leafT/1000; const frameLen=v.qty*(2*v.height+v.width+v.threshold*v.width); const frameVol=frameLen*(v.frameW/1000)*(v.frameD/1000)*(1+v.waste/100); const hinges=v.qty*v.hinges;
return result([m('Total leaf area',leafArea,'m²'),m('Leaf solid volume',leafVol,'m³'),m('Frame length',frameLen,'m'),m('Frame timber volume incl. wastage',frameVol,'m³'),m('Hinges',hinges,'no.'),m('Locks / handle sets',v.qty,'sets')],[q('Door leaves',v.qty,'no.',1),q('Frame timber',frameLen*(1+v.waste/100),'m',1),q('Hinges',hinges,'no.',1),q('Lock/handle sets',v.qty,'sets',1)],[`Leaf volume is a geometric solid-volume reference; manufactured door leaves are normally procured by schedule/type.`]);}

export function computeTimberDoors(
  raw: NumericInputs,
): EngineResult {
  const v = coerceInputs(raw);
  const out = calculator(v);
  return toEngineResult(out, [
    "Server-backed STRUCTURA material quantity calculation.",
    "Timber Doors Material Calculator",
  ]);
}

export const timberDoorsEngine: CalculatorEngine = {
  id: "timberDoors",
  version: "1.0",
  title: "Timber Doors Material Calculator",
  category: "Doors and Windows",
  compute: computeTimberDoors,
};
