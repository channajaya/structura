import type { NextConfig } from "next";
import {
  PUBLIC_LAUNCH_DESTINATION,
  TEMPORARILY_HIDDEN_ROUTE_SOURCES,
  TEMPORARY_PUBLIC_LAUNCH_MODE,
} from "./config/publicLaunch";

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
};

export default nextConfig;
