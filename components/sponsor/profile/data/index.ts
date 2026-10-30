import { US_STATE_OPTIONS } from "@/components/organization/org-form/form";
import type { SponsorLocation, SponsorLocationFetchStatus } from "@/utils/types/sponsor-profile";

// Sponsor Profile: GET /fanhub/sponsor-profile, reloaded while the store lookup runs.

// The automatic store lookup runs about 10 s for a local business and up to a minute for a national brand;
// the profile is reloaded every 5 s meanwhile, for 5 minutes at most (then the list is shown as it is).
export const POLL_MS = 5_000;
export const POLL_LIMIT_MS = 5 * 60_000;

export const isLookupActive = (status: SponsorLocationFetchStatus | null | undefined) =>
  status === "PENDING" || status === "RUNNING" || status === "SAVING";

// A national brand can have hundreds of locations: they're shown this many a page, as on My Sponsorships.
export const PAGE_SIZE = 10;

// The logo's file, without the signature: the link is signed again on every GET while the file is the same.
export const logoPath = (url: string | null | undefined) => url?.split("?")[0] ?? null;

export interface ProfileLogo {
  name: string;
  // Format, and the size of a newly picked file, e.g. "SVG · 24 KB".
  spec: string;
  // The signed link, or an object URL of a newly picked file.
  url: string;
}

// The saved logo's format from its file name: a PNG ends in ".png", an SVG in ".svg+xml" (its type's subtype,
// URL-encoded in the link as "%2B").
const logoFormat = (url: string) => {
  const extension = (logoPath(url) ?? "").replace(/%2B/gi, "+").split(".").pop()?.toLowerCase() ?? "";
  return extension.startsWith("svg") ? "SVG" : extension.toUpperCase();
};

// The saved logo, as the logo row shows it.
export const savedLogo = (url: string): ProfileLogo => ({
  name: "Your logo",
  spec: logoFormat(url),
  url,
});

// The location form's fields, all text ("" = not given).
export interface LocationFields {
  name: string;
  street: string;
  city: string;
  // Two-letter code, e.g. "WI".
  state: string;
  zip: string;
  // The pin, e.g. "45.669817" and "-122.663238"; both or neither.
  latitude: string;
  longitude: string;
}

export const EMPTY_LOCATION: LocationFields = {
  name: "",
  street: "",
  city: "",
  state: "",
  zip: "",
  latitude: "",
  longitude: "",
};

// A saved coordinate as the form shows it: 6 decimals (about 10 cm), so 45.66981699999999 reads 45.669817.
export const coordinateText = (n: number | null) => (n === null ? "" : String(Number(n.toFixed(6))));

export const locationFields = (l: SponsorLocation): LocationFields => ({
  name: l.name ?? "",
  street: l.address ?? "",
  city: l.city ?? "",
  state: l.state ?? "",
  zip: l.zipCode ?? "",
  latitude: coordinateText(l.latitude),
  longitude: coordinateText(l.longitude),
});

// The locations API's field names → the form's, to put an error under the right field.
export const LOCATION_FIELDS: Record<string, keyof LocationFields> = {
  name: "name",
  address: "street",
  city: "city",
  state: "state",
  zipCode: "zip",
  latitude: "latitude",
  longitude: "longitude",
};

// "900 E 11th St, Austin, TX, 78702" from the parts that are set; "" for a location that is only a pin.
export const formatAddress = (l: Pick<SponsorLocation, "address" | "city" | "state" | "zipCode">) =>
  [l.address, l.city, l.state, l.zipCode].filter(Boolean).join(", ");

// What a location is called: its name, else its address, else its pin.
export const locationLabel = (location: SponsorLocation) =>
  location.name ||
  formatAddress(location) ||
  (location.latitude !== null && location.longitude !== null
    ? `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`
    : "Location");

// The State dropdown's options.
export const STATE_OPTIONS = US_STATE_OPTIONS;
