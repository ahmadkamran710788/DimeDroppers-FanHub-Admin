export const config = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL,
  // Server-only: read exclusively in Route Handlers. Without a NEXT_PUBLIC_ prefix
  // it is undefined in the browser bundle, so the key never reaches the client.
  fanhubApiKey: process.env.FANHUB_API_KEY,
};
