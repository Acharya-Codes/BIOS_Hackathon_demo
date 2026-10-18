import { afterEach, describe, expect, it, vi } from "vitest";
import { geocodeLocation, normalizeGeocodingResults } from "./geocoding";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("manual geocoding", () => {
  it("rejects malformed geocoding responses", () => {
    expect(() => normalizeGeocodingResults([{ place_id: 1, lat: "bad", lon: "78", display_name: "Unknown" }]))
      .toThrow(/invalid location data/i);
  });

  it("returns no candidates for an empty response", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [],
    }));

    await expect(geocodeLocation("empty-location-test")).resolves.toEqual([]);
  });

  it("reports HTTP failures clearly", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 503 }));

    await expect(geocodeLocation("service-error-test")).rejects.toThrow("HTTP 503");
  });
});
