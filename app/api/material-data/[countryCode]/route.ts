import { NextResponse } from "next/server";

const MATERIAL_DATA: Record<string, unknown> = {
  LK: {
    countryCode: "LK",
    cementBagKg: 50,
    cementDensityKgPerM3: 1440,
    mortarDryFactor: 1.33,
    brickDefaults: { brickL: 215, brickH: 65, brickW: 102.5, joint: 10 },
  },
  GB: {
    countryCode: "GB",
    cementBagKg: 25,
    cementDensityKgPerM3: 1440,
    mortarDryFactor: 1.33,
    brickDefaults: { brickL: 215, brickH: 65, brickW: 102.5, joint: 10 },
  },
  AU: {
    countryCode: "AU",
    cementBagKg: 20,
    cementDensityKgPerM3: 1440,
    mortarDryFactor: 1.33,
    brickDefaults: { brickL: 230, brickH: 76, brickW: 110, joint: 10 },
  },
  US: {
    countryCode: "US",
    cementBagKg: 42.6,
    cementDensityKgPerM3: 1505,
    mortarDryFactor: 1.33,
    brickDefaults: { brickL: 203, brickH: 68, brickW: 102, joint: 10 },
  },
};

type RouteContext = {
  params: Promise<{ countryCode: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { countryCode } = await context.params;
  const code = countryCode.toUpperCase();
  const data = MATERIAL_DATA[code];
  if (!data) {
    return NextResponse.json({ error: "Unknown country code" }, { status: 404 });
  }
  return NextResponse.json(data);
}
