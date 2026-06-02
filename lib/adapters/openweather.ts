// OpenWeather adapter — current conditions/wind at chokepoint coordinates.
import { fetchJson } from "@/lib/http";
import { ok, unavailable, type Provenance } from "@/lib/provenance";
import { envConfigured } from "./types";

const KEY = "OPENWEATHER_API_KEY";
const SRC_URL = "https://openweathermap.org/";

export interface WeatherObs {
  description: string;
  tempC: number;
  windMs: number;
  gustMs?: number;
}

interface OwResp {
  weather?: Array<{ description: string }>;
  main?: { temp: number };
  wind?: { speed: number; gust?: number };
  dt?: number;
}

export const openweather = {
  id: "openweather",
  name: "OpenWeather",
  tier: 1 as const,
  requiresKey: true,
  envKey: KEY,
  configured: () => envConfigured(KEY),

  async at(lat: number, lon: number, place: string): Promise<Provenance<WeatherObs>> {
    const src = `OpenWeather — ${place}`;
    if (!this.configured())
      return unavailable({ source: src, sourceTier: 1, reason: "API key not configured", sourceUrl: SRC_URL });
    try {
      const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${process.env[KEY]}`;
      const j = await fetchJson<OwResp>(url, { revalidate: 1800 });
      const obs: WeatherObs = {
        description: j.weather?.[0]?.description ?? "n/a",
        tempC: j.main?.temp ?? NaN,
        windMs: j.wind?.speed ?? NaN,
        gustMs: j.wind?.gust,
      };
      return ok({
        value: obs,
        source: src,
        sourceTier: 1,
        sourceUrl: SRC_URL,
        asOf: j.dt ? new Date(j.dt * 1000).toISOString() : null,
        cadence: "weather",
      });
    } catch (e) {
      return unavailable({ source: src, sourceTier: 1, reason: `Source error: ${(e as Error).message}`, sourceUrl: SRC_URL });
    }
  },
};
