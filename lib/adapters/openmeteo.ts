// Open-Meteo adapter — KEYLESS weather. Default chokepoint weather source so the
// Supply Chain section shows real conditions with zero configuration.
import { fetchJson } from "@/lib/http";
import { ok, unavailable, type Provenance } from "@/lib/provenance";
import type { WeatherObs } from "./openweather";

const SRC_URL = "https://open-meteo.com/";

const WMO: Record<number, string> = {
  0: "clear sky", 1: "mainly clear", 2: "partly cloudy", 3: "overcast",
  45: "fog", 48: "rime fog", 51: "light drizzle", 53: "drizzle", 55: "dense drizzle",
  61: "light rain", 63: "rain", 65: "heavy rain", 71: "light snow", 73: "snow", 75: "heavy snow",
  80: "rain showers", 81: "rain showers", 82: "violent rain showers", 95: "thunderstorm",
  96: "thunderstorm w/ hail", 99: "thunderstorm w/ heavy hail",
};

interface OmResp {
  current?: {
    time?: string;
    temperature_2m?: number;
    wind_speed_10m?: number;
    wind_gusts_10m?: number;
    weather_code?: number;
  };
}

export const openmeteo = {
  id: "openmeteo",
  name: "Open-Meteo",
  tier: 1 as const,
  requiresKey: false,
  configured: () => true,

  async at(lat: number, lon: number, place: string): Promise<Provenance<WeatherObs>> {
    const src = `Open-Meteo — ${place}`;
    try {
      const url =
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
        `&current=temperature_2m,wind_speed_10m,wind_gusts_10m,weather_code&wind_speed_unit=ms`;
      const j = await fetchJson<OmResp>(url, { revalidate: 1800 });
      const c = j.current;
      if (!c) return unavailable({ source: src, sourceTier: 1, reason: "Source error", sourceUrl: SRC_URL });
      const obs: WeatherObs = {
        description: WMO[c.weather_code ?? -1] ?? "n/a",
        tempC: c.temperature_2m ?? NaN,
        windMs: c.wind_speed_10m ?? NaN,
        gustMs: c.wind_gusts_10m,
      };
      return ok({
        value: obs,
        source: src,
        sourceTier: 1,
        sourceUrl: SRC_URL,
        asOf: c.time ? new Date(c.time + "Z").toISOString() : null,
        cadence: "weather",
      });
    } catch (e) {
      return unavailable({ source: src, sourceTier: 1, reason: `Source error: ${(e as Error).message}`, sourceUrl: SRC_URL });
    }
  },
};
