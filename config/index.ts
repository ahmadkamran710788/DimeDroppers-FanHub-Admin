export const config = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL,
  // A browser key (Maps JavaScript API + Places API (New), restricted to our sites) for the address search and
  // map pin; without it the pickers fall back to typed latitude and longitude.
  googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "",
  // The map style the draggable pin (an advanced marker) needs; Google's demo id until one is set up.
  googleMapsMapId: process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID || "DEMO_MAP_ID",
  // Stripe publishable key (pk_test_… / pk_live_…) of the backend's Stripe account, for a sponsor funding a
  // need; without it the Fund button stays off.
  stripePublishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "",
};
