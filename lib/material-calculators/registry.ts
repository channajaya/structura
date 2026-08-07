import { brickWallEngine } from "./engines/brickWall";
import type { CalculatorEngine, EngineResult, NumericInputs } from "./types";

/**
 * Server-side calculator engine registry.
 * Only engines registered here are callable via /api/calculations/compute.
 */
const ENGINES: Record<string, CalculatorEngine> = {
  [brickWallEngine.id]: brickWallEngine,
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
