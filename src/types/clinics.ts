export interface Coordinates {
  lat: number;
  lon: number;
}

export interface SearchLocation extends Coordinates {
  name: string;
  accuracy?: number;
}

export interface GeocodingCandidate extends SearchLocation {
  id: string;
}

export interface Clinic {
  osmType: "node" | "way" | "relation";
  osmId: number;
  name: string;
  facilityType: string;
  address?: string;
  lat: number;
  lon: number;
  distanceKm: number;
}

export type SearchRadiusKm = 5 | 10 | 25;
