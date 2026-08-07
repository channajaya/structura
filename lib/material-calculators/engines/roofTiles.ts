// @ts-nocheck
/**
 * AUTO-GENERATED server engine for roofTiles.
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

function calculator(v){const slope=(v.width/2+v.overhang)/Math.cos(v.pitch*Math.PI/180); const area=2*slope*v.length; const exact=area/((v.tileL/1000)*(v.tileW/1000)); const tiles=exact*(1+v.waste/100); const packs=tiles/v.pack; const ridge=v.length/(v.ridgeCover/1000)*(1+v.waste/100);
return result([m('Sloping roof area',area,'m²'),m('Exact field tiles',exact,'no.'),m('Tiles incl. wastage',tiles,'no.'),m('Packs required',packs,'packs'),m('Ridge tiles',ridge,'no.')],[q('Roof tiles',tiles,'no.',10),q('Tile packs',packs,'packs',1),q('Ridge tiles',ridge,'no.',1)],[`Use the manufacturer’s effective gauge and cover width, not nominal tile dimensions.`]);}

export function computeRoofTiles(
  raw: NumericInputs,
): EngineResult {
  const v = coerceInputs(raw);
  const out = calculator(v);
  return toEngineResult(out, [
    "Server-backed STRUCTURA material quantity calculation.",
    "Roof Tiles Material Calculator",
  ]);
}

export const roofTilesEngine: CalculatorEngine = {
  id: "roofTiles",
  version: "1.0",
  title: "Roof Tiles Material Calculator",
  category: "Roofing",
  compute: computeRoofTiles,
};
