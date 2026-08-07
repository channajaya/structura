// @ts-nocheck
/**
 * AUTO-GENERATED server engine for timberWindows.
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

function calculator(v){const perimeter=v.qty*2*(v.width+v.height); const internal=v.qty*(v.mullions*v.height+v.transoms*v.width); const total=(perimeter+internal)*(1+v.waste/100); const vol=total*(v.sectionW/1000)*(v.sectionD/1000); const glass=v.qty*v.width*v.height*(1-v.glassDeduct/100);
return result([m('Outer-frame length',perimeter,'m'),m('Mullion/transom length',internal,'m'),m('Timber length incl. wastage',total,'m'),m('Timber volume',vol,'m³'),m('Glazing area',glass,'m²')],[q('Window timber',total,'m',1),q('Timber volume',vol,'m³',0.01),q('Glass',glass,'m²',0.1),q('Window ironmongery sets',v.qty,'sets',1)],[`Add separate sash/leaf framing when the internal members entered do not represent the complete opening configuration.`]);}

export function computeTimberWindows(
  raw: NumericInputs,
): EngineResult {
  const v = coerceInputs(raw);
  const out = calculator(v);
  return toEngineResult(out, [
    "Server-backed STRUCTURA material quantity calculation.",
    "Timber Windows Material Calculator",
  ]);
}

export const timberWindowsEngine: CalculatorEngine = {
  id: "timberWindows",
  version: "1.0",
  title: "Timber Windows Material Calculator",
  category: "Doors and Windows",
  compute: computeTimberWindows,
};
