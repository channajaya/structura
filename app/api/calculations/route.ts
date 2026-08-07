import { NextResponse } from "next/server";
import { calculationsStore } from "./_store";

type CalculationPayload = {
  calculatorId?: string;
  calculatorVersion?: string;
  projectId?: string | null;
  country?: string;
  language?: string;
  inputs?: unknown;
  results?: unknown;
  assumptions?: unknown;
  warnings?: unknown;
  timestamp?: string;
};

export async function POST(request: Request) {
  const body = (await request.json()) as CalculationPayload;
  if (!body.calculatorId) {
    return NextResponse.json(
      { error: "calculatorId is required" },
      { status: 400 },
    );
  }

  const id = `calc_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  const record = {
    id,
    ...body,
    timestamp: body.timestamp || new Date().toISOString(),
    savedAt: new Date().toISOString(),
  };
  calculationsStore.set(id, record);

  return NextResponse.json({ id, status: "saved", record }, { status: 201 });
}

export async function GET() {
  return NextResponse.json({
    count: calculationsStore.size,
    items: [...calculationsStore.values()].slice(-25).reverse(),
  });
}
