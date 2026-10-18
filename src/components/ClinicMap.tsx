import { useEffect, useRef } from "react";
import { CircleMarker, MapContainer, Popup, TileLayer, useMap } from "react-leaflet";
import type { CircleMarker as LeafletCircleMarker } from "leaflet";
import type { Clinic, SearchLocation } from "../types/clinics";
import { MAP_SERVICE_ENDPOINTS } from "../services/mapServices";

interface ClinicMapProps {
  location: SearchLocation;
  clinics: Clinic[];
  selectedClinicId: string | null;
  onSelectClinic: (clinic: Clinic) => void;
}

function MapResizer() {
  const map = useMap();

  useEffect(() => {
    const container = map.getContainer();
    const observer = new ResizeObserver(() => map.invalidateSize());
    observer.observe(container);
    return () => observer.disconnect();
  }, [map]);

  return null;
}

function MapSelection({ selectedId, markers }: { selectedId: string | null; markers: React.RefObject<Map<string, LeafletCircleMarker>> }) {
  const map = useMap();

  useEffect(() => {
    if (!selectedId) return;
    const marker = markers.current?.get(selectedId);
    if (marker) {
      marker.openPopup();
      map.panTo(marker.getLatLng());
    }
  }, [map, markers, selectedId]);

  return null;
}

function MapLocation({ lat, lon }: { lat: number; lon: number }) {
  const map = useMap();

  useEffect(() => {
    map.setView([lat, lon], Math.max(map.getZoom(), 12));
  }, [lat, lon, map]);

  return null;
}

export default function ClinicMap({ location, clinics, selectedClinicId, onSelectClinic }: ClinicMapProps) {
  const markerRefs = useRef(new Map<string, LeafletCircleMarker>());

  return (
    <MapContainer center={[location.lat, location.lon]} className="clinic-map" scrollWheelZoom zoom={12}>
      <MapResizer />
      <MapLocation lat={location.lat} lon={location.lon} />
      <MapSelection markers={markerRefs} selectedId={selectedClinicId} />
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url={MAP_SERVICE_ENDPOINTS.tiles}
      />
      <CircleMarker
        center={[location.lat, location.lon]}
        pathOptions={{ color: "#fff", fillColor: "#1e2761", fillOpacity: 1, weight: 4 }}
        radius={9}
      >
        <Popup>
          <strong>Search location</strong>
          <br />
          {location.name}
        </Popup>
      </CircleMarker>
      {clinics.map((clinic) => {
        const id = `${clinic.osmType}:${clinic.osmId}`;
        const selected = selectedClinicId === id;
        return (
          <CircleMarker
            center={[clinic.lat, clinic.lon]}
            eventHandlers={{ click: () => onSelectClinic(clinic) }}
            key={id}
            pathOptions={{
              color: selected ? "#fff" : "#fff",
              fillColor: selected ? "#c98b4a" : "#2e8b7a",
              fillOpacity: 1,
              weight: selected ? 4 : 2,
            }}
            radius={selected ? 10 : 7}
            ref={(marker) => {
              if (marker) markerRefs.current.set(id, marker);
              else markerRefs.current.delete(id);
            }}
          >
            <Popup>
              <strong>{clinic.name}</strong>
              <br />
              {clinic.facilityType} · {clinic.distanceKm < 1
                ? `${Math.round(clinic.distanceKm * 1000)} m`
                : `${clinic.distanceKm.toFixed(1)} km`} straight-line distance
            </Popup>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
}
