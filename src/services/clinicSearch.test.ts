import { afterEach, describe, expect, it, vi } from "vitest";
import { buildOverpassQuery, normalizeClinics, searchNearbyClinics } from "./clinicSearch";

const origin = { lat: 13.55, lon: 78.5 };

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("nearby clinic search", () => {
  it("builds a bounded query for common healthcare tags", () => {
    const query = buildOverpassQuery(origin, 10);
    expect(query).toContain("around:10000,13.55,78.5");
    expect(query).toContain('"amenity"');
    expect(query).toContain('"healthcare"');
    expect(query).toContain("out center tags");
  });

  it("rejects a non-empty response without usable feature geometry", () => {
    expect(() => normalizeClinics({
      elements: [{ type: "way", id: 5, tags: { amenity: "clinic" } }],
    }, origin, 10)).toThrow(/invalid facility data/i);
  });

  it("normalizes nodes and ways, removes duplicate OSM IDs, filters radius, and sorts nearest-first", () => {
    const clinics = normalizeClinics({
      elements: [
        { type: "node", id: 2, lat: 13.56, lon: 78.5, tags: { amenity: "clinic", name: "Farther", "addr:city": "Madanapalle" } },
        { type: "way", id: 8, center: { lat: 13.551, lon: 78.5 }, tags: { healthcare: "health_centre", "addr:street": "Main Road" } },
        { type: "relation", id: 10, center: { lat: 13.552, lon: 78.5 }, tags: { amenity: "hospital", name: "District Hospital" } },
        { type: "node", id: 2, lat: 13.56, lon: 78.5, tags: { amenity: "clinic", name: "Duplicate" } },
        { type: "relation", id: 4, center: { lat: 13.8, lon: 78.5 }, tags: { amenity: "hospital" } },
        { type: "way", id: 9, tags: { amenity: "doctors" } },
      ],
    }, origin, 5);

    expect(clinics).toHaveLength(3);
    expect(clinics[0]).toMatchObject({
      osmType: "way",
      osmId: 8,
      name: "Unnamed healthcare facility",
      facilityType: "Health centre",
      address: "Main Road",
    });
    expect(clinics[1]).toMatchObject({ osmType: "relation", osmId: 10, name: "District Hospital" });
    expect(clinics[2]).toMatchObject({ osmType: "node", osmId: 2, name: "Farther", address: "Madanapalle" });
    expect(clinics[0].distanceKm).toBeLessThan(clinics[1].distanceKm);
    expect(clinics[1].distanceKm).toBeLessThan(clinics[2].distanceKm);
  });

  it("reports network errors rather than returning fake results", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("offline")));
    await expect(searchNearbyClinics({ lat: 10, lon: 10 }, 10)).rejects.toThrow(/unavailable/i);
  });
});
