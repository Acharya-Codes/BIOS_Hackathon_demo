import type { Coordinates } from "../types/clinics";

const EARTH_RADIUS_KM = 6371.0088;

export function haversineDistanceKm(from: Coordinates, to: Coordinates): number {
  const toRadians = (degrees: number) => degrees * (Math.PI / 180);
  const latitudeDelta = toRadians(to.lat - from.lat);
  const longitudeDelta = toRadians(to.lon - from.lon);
  const fromLatitude = toRadians(from.lat);
  const toLatitude = toRadians(to.lat);
  const haversine = Math.min(1, Math.max(0,
    Math.sin(latitudeDelta / 2) ** 2
      + Math.cos(fromLatitude) * Math.cos(toLatitude) * Math.sin(longitudeDelta / 2) ** 2,
  ));

  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
}
