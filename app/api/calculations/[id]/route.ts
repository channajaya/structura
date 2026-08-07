import { NextResponse } from "next/server";
import { calculationsStore } from "../_store";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const record = calculationsStore.get(id);
  if (!record) {
    return NextResponse.json({ error: "Calculation not found" }, { status: 404 });
  }
  return NextResponse.json(record);
}
