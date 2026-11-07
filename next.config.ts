import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Avoid blocking RSC/navigation when Unsplash/CDN is slow or unreachable
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
  async redirects() {
    return [
      {
        source: "/dashboard/admin/calendar",
        destination: "/dashboard/admin/schedule",
        permanent: false,
      },
      {
        source: "/dashboard/admin/overview",
        destination: "/dashboard/admin",
        permanent: false,
      },
      // Do NOT redirect /dashboard/nurse/duties — real duties board lives there
      {
        source: "/dashboard/nurse/leave",
        destination: "/dashboard/nurse/hr",
        permanent: false,
      },
      {
        source: "/dashboard/nurse/care-notes",
        destination: "/dashboard/nurse/notes",
        permanent: false,
      },
      {
        source: "/dashboard/family/live-care",
        destination: "/dashboard/family/live",
        permanent: false,
      },
      {
        source: "/api/scheduling",
        destination: "/api/schedule",
        permanent: false,
      },
      {
        source: "/api/scheduling/:path*",
        destination: "/api/schedule",
        permanent: false,
      },
    ];
  },
  // Prevent JSON DB / upload writes from triggering full page Fast Refresh in webpack mode
  webpack: (config, { dev }) => {
    if (dev) {
      config.watchOptions = {
        ...(config.watchOptions || {}),
        ignored: [
          "**/node_modules/**",
          "**/data/**",
          "**/.data/**",
          "**/public/uploads/**",
        ],
      };
    }
    return config;
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;