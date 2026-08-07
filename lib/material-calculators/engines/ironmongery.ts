// @ts-nocheck
/**
 * AUTO-GENERATED server engine for ironmongery.
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

function calculator(v){const f=1+v.spare/100; const doorH=v.doors*v.doorHinges*f; const winH=v.windows*v.windowHinges*f; const locks=v.doors*v.locks*f; const handles=v.doors*v.handles*f; const stays=v.windows*v.stays*f; const items=doorH+winH+locks+handles+stays; const screws=items*v.screws;
return result([m('Door hinges',doorH,'no.'),m('Window hinges',winH,'no.'),m('Locks/latches',locks,'no.'),m('Handle sets',handles,'sets'),m('Window stays/restrictors',stays,'no.'),m('Fixing screws',screws,'no.')],[q('Door hinges',doorH,'no.',1),q('Window hinges',winH,'no.',1),q('Locks/latches',locks,'no.',1),q('Handle sets',handles,'sets',1),q('Window stays/restrictors',stays,'no.',1),q('Fixing screws',screws,'no.',10)],[`Confirm fire-door, accessibility, security and corrosion-resistance requirements separately.`]);}

export function computeIronmongery(
  raw: NumericInputs,
): EngineResult {
  const v = coerceInputs(raw);
  const out = calculator(v);
  return toEngineResult(out, [
    "Server-backed STRUCTURA material quantity calculation.",
    "Ironmongery Material Calculator",
  ]);
}

export const ironmongeryEngine: CalculatorEngine = {
  id: "ironmongery",
  version: "1.0",
  title: "Ironmongery Material Calculator",
  category: "Doors and Windows",
  compute: computeIronmongery,
};
