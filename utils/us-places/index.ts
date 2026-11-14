import { lookup, lookupByState } from "zipcodes";

// US cities and ZIP codes from the `zipcodes` package (BSD, the US postal ZIP list): about 5 MB of data, so it
// is only imported by the /api/us-places route handlers, never by a component. Each ZIP code carries its
// postal city, the name used in store addresses ("Katy", not the Houston area it sits in).

export interface ZipPlace {
  zip: string;
  city: string;
  // Two-letter code, e.g. "FL".
  state: string;
}

// The list writes "Mckinney" and "Mcallen" in postal style; the places spell them "McKinney" and "McAllen".
const cityName = (name: string) => name.trim().replace(/\bMc([a-z])/g, (_, letter: string) => `Mc${letter.toUpperCase()}`);

// Every city with a ZIP code in the state, once each, A to Z. [] for an unknown state.
export function citiesOf(state: string): string[] {
  const names = new Set<string>();
  for (const code of lookupByState(state.toUpperCase())) {
    if (code.country === "US" && code.city) names.add(cityName(code.city));
  }
  return [...names].sort((a, b) => a.localeCompare(b));
}

// The city and state of a 5-digit ZIP code; null when the list doesn't have it.
export function placeOfZip(zip: string): ZipPlace | null {
  const code = lookup(zip);
  if (!code || code.country !== "US") return null;
  return { zip: code.zip, city: cityName(code.city), state: code.state };
}
