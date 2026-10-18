import type { Clinic, Coordinates } from "../types/clinics";
import { haversineDistanceKm } from "../utils/distance";
import { MAP_SERVICE_ENDPOINTS } from "./mapServices";

const REQUEST_TIMEOUT_MS = 12_000;
const CACHE_LIMIT = 50;
const cache = new Map<string, Clinic[]>();
const inFlight = new Map<string, Promise<Clinic[]>>();

interface OverpassElement {
  type?: unknown;
  id?: unknown;
  lat?: unknown;
  lon?: unknown;
  center?: unknown;
  tags?: unknown;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function stringTags(value: unknown): Record<string, string> {
  if (!isRecord(value)) return {};
  return Object.fromEntries(
    Object.entries(value).filter((entry): entry is [string, string] => typeof entry[1] === "string"),
  );
}

function coordinates(element: OverpassElement): Coordinates | null {
  const candidate = element.type === "node" ? element : element.center;
  if (!isRecord(candidate) || typeof candidate.lat !== "number" || typeof candidate.lon !== "number") return null;
  if (!Number.isFinite(candidate.lat) || !Number.isFinite(candidate.lon)
    || candidate.lat < -90 || candidate.lat > 90 || candidate.lon < -180 || candidate.lon > 180) return null;
  return { lat: candidate.lat, lon: candidate.lon };
}

function facilityType(tags: Record<string, string>): string {
  const healthcare = tags.healthcare?.replace(/_/g, " ");
  const amenity = tags.amenity?.replace(/_/g, " ");
  const value = healthcare || amenity || "Healthcare facility";
  return value.charAt(0).toLocaleUpperCase() + value.slice(1);
}

function facilityAddress(tags: Record<string, string>): string | undefined {
  if (tags["addr:full"]) return tags["addr:full"];
  const street = [tags["addr:housenumber"], tags["addr:street"]].filter(Boolean).join(" ");
  const locality = tags["addr:suburb"] || tags["addr:village"] || tags["addr:town"] || tags["addr:city"];
  const localityParts = [locality, tags["addr:postcode"]].filter(Boolean);
  return [street, localityParts.join(" ")].filter(Boolean).join(", ") || undefined;
}

export function buildOverpassQuery(location: Coordinates, radiusKm: number): string {
  const radiusMetres = Math.round(radiusKm * 1000);
  return `[out:json][timeout:15];(nwr(around:${radiusMetres},${location.lat},${location.lon})["amenity"~"^(clinic|hospital|doctors|health_post)$"];nwr(around:${radiusMetres},${location.lat},${location.lon})["healthcare"~"^(clinic|hospital|doctor|centre|health_centre|health_center|health_post|community_health_centre|community_health_center|nurse)$"];);out center tags;`;
}

export function normalizeClinics(payload: unknown, origin: Coordinates, radiusKm: number): Clinic[] {
  if (!isRecord(payload) || !Array.isArray(payload.elements)) {
    throw new Error("The clinic service returned an unexpected response. Please retry the search.");
  }

  const unique = new Map<string, Clinic>();
  let validElements = 0;
  for (const value of payload.elements) {
    if (!isRecord(value)) continue;
    const element = value as OverpassElement;
    if ((element.type !== "node" && element.type !== "way" && element.type !== "relation")
      || typeof element.id !== "number" || !Number.isSafeInteger(element.id) || element.id < 0) continue;

    const point = coordinates(element);
    if (!point) continue;
    validElements += 1;
    const distanceKm = haversineDistanceKm(origin, point);
    if (distanceKm > radiusKm) continue;

    const tags = stringTags(element.tags);
    const id = `${element.type}:${element.id}`;
    if (!unique.has(id)) {
      unique.set(id, {
        osmType: element.type,
        osmId: element.id,
        name: tags.name?.trim() || "Unnamed healthcare facility",
        facilityType: facilityType(tags),
        address: facilityAddress(tags),
        ...point,
        distanceKm,
      });
    }
  }
  if (payload.elements.length > 0 && validElements === 0) {
    throw new Error("The clinic service returned invalid facility data. Please retry the search.");
  }

  return [...unique.values()].sort((first, second) => first.distanceKm - second.distanceKm);
}

export function searchNearbyClinics(location: Coordinates, radiusKm: number): Promise<Clinic[]> {
  const key = `${location.lat.toFixed(5)},${location.lon.toFixed(5)}:${radiusKm}`;
  const cached = cache.get(key);
  if (cached) return Promise.resolve(cached);
  const pending = inFlight.get(key);
  if (pending) return pending;

  const request = (async () => {
    const query = buildOverpassQuery(location, radiusKm);
    const endpoints = [...new Set(MAP_SERVICE_ENDPOINTS.overpass)];
    let lastError: Error | null = null;

    try {
      for (const endpoint of endpoints) {
        const controller = new AbortController();
        const timeout = globalThis.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
        try {
          const response = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
            body: new URLSearchParams({ data: query }),
            signal: controller.signal,
          });
          if (!response.ok) {
            throw new Error(`The clinic service returned HTTP ${response.status}.`);
          }

          const clinics = normalizeClinics(await response.json(), location, radiusKm);
          cache.set(key, clinics);
          if (cache.size > CACHE_LIMIT) cache.delete(cache.keys().next().value as string);
          return clinics;
        } catch (error) {
          if (error instanceof Error && error.name === "AbortError") {
            lastError = new Error("The clinic search timed out.");
          } else if (error instanceof TypeError) {
            lastError = new Error("The clinic service is unavailable.");
          } else {
            lastError = error instanceof Error ? error : new Error("The clinic service returned an unexpected error.");
          }
        } finally {
          globalThis.clearTimeout(timeout);
        }
      }

      if (lastError?.message.includes("timed out")) {
        throw new Error("Clinic searches timed out on the available OpenStreetMap services. Please retry in a moment or try a smaller radius.");
      }
      if (lastError?.message.includes("unavailable")) {
        throw new Error("The available OpenStreetMap clinic services could not be reached. Check your connection and retry.");
      }
      throw new Error(lastError?.message ?? "Could not search nearby clinics. Please try again.");
    } finally {
      inFlight.delete(key);
    }
  })();

  inFlight.set(key, request);
  return request;
}
