import { NextResponse } from "next/server";
import { openweather } from "@/lib/adapters/openweather";
import { CHOKEPOINTS } from "@/lib/content/chokepoints";

export const dynamic = "force-dynamic";
export const revalidate = 1800;

export async function GET() {
  const results = await Promise.all(
    CHOKEPOINTS.map(async (c) => ({
      chokepoint: c,
      weather: await openweather.at(c.lat, c.lon, c.name),
    })),
  );
  return NextResponse.json({ fetchedAt: new Date().toISOString(), results });
}
