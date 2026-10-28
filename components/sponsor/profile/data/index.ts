import { US_STATE_OPTIONS } from "@/components/organization/org-form/form";
import { SPONSOR_PROFILE } from "@/components/sponsor/data";

// Mock data for Sponsor Profile until the sponsor API is integrated.

export interface ProfileLogo {
  name: string;
  // Format and size, e.g. "SVG · 24 KB".
  spec: string;
  // Object URL of an uploaded file. The mock logo has none and is drawn instead.
  url?: string;
}

export interface ProfileDetails {
  name: string;
  category: string;
  logo: ProfileLogo | null;
}

export const PROFILE_DETAILS: ProfileDetails = {
  name: SPONSOR_PROFILE.name,
  category: "Local Businesses & Community Partners",
  logo: { name: "northpeak-logo.svg", spec: "SVG · 24 KB" },
};

export interface SponsorLocation {
  id: string;
  name: string;
  street: string;
  city: string;
  // Two-letter code, e.g. "WI".
  state: string;
  zip: string;
}

export type LocationForm = Omit<SponsorLocation, "id">;

export const EMPTY_LOCATION: LocationForm = { name: "", street: "", city: "", state: "", zip: "" };

// The first location is the primary one.
export const LOCATIONS: SponsorLocation[] = [
  { id: "hq", name: "Northpeak headquarters", street: "410 Lakeshore Dr", city: "Twin Lakes", state: "WI", zip: "53181" },
  { id: "kenosha", name: "Kenosha office", street: "2200 52nd St", city: "Kenosha", state: "WI", zip: "53140" },
  { id: "lake-geneva", name: "Lake Geneva service center", street: "125 Broad St", city: "Lake Geneva", state: "WI", zip: "53147" },
];

// "410 Lakeshore Dr, Twin Lakes, WI 53181".
export const formatAddress = (l: LocationForm) => `${l.street}, ${l.city}, ${l.state} ${l.zip}`;

// The State dropdown's options: a demo list until they come from an endpoint.
export const STATE_OPTIONS = US_STATE_OPTIONS;
