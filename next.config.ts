import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // frame-ancestors is the modern, safe-to-add-blind equivalent of
          // X-Frame-Options and doesn't touch script/style loading at all.
          // A full script-src/style-src CSP is intentionally NOT included here —
          // Next.js's hydration bootstrap and the map/geocoding integrations
          // (Leaflet tiles, Nominatim, the emoji picker) would need to be verified
          // against it live before shipping, and getting it wrong could silently
          // break the map in production with no easy way to catch it pre-deploy.
          { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
        ],
      },
    ];
  },
};

export default nextConfig;
