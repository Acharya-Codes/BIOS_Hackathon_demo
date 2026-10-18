import type { GeocodingCandidate } from "../types/clinics";
import { MAP_SERVICE_ENDPOINTS } from "./mapServices";

const REQUEST_TIMEOUT_MS = 12_000;
const MIN_REQUEST_INTERVAL_MS = 1_000;
const CACHE_LIMIT = 100;
const cache = new Map<string, GeocodingCandidate[]>();
const inFlight = new Map<string, Promise<GeocodingCandidate[]>>();
let nextRequestAt = 0;

interface NominatimResult {
  place_id?: number;
  osm_type?: string;
  osm_id?: number;
  lat?: string;
  lon?: string;
  display_name?: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isCoordinate(value: unknown): value is string {
  return typeof value === "string" && value.trim() !== "" && Number.isFinite(Number(value));
}

export function normalizeGeocodingResults(payload: unknown): GeocodingCandidate[] {
  if (!Array.isArray(payload)) {
    throw new Error("The location service returned an unexpected response. Please try again.");
  }

  const candidates = payload.flatMap((value) => {
    if (!isRecord(value)) return [];
    const result = value as NominatimResult;
    if (!isCoordinate(result.lat) || !isCoordinate(result.lon) || typeof result.display_name !== "string") return [];

    const lat = Number(result.lat);
    const lon = Number(result.lon);
    if (lat < -90 || lat > 90 || lon < -180 || lon > 180) return [];

    const id = result.place_id !== undefined
      ? String(result.place_id)
      : `${result.osm_type ?? "place"}:${result.osm_id ?? `${lat},${lon}`}`;
    return [{ id, name: result.display_name, lat, lon }];
  });
  if (payload.length > 0 && candidates.length === 0) {
    throw new Error("The location service returned invalid location data. Please try again.");
  }
  return candidates;
}

function waitForRateLimit(): Promise<void> {
  const waitMs = Math.max(0, nextRequestAt - Date.now());
  nextRequestAt = Date.now() + waitMs + MIN_REQUEST_INTERVAL_MS;
  return waitMs === 0 ? Promise.resolve() : new Promise((resolve) => globalThis.setTimeout(resolve, waitMs));
}

export function geocodeLocation(query: string): Promise<GeocodingCandidate[]> {
  const normalizedQuery = query.trim().replace(/\s+/g, " ");
  if (!normalizedQuery) return Promise.resolve([]);

  const key = normalizedQuery.toLocaleLowerCase();
  const cached = cache.get(key);
  if (cached) return Promise.resolve(cached);
  const pending = inFlight.get(key);
  if (pending) return pending;

  const request = (async () => {
    await waitForRateLimit();
    const controller = new AbortController();
    const timeout = globalThis.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const url = new URL(MAP_SERVICE_ENDPOINTS.nominatim);
      url.searchParams.set("q", normalizedQuery);
      url.searchParams.set("format", "jsonv2");
      url.searchParams.set("addressdetails", "1");
      url.searchParams.set("limit", "5");

      const response = await fetch(url, { signal: controller.signal });
      if (!response.ok) {
        if (response.status === 429) throw new Error("The location service is busy. Please wait a moment and try again.");
        throw new Error(`The location service could not complete your search (HTTP ${response.status}).`);
      }

      const results = normalizeGeocodingResults(await response.json());
      cache.set(key, results);
      if (cache.size > CACHE_LIMIT) cache.delete(cache.keys().next().value as string);
      return results;
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        throw new Error("The location search timed out. Check your connection and try again.");
      }
      if (error instanceof TypeError) {
        throw new Error("The location service is unavailable. Check your connection and try again.");
      }
      throw error;
    } finally {
      globalThis.clearTimeout(timeout);
      inFlight.delete(key);
    }
  })();

  inFlight.set(key, request);
  return request;
}
