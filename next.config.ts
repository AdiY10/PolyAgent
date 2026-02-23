import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Ensure data/bets.json is included in the Vercel deployment bundle
  // so the sync API route can read it with fs.readFileSync at runtime.
  outputFileTracingIncludes: {
    "/api/admin/sync-bets": ["./data/bets.json"],
  },
};

export default nextConfig;
