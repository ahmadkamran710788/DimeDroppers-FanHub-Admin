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
}

export const EMPTY_LOCATION: LocationFields = { name: "", street: "", city: "", state: "", zip: "" };

export const locationFields = (l: SponsorLocation): LocationFields => ({
  name: l.name ?? "",
  street: l.address ?? "",
  city: l.city ?? "",
  state: l.state ?? "",
  zip: l.zipCode ?? "",
});

// The locations API's field names → the form's, to put an error under the right field. A pin can't be
// placed by hand here, so its errors go under the street.
export const LOCATION_FIELDS: Record<string, keyof LocationFields> = {
  name: "name",
  address: "street",
  city: "city",
  state: "state",
  zipCode: "zip",
  latitude: "street",
  longitude: "street",
};

// "900 E 11th St, Austin, TX, 78702" from the parts that are set; "" for a location that is only a pin.
export const formatAddress = (l: Pick<SponsorLocation, "address" | "city" | "state" | "zipCode">) =>
  [l.address, l.city, l.state, l.zipCode].filter(Boolean).join(", ");

// The State dropdown's options.
export const STATE_OPTIONS = US_STATE_OPTIONS;
