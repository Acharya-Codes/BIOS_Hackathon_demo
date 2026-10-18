const environment = import.meta.env;

export const MAP_SERVICE_ENDPOINTS = {
  nominatim: environment.VITE_NOMINATIM_URL || "https://nominatim.openstreetmap.org/search",
  overpass: [
    environment.VITE_OVERPASS_URL || "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
    "https://overpass.private.coffee/api/interpreter",
  ],
  tiles: environment.VITE_OSM_TILE_URL || "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
};
