# Kavach - Child Health

Just a demo for the BIOS Hackathon Project.

## Find Nearby Clinics

The workspace includes a clinic finder that uses OpenStreetMap data. Search for a village, town, city, PIN code, or address, or explicitly choose **Use My Current Location** to request browser GPS permission. Results can be searched within 5 km, 10 km, or 25 km, shown on a Leaflet map, and opened as directions in Google Maps.

Clinic distances are straight-line estimates, not road distances. OpenStreetMap listings can be incomplete or outdated and do not confirm that a facility is open or provides vaccinations. Searches send the entered location or coordinates to OpenStreetMap services, which may observe request metadata such as the user's IP address. The app does not send child or guardian records to these services or save GPS coordinates.

The prototype uses public Nominatim and Overpass endpoints by default. If an Overpass instance times out or is unavailable, the app tries another public instance before showing an error. Nominatim's public usage policy allows only modest user-triggered usage (maximum one request per second); repeated successful searches are cached in memory. For production or higher traffic, configure an approved provider or proxy with:

```text
VITE_NOMINATIM_URL=https://your-geocoding-service/search
VITE_OVERPASS_URL=https://your-overpass-service/api/interpreter
VITE_OSM_TILE_URL=https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png
```

No API keys are needed for the public prototype endpoints. Review the [Nominatim usage policy](https://operations.osmfoundation.org/policies/nominatim/) before deployment. The feature has no automated dependency on live map APIs.

## Run locally

```sh
npm install
npm run dev
npm test
npm run build
```
