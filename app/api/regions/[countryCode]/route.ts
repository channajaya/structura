import { NextResponse } from "next/server";

const REGION_META: Record<
  string,
  { countryCode: string; countryName: string; currency: string; measurement: string }
> = {
  LK: {
    countryCode: "LK",
    countryName: "Sri Lanka",
    currency: "LKR",
    measurement: "metric",
  },
  GB: {
    countryCode: "GB",
    countryName: "United Kingdom",
    currency: "GBP",
    measurement: "metric",
  },
  AU: {
    countryCode: "AU",
    countryName: "Australia",
    currency: "AUD",
    measurement: "metric",
  },
  US: {
    countryCode: "US",
    countryName: "United States",
    currency: "USD",
    measurement: "metric",
  },
};

type RouteContext = {
  params: Promise<{ countryCode: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { countryCode } = await context.params;
  const code = countryCode.toUpperCase();
  const region = REGION_META[code];
  if (!region) {
    return NextResponse.json({ error: "Unknown country code" }, { status: 404 });
  }
  return NextResponse.json(region);
}
