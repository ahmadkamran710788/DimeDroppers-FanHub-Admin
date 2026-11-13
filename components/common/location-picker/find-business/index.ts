// Finding the business behind a picked place, for its type (the sponsor's category). Google returns a plain
// address ("406 S Walton Blvd", type Building) as an address even when a business is there, and one building
// can hold several (a Walmart with a bank, a salon and a pizza place inside). So for an address, the business
// is looked up by the sponsor's name at that address, and otherwise the businesses there are offered to pick.
// Both searches ask for Pro fields (displayName, primaryTypeDisplayName): Text Search Pro / Nearby Search Pro.

export interface FoundBusiness {
  id: string;
  name: string;
  // Google's name for its type, e.g. "Department Store".
  type: string;
}

// A business found by name has to be at the picked address, not a branch elsewhere.
const MATCH_RADIUS_M = 100;
// The businesses offered for an address: in or right by its building, most visited first.
const NEARBY_RADIUS_M = 50;
const NEARBY_MAX = 5;
const SEARCH_FIELDS = ["id", "displayName", "types", "primaryTypeDisplayName", "location"];
// Places at an address that aren't a sponsor's business: transit, parking, homes and rentals, parks, ATMs.
// A primary type, so a hotel (primary type "hotel", also tagged "lodging") is still offered.
const NOT_A_BUSINESS = [
  "bus_stop",
  "bus_station",
  "transit_station",
  "transit_depot",
  "train_station",
  "subway_station",
  "light_rail_station",
  "park_and_ride",
  "taxi_stand",
  "parking",
  "parking_lot",
  "parking_garage",
  "apartment_complex",
  "apartment_building",
  "condominium_complex",
  "housing_complex",
  "lodging",
  "private_guest_room",
  "atm",
  "electric_vehicle_charging_station",
  "playground",
  "park",
];

// Words too common in business names to tell two apart.
const COMMON_WORDS = new Set(["the", "and", "inc", "llc", "ltd", "co", "corp", "company", "store", "shop", "of"]);

// Google's name for a business's type. An address (a street address, a building) isn't an establishment.
export function businessTypeOf(place: google.maps.places.Place) {
  if (!place.types?.includes("establishment")) return null;
  return place.primaryTypeDisplayName?.trim() || null;
}

function businessOf(place: google.maps.places.Place): FoundBusiness | null {
  const type = businessTypeOf(place);
  return type ? { id: place.id, name: place.displayName ?? type, type } : null;
}

function wordsOf(name: string) {
  return name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9\s]/g, "")
    .split(/\s+/)
    .filter((w) => w.length >= 2 && !COMMON_WORDS.has(w));
}

// "Walmart" and "Walmart Supercenter" are the same business; "Acme" and "Walmart Supercenter" aren't.
export function sameBusiness(a: string, b: string) {
  const other = new Set(wordsOf(b));
  return wordsOf(a).some((w) => other.has(w));
}

function metresBetween(a: google.maps.LatLngLiteral, b: google.maps.LatLngLiteral) {
  const rad = (deg: number) => (deg * Math.PI) / 180;
  const h =
    Math.sin(rad(b.lat - a.lat) / 2) ** 2 +
    Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(rad(b.lng - a.lng) / 2) ** 2;
  return 2 * 6371000 * Math.asin(Math.sqrt(h));
}

// The business named `name` at the address, or null when Google has none by that name right there.
export async function findBusinessByName(
  places: google.maps.PlacesLibrary,
  name: string,
  address: string,
  point: google.maps.LatLngLiteral
): Promise<FoundBusiness | null> {
  const { places: found } = await places.Place.searchByText({
    textQuery: `${name} ${address}`,
    fields: SEARCH_FIELDS,
    locationBias: { center: point, radius: MATCH_RADIUS_M * 2 },
    maxResultCount: 3,
  });
  for (const place of found) {
    const business = businessOf(place);
    const at = place.location ? { lat: place.location.lat(), lng: place.location.lng() } : null;
    if (business && at && metresBetween(point, at) <= MATCH_RADIUS_M && sameBusiness(name, business.name)) {
      return business;
    }
  }
  return null;
}

// The businesses at the address, most visited first.
export async function businessesAt(
  places: google.maps.PlacesLibrary,
  point: google.maps.LatLngLiteral
): Promise<FoundBusiness[]> {
  const { places: found } = await places.Place.searchNearby({
    fields: SEARCH_FIELDS,
    locationRestriction: { center: point, radius: NEARBY_RADIUS_M },
    excludedPrimaryTypes: NOT_A_BUSINESS,
    maxResultCount: NEARBY_MAX,
    rankPreference: places.SearchNearbyRankPreference.POPULARITY,
  });
  return found.flatMap((place) => businessOf(place) ?? []);
}
