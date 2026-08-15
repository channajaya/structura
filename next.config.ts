import type { NextConfig } from "next";
import {
  PUBLIC_LAUNCH_DESTINATION,
  TEMPORARILY_HIDDEN_ROUTE_SOURCES,
  TEMPORARY_PUBLIC_LAUNCH_MODE,
} from "./config/publicLaunch";

const pmOfficeOrigin = process.env.PM_OFFICE_ORIGIN?.replace(/\/$/, "");

const nextConfig: NextConfig = {
  async redirects() {
    if (!TEMPORARY_PUBLIC_LAUNCH_MODE) {
      return [];
    }

    return TEMPORARILY_HIDDEN_ROUTE_SOURCES.map((source) => ({
      source,
      destination: PUBLIC_LAUNCH_DESTINATION,
      permanent: false,
    }));
  },
  async rewrites() {
    if (!pmOfficeOrigin) {
      return [];
    }

    return [
      { source: "/pmo", destination: `${pmOfficeOrigin}/pmo` },
      { source: "/pmo/:path*", destination: `${pmOfficeOrigin}/pmo/:path*` },
    ];
  },
};

export default nextConfig;
