const apiUrl = process.env.NEXT_PUBLIC_API_URL;

// The API's origin (https://api.dimedroppers.com), where Socket.IO namespaces live; null without an API URL.
const apiOrigin = (() => {
  try {
    return apiUrl ? new URL(apiUrl).origin : null;
  } catch {
    return null;
  }
})();

export const config = {
  apiUrl,
  // `next dev` (not a production build): turns on hints meant for developers only.
  isDev: process.env.NODE_ENV !== "production",
  // Socket.IO server for live replies (the organiser agent's /fanhub-org namespace). Defaults to the API's origin.
  socketUrl: process.env.NEXT_PUBLIC_SOCKET_URL || apiOrigin,
  // A browser key (Maps JavaScript API + Places API (New), restricted to our sites) for the address search and
  // map pin; without it the pickers fall back to typed latitude and longitude.
  googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "",
  // The map style the draggable pin (an advanced marker) needs; Google's demo id until one is set up.
  googleMapsMapId: process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID || "DEMO_MAP_ID",
  // Stripe publishable key (pk_test_… / pk_live_…) of the backend's Stripe account, for a sponsor funding a
  // need; without it the Fund button stays off.
  stripePublishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "",
};
