import { describe, expect, it } from "vitest";
import { haversineDistanceKm } from "./distance";

describe("haversineDistanceKm", () => {
  it("returns zero for the same point", () => {
    expect(haversineDistanceKm({ lat: 13.08, lon: 80.27 }, { lat: 13.08, lon: 80.27 })).toBe(0);
  });

  it("calculates a great-circle distance in kilometres", () => {
    expect(haversineDistanceKm({ lat: 0, lon: 0 }, { lat: 0, lon: 1 })).toBeCloseTo(111.195, 2);
  });
});
