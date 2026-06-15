import type { NextConfig } from "next";

// This app is RETIRED. The canonical structured execution-gate demo now lives
// at https://zorelan.com/demo. Redirect all traffic there permanently (308).
const CANONICAL_DEMO = "https://zorelan.com/demo";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/:path*",
        destination: CANONICAL_DEMO,
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
