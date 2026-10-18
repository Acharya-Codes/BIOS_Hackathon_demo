import { useRef, useState, type FormEvent } from "react";
import { AlertCircle, ArrowUpRight, LocateFixed, LoaderCircle, MapPin, MapPinned, Search } from "lucide-react";
import ClinicMap from "../components/ClinicMap";
import { searchNearbyClinics } from "../services/clinicSearch";
import { geocodeLocation } from "../services/geocoding";
import type { Clinic, GeocodingCandidate, SearchLocation, SearchRadiusKm } from "../types/clinics";

const RADII: SearchRadiusKm[] = [5, 10, 25];
const GEOLOCATION_OPTIONS: PositionOptions = { enableHighAccuracy: false, timeout: 15_000, maximumAge: 0 };

function formatDistance(distanceKm: number): string {
  return distanceKm < 1 ? `${Math.round(distanceKm * 1000)} m` : `${distanceKm.toFixed(1)} km`;
}

function directionsUrl(clinic: Clinic): string {
  const url = new URL("https://www.google.com/maps/dir/");
  url.searchParams.set("api", "1");
  url.searchParams.set("destination", `${clinic.lat},${clinic.lon}`);
  return url.toString();
}

function geolocationError(error: GeolocationPositionError): string {
  if (error.code === error.PERMISSION_DENIED) {
    return "Location permission was denied. Enable location access for this site in your browser settings, or search for a village or town instead.";
  }
  if (error.code === error.POSITION_UNAVAILABLE) {
    return "Your device could not determine its location. Try again outdoors or use manual search.";
  }
  if (error.code === error.TIMEOUT) {
    return "Finding your location took too long. Try again or use manual search.";
  }
  return "Your location could not be determined. Try manual search instead.";
}

export default function ClinicsPage() {
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState<SearchLocation | null>(null);
  const [candidates, setCandidates] = useState<GeocodingCandidate[]>([]);
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [radiusKm, setRadiusKm] = useState<SearchRadiusKm>(10);
  const [selectedClinicId, setSelectedClinicId] = useState<string | null>(null);
  const [geocoding, setGeocoding] = useState(false);
  const [locating, setLocating] = useState(false);
  const [searching, setSearching] = useState(false);
  const [locationError, setLocationError] = useState("");
  const [clinicError, setClinicError] = useState("");
  const [locationNotice, setLocationNotice] = useState("");
  const requestId = useRef(0);

  async function findClinicsAt(nextLocation: SearchLocation, radius: SearchRadiusKm, notice = "") {
    const request = ++requestId.current;
    setLocation(nextLocation);
    setCandidates([]);
    setClinics([]);
    setSelectedClinicId(null);
    setClinicError("");
    setLocationNotice(notice);
    setSearching(true);
    try {
      const results = await searchNearbyClinics(nextLocation, radius);
      if (request !== requestId.current) return;
      setClinics(results);
    } catch (error) {
      if (request !== requestId.current) return;
      setClinicError(error instanceof Error ? error.message : "Could not search nearby clinics. Please try again.");
    } finally {
      if (request === requestId.current) setSearching(false);
    }
  }

  async function submitLocation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const request = ++requestId.current;
    const trimmed = query.trim();
    if (!trimmed) {
      setLocationError("Enter a village, town, city, PIN code, or address.");
      return;
    }
    setGeocoding(true);
    setLocationError("");
    setLocationNotice("");
    setClinicError("");
    setCandidates([]);
    setClinics([]);
    setLocation(null);
    setSelectedClinicId(null);
    try {
      const matches = await geocodeLocation(trimmed);
      if (request !== requestId.current) return;
      if (matches.length === 0) {
        setLocationError("No matching location found. Try adding a district or PIN code.");
      } else if (matches.length > 1) {
        setCandidates(matches);
      } else {
        setGeocoding(false);
        void findClinicsAt({ ...matches[0] }, radiusKm);
      }
    } catch (error) {
      if (request !== requestId.current) return;
      setLocationError(error instanceof Error ? error.message : "Could not find that location. Please try again.");
    } finally {
      if (request === requestId.current) setGeocoding(false);
    }
  }

  function chooseCandidate(candidate: GeocodingCandidate) {
    void findClinicsAt({ name: candidate.name, lat: candidate.lat, lon: candidate.lon }, radiusKm);
  }

  function useCurrentLocation() {
    const request = ++requestId.current;
    setLocating(true);
    setLocationError("");
    setLocationNotice("");
    setClinicError("");
    setCandidates([]);
    setClinics([]);
    setLocation(null);
    setSelectedClinicId(null);

    if (!navigator.geolocation) {
      setLocationError("This browser does not support GPS location. Search for a village or town instead.");
      setLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (request !== requestId.current) return;
        const accuracy = position.coords.accuracy;
        const currentLocation: SearchLocation = {
          name: "Your current location",
          lat: position.coords.latitude,
          lon: position.coords.longitude,
          accuracy,
        };
        const notice = accuracy > 1_000
          ? `Your location is approximate (GPS accuracy about ${(accuracy / 1000).toFixed(1)} km); nearby results may be less precise.`
          : "";
        setLocating(false);
        void findClinicsAt(currentLocation, radiusKm, notice);
      },
      (error) => {
        if (request !== requestId.current) return;
        setLocationError(geolocationError(error));
        setLocating(false);
      },
      GEOLOCATION_OPTIONS,
    );
  }

  function changeRadius(value: string) {
    const radius = Number(value) as SearchRadiusKm;
    if (!RADII.includes(radius)) return;
    setRadiusKm(radius);
    if (location) void findClinicsAt(location, radius);
  }

  function retrySearch() {
    if (location) void findClinicsAt(location, radiusKm);
  }

  function selectClinic(clinic: Clinic) {
    setSelectedClinicId(`${clinic.osmType}:${clinic.osmId}`);
  }

  const busy = geocoding || locating || searching;

  return (
    <div className="clinics-page">
      <div className="page-title-row clinics-title-row">
        <div>
          <span className="eyebrow">CARE NEARBY</span>
          <h1>Find Nearby Clinics</h1>
          <p>Explore OpenStreetMap healthcare listings around a place or your current location.</p>
        </div>
      </div>

      <section aria-label="Search for nearby clinics" className="clinic-search-panel">
        <form className="clinic-search-form" onSubmit={submitLocation}>
          <label className="clinic-search-label" htmlFor="clinic-location">Search by village, town, city, PIN code, or address</label>
          <div className="clinic-search-row">
            <div className="clinic-location-input">
              <Search aria-hidden="true" size={17} />
              <input
                autoComplete="off"
                disabled={busy}
                id="clinic-location"
                onChange={(event) => setQuery(event.target.value)}
                placeholder="e.g. Madanapalle, Andhra Pradesh"
                value={query}
              />
              <button aria-label="Search location" className="clinic-submit-button" disabled={busy} type="submit"><Search size={17} /></button>
            </div>
            <button className="current-location-button" disabled={busy} onClick={useCurrentLocation} type="button">
              {locating ? <LoaderCircle className="loading-spinner" size={17} /> : <LocateFixed size={17} />}
              Use My Current Location
            </button>
          </div>
          <div className="clinic-search-options">
            <label htmlFor="clinic-radius">Search radius</label>
            <select disabled={geocoding || locating} id="clinic-radius" onChange={(event) => changeRadius(event.target.value)} value={radiusKm}>
              {RADII.map((radius) => <option key={radius} value={radius}>{radius} km</option>)}
            </select>
            <span>Distances are straight-line estimates, not driving distances.</span>
          </div>
        </form>

        {locationError && <p aria-live="assertive" className="clinic-message clinic-error"><AlertCircle size={16} />{locationError}</p>}
        {locationNotice && <p aria-live="polite" className="clinic-message clinic-notice"><MapPin size={16} />{locationNotice}</p>}
        {candidates.length > 0 && (
          <div aria-label="Choose a matching location" className="clinic-candidate-list" role="group">
            <strong>Several places match. Choose the correct location:</strong>
            {candidates.map((candidate) => (
              <button key={candidate.id} onClick={() => chooseCandidate(candidate)} type="button">
                <MapPin aria-hidden="true" size={16} /><span>{candidate.name}</span><ArrowUpRight aria-hidden="true" size={15} />
              </button>
            ))}
          </div>
        )}
        <p className="clinic-privacy-note">Your search location or coordinates are sent to OpenStreetMap services to find places. They may receive request metadata such as your IP address. No child or guardian information is sent, and precise GPS coordinates are not saved.</p>
      </section>

      {location ? (
        <>
          <div className="clinic-results-heading">
            <div>
              <span className="eyebrow">SEARCH AREA · {radiusKm} KM</span>
              <h2><MapPinned aria-hidden="true" size={19} />{location.name}</h2>
              <p>{location.lat.toFixed(5)}, {location.lon.toFixed(5)}{location.accuracy ? ` · GPS accuracy about ${Math.round(location.accuracy)} m` : ""}</p>
            </div>
            <span className="clinic-result-count">{searching ? "Searching…" : `${clinics.length} ${clinics.length === 1 ? "facility" : "facilities"}`}</span>
          </div>

          <div className="clinic-results-layout">
            <section aria-label="Map of nearby clinics" className="clinic-map-card">
              <ClinicMap clinics={clinics} location={location} onSelectClinic={selectClinic} selectedClinicId={selectedClinicId} />
            </section>
            <section aria-label="Nearby clinic results" className="clinic-list">
              {searching ? (
                <div className="clinic-state-card" role="status"><LoaderCircle className="loading-spinner" size={24} /><h3>Looking nearby</h3><p>Checking OpenStreetMap for healthcare facilities.</p></div>
              ) : clinicError ? (
                <div className="clinic-state-card clinic-state-error" role="alert"><AlertCircle size={25} /><h3>Could not load clinics</h3><p>{clinicError}</p><button className="text-link" onClick={retrySearch} type="button">Retry search</button></div>
              ) : clinics.length === 0 ? (
                <div className="clinic-state-card"><MapPin size={25} /><h3>No facilities found</h3><p>No mapped healthcare facilities were found within {radiusKm} km. Try a wider radius or another nearby location.</p></div>
              ) : clinics.map((clinic) => {
                const id = `${clinic.osmType}:${clinic.osmId}`;
                return (
                  <article className={`clinic-card${selectedClinicId === id ? " clinic-card-selected" : ""}`} key={id}>
                    <div className="clinic-card-heading">
                      <span className="clinic-card-icon"><MapPin aria-hidden="true" size={17} /></span>
                      <div><h3>{clinic.name}</h3><span>{clinic.facilityType}</span></div>
                      <strong className="clinic-distance">{formatDistance(clinic.distanceKm)}</strong>
                    </div>
                    {clinic.address && <p className="clinic-address">{clinic.address}</p>}
                    <div className="clinic-card-actions">
                      <button className="clinic-map-button" onClick={() => selectClinic(clinic)} type="button"><MapPinned size={15} />Show on map</button>
                      <a href={directionsUrl(clinic)} rel="noopener noreferrer" target="_blank">Get Directions <ArrowUpRight aria-hidden="true" size={14} /></a>
                    </div>
                  </article>
                );
              })}
            </section>
          </div>
          <p className="clinic-data-note">Map data © OpenStreetMap contributors. Listings may be incomplete or outdated. A listing does not confirm a facility is open or offers vaccinations. Check with the facility before travelling.</p>
        </>
      ) : (
        <div className="clinic-initial-state">
          <span className="clinic-initial-icon"><LocateFixed aria-hidden="true" size={23} /></span>
          <h2>Start with a location</h2>
          <p>Search for a place or use your current location to find mapped clinics, hospitals, doctors&apos; offices, and health centres.</p>
        </div>
      )}
    </div>
  );
}
