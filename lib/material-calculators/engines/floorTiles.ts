// @ts-nocheck
/**
 * AUTO-GENERATED server engine for floorTiles.
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

function calculator(v){const area=Math.max(0,v.length*v.width-v.deduct); const tileArea=v.tileL*v.tileW/1e6; const exact=area/tileArea; const tiles=exact*(1+v.waste/100); const boxes=tiles/v.tilesBox; const adhesive=area*v.adhRate*(1+v.waste/100); const grout=area*v.groutRate*(1+v.waste/100);
return result([m('Net tiled area',area,'m²'),m('Exact tiles',exact,'no.'),m('Tiles incl. wastage',tiles,'no.'),m('Tile boxes',boxes,'boxes'),m('Adhesive',adhesive,'kg'),m('Grout',grout,'kg')],[q('Tiles',tiles,'no.',1),q('Tile boxes',boxes,'boxes',1),q('Adhesive bags',adhesive/v.adhBag,'bags',1),q('Grout packs',grout/v.groutPack,'packs',1)],[`Adhesive and grout rates are product-dependent and remain editable.`]);}

export function computeFloorTiles(
  raw: NumericInputs,
): EngineResult {
  const v = coerceInputs(raw);
  const out = calculator(v);
  return toEngineResult(out, [
    "Server-backed STRUCTURA material quantity calculation.",
    "Floor Tiles Material Calculator",
  ]);
}

export const floorTilesEngine: CalculatorEngine = {
  id: "floorTiles",
  version: "1.0",
  title: "Floor Tiles Material Calculator",
  category: "Finishes",
  compute: computeFloorTiles,
};
