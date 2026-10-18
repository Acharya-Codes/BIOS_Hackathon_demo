// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ClinicsPage from "./ClinicsPage";
import type { Clinic, GeocodingCandidate } from "../types/clinics";
import { geocodeLocation } from "../services/geocoding";
import { searchNearbyClinics } from "../services/clinicSearch";

vi.mock("../services/geocoding", () => ({ geocodeLocation: vi.fn() }));
vi.mock("../services/clinicSearch", () => ({ searchNearbyClinics: vi.fn() }));
vi.mock("../components/ClinicMap", () => ({
  default: () => <div aria-label="Map of nearby clinics" data-testid="clinic-map" />,
}));

const place: GeocodingCandidate = {
  id: "place-1",
  name: "Madanapalle, Andhra Pradesh, India",
  lat: 13.55,
  lon: 78.5,
};

function clinic(name: string, osmId: number): Clinic {
  return {
    osmType: "node",
    osmId,
    name,
    facilityType: "Clinic",
    lat: 13.551,
    lon: 78.501,
    distanceKm: .15,
  };
}

function setGeolocation(value: Geolocation | undefined) {
  Object.defineProperty(navigator, "geolocation", { configurable: true, value });
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

beforeEach(() => {
  setGeolocation(undefined);
});

describe("ClinicsPage", () => {
  it("lets the user disambiguate geocoding results and search the selected place", async () => {
    const user = userEvent.setup();
    vi.mocked(geocodeLocation).mockResolvedValue([
      place,
      { ...place, id: "place-2", name: "Madanapalle, another district" },
    ]);
    vi.mocked(searchNearbyClinics).mockResolvedValue([clinic("Community clinic", 1)]);
    render(<ClinicsPage />);

    await user.type(screen.getByLabelText(/Search by village/), "Madanapalle");
    await user.click(screen.getByRole("button", { name: "Search location" }));
    expect(await screen.findByText("Several places match. Choose the correct location:")).toBeTruthy();
    await user.click(screen.getByRole("button", { name: /Madanapalle, another district/ }));

    expect(await screen.findByRole("heading", { name: "Community clinic" })).toBeTruthy();
    expect(searchNearbyClinics).toHaveBeenCalledWith(
      { name: "Madanapalle, another district", lat: place.lat, lon: place.lon },
      10,
    );
  });

  it("shows loading and an empty state when no clinics are returned", async () => {
    const user = userEvent.setup();
    let resolveSearch!: (clinics: Clinic[]) => void;
    vi.mocked(geocodeLocation).mockResolvedValue([place]);
    vi.mocked(searchNearbyClinics).mockReturnValue(new Promise((resolve) => { resolveSearch = resolve; }));
    render(<ClinicsPage />);

    await user.type(screen.getByLabelText(/Search by village/), "Madanapalle");
    await user.click(screen.getByRole("button", { name: "Search location" }));
    expect(await screen.findByRole("status")).toBeTruthy();
    resolveSearch([]);
    expect(await screen.findByText(/No mapped healthcare facilities were found within 10 km/)).toBeTruthy();
  });

  it("shows request errors and retries the clinic search explicitly", async () => {
    const user = userEvent.setup();
    vi.mocked(geocodeLocation).mockResolvedValue([place]);
    vi.mocked(searchNearbyClinics)
      .mockRejectedValueOnce(new Error("The clinic service is unavailable."))
      .mockResolvedValueOnce([clinic("Retry clinic", 2)]);
    render(<ClinicsPage />);

    await user.type(screen.getByLabelText(/Search by village/), "Madanapalle");
    await user.click(screen.getByRole("button", { name: "Search location" }));
    expect(await screen.findByText("The clinic service is unavailable.")).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Retry search" }));

    expect(await screen.findByRole("heading", { name: "Retry clinic" })).toBeTruthy();
    expect(searchNearbyClinics).toHaveBeenCalledTimes(2);
  });

  it("does not request GPS permission until clicked and explains denied access", async () => {
    const user = userEvent.setup();
    const getCurrentPosition = vi.fn((_success: PositionCallback, error: PositionErrorCallback) => {
      error({
        code: 1,
        message: "denied",
        PERMISSION_DENIED: 1,
        POSITION_UNAVAILABLE: 2,
        TIMEOUT: 3,
      });
    });
    setGeolocation({
      getCurrentPosition,
      watchPosition: () => 1,
      clearWatch: () => undefined,
    });
    render(<ClinicsPage />);

    expect(getCurrentPosition).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Use My Current Location" }));
    expect(await screen.findByText(/Enable location access for this site in your browser settings/)).toBeTruthy();
  });

  it("explains when geolocation is unsupported and keeps manual search available", async () => {
    const user = userEvent.setup();
    render(<ClinicsPage />);

    await user.click(screen.getByRole("button", { name: "Use My Current Location" }));

    expect(await screen.findByText(/This browser does not support GPS location/)).toBeTruthy();
    expect(screen.getByLabelText(/Search by village/).hasAttribute("disabled")).toBe(false);
  });

  it("ignores stale clinic responses after a radius change", async () => {
    const user = userEvent.setup();
    const pending: Array<(clinics: Clinic[]) => void> = [];
    vi.mocked(geocodeLocation).mockResolvedValue([place]);
    vi.mocked(searchNearbyClinics).mockImplementation(() => new Promise((resolve) => pending.push(resolve)));
    render(<ClinicsPage />);

    await user.type(screen.getByLabelText(/Search by village/), "Madanapalle");
    await user.click(screen.getByRole("button", { name: "Search location" }));
    await waitFor(() => expect(pending).toHaveLength(1));
    await user.selectOptions(screen.getByLabelText("Search radius"), "5");
    await waitFor(() => expect(pending).toHaveLength(2));

    pending[1]([clinic("Five km result", 5)]);
    expect(await screen.findByRole("heading", { name: "Five km result" })).toBeTruthy();
    pending[0]([clinic("Stale ten km result", 10)]);
    await waitFor(() => expect(screen.queryByRole("heading", { name: "Stale ten km result" })).toBeNull());
    expect(screen.getByRole("heading", { name: "Five km result" })).toBeTruthy();
  });
});
