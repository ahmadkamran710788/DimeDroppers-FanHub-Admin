export const config = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL,
  // A browser key (Maps JavaScript API + Places API (New), restricted to our sites) for the address search and
  // map pin; without it the pickers fall back to typed latitude and longitude.
  googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "",
  // The map style the draggable pin (an advanced marker) needs; Google's demo id until one is set up.
  googleMapsMapId: process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID || "DEMO_MAP_ID",
};
