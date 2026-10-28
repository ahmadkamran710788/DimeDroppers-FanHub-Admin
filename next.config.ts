import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Required for the `unauthorized()` API used by utils/api-request on 401 responses.
    authInterrupts: true,
  },
  // Find Organizations and Campaign Planner became tabs of the Sponsorships page; old links still land.
  async redirects() {
    return [
      { source: "/sponsor/find-organizations", destination: "/sponsor/sponsorships?tab=find", permanent: false },
      { source: "/sponsor/campaign-planner", destination: "/sponsor/sponsorships?tab=planner", permanent: false },
    ];
  },
  async headers() {
    return [
      {
        // The photobooth image cache's service worker (utils/photobooth-image-cache): never cached, so an
        // update reaches browsers on the next visit.
        source: "/photobooth-sw.js",
        headers: [
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
        ],
      },
    ];
  },
};

export default nextConfig;
