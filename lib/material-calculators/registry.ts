import { aluminiumDoorsEngine } from "./engines/aluminiumDoors";
import { aluminiumWindowsEngine } from "./engines/aluminiumWindows";
import { beamsEngine } from "./engines/beams";
import { blockWallEngine } from "./engines/blockWall";
import { brickWallEngine } from "./engines/brickWall";
import { columnsEngine } from "./engines/columns";
import { externalRenderEngine } from "./engines/externalRender";
import { floorScreedEngine } from "./engines/floorScreed";
import { floorTilesEngine } from "./engines/floorTiles";
import { foundationExcavationEngine } from "./engines/foundationExcavation";
import { foundationRebarEngine } from "./engines/foundationRebar";
import { generalConcreteEngine } from "./engines/generalConcrete";
import { glazingEngine } from "./engines/glazing";
import { groundBeamEngine } from "./engines/groundBeam";
import { guttersEngine } from "./engines/gutters";
import { internalPlasterEngine } from "./engines/internalPlaster";
import { ironmongeryEngine } from "./engines/ironmongery";
import { lintelsEngine } from "./engines/lintels";
import { mortarEngine } from "./engines/mortar";
import { padFootingEngine } from "./engines/padFooting";
import { paintingEngine } from "./engines/painting";
import { randomRubbleEngine } from "./engines/randomRubble";
import { reinforcementEngine } from "./engines/reinforcement";
import { roofGeometryEngine } from "./engines/roofGeometry";
import { roofSheetsEngine } from "./engines/roofSheets";
import { roofTilesEngine } from "./engines/roofTiles";
import { slabsEngine } from "./engines/slabs";
import { stairsEngine } from "./engines/stairs";
import { steelRoofEngine } from "./engines/steelRoof";
import { stoneMasonryEngine } from "./engines/stoneMasonry";
import { stripFootingEngine } from "./engines/stripFooting";
import { timberDoorsEngine } from "./engines/timberDoors";
import { timberRoofEngine } from "./engines/timberRoof";
import { timberWindowsEngine } from "./engines/timberWindows";
import { wallTiesEngine } from "./engines/wallTies";
import { waterproofingEngine } from "./engines/waterproofing";
import type { CalculatorEngine, EngineResult, NumericInputs } from "./types";

/**
 * Server-side calculator engine registry.
 * Only engines registered here are callable via /api/calculations/compute.
 */
const ENGINES: Record<string, CalculatorEngine> = {
  [aluminiumDoorsEngine.id]: aluminiumDoorsEngine,
  [aluminiumWindowsEngine.id]: aluminiumWindowsEngine,
  [beamsEngine.id]: beamsEngine,
  [blockWallEngine.id]: blockWallEngine,
  [brickWallEngine.id]: brickWallEngine,
  [columnsEngine.id]: columnsEngine,
  [externalRenderEngine.id]: externalRenderEngine,
  [floorScreedEngine.id]: floorScreedEngine,
  [floorTilesEngine.id]: floorTilesEngine,
  [foundationExcavationEngine.id]: foundationExcavationEngine,
  [foundationRebarEngine.id]: foundationRebarEngine,
  [generalConcreteEngine.id]: generalConcreteEngine,
  [glazingEngine.id]: glazingEngine,
  [groundBeamEngine.id]: groundBeamEngine,
  [guttersEngine.id]: guttersEngine,
  [internalPlasterEngine.id]: internalPlasterEngine,
  [ironmongeryEngine.id]: ironmongeryEngine,
  [lintelsEngine.id]: lintelsEngine,
  [mortarEngine.id]: mortarEngine,
  [padFootingEngine.id]: padFootingEngine,
  [paintingEngine.id]: paintingEngine,
  [randomRubbleEngine.id]: randomRubbleEngine,
  [reinforcementEngine.id]: reinforcementEngine,
  [roofGeometryEngine.id]: roofGeometryEngine,
  [roofSheetsEngine.id]: roofSheetsEngine,
  [roofTilesEngine.id]: roofTilesEngine,
  [slabsEngine.id]: slabsEngine,
  [stairsEngine.id]: stairsEngine,
  [steelRoofEngine.id]: steelRoofEngine,
  [stoneMasonryEngine.id]: stoneMasonryEngine,
  [stripFootingEngine.id]: stripFootingEngine,
  [timberDoorsEngine.id]: timberDoorsEngine,
  [timberRoofEngine.id]: timberRoofEngine,
  [timberWindowsEngine.id]: timberWindowsEngine,
  [wallTiesEngine.id]: wallTiesEngine,
  [waterproofingEngine.id]: waterproofingEngine,
};

export function listEngineIds(): string[] {
  return Object.keys(ENGINES);
}

export function getEngine(calculatorId: string): CalculatorEngine | null {
  return ENGINES[calculatorId] || null;
}

export function computeCalculation(
  calculatorId: string,
  inputs: NumericInputs,
): EngineResult {
  const engine = getEngine(calculatorId);
  if (!engine) {
    throw new Error(`Unknown calculatorId: ${calculatorId}`);
  }
  return engine.compute(inputs);
}
