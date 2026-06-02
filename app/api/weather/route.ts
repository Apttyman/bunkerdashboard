import { NextResponse } from "next/server";
import { openweather } from "@/lib/adapters/openweather";
import { openmeteo } from "@/lib/adapters/openmeteo";
import { CHOKEPOINTS } from "@/lib/content/chokepoints";

export const dynamic = "force-dynamic";
export const revalidate = 1800;

export async function GET() {
  // Prefer OpenWeather if a key is set; otherwise keyless Open-Meteo (real, no key).
  const useOW = openweather.configured();
  const results = await Promise.all(
    CHOKEPOINTS.map(async (c) => ({
      chokepoint: c,
      weather: useOW
        ? await openweather.at(c.lat, c.lon, c.name)
        : await openmeteo.at(c.lat, c.lon, c.name),
    })),
  );
  return NextResponse.json({ fetchedAt: new Date().toISOString(), results });
}
