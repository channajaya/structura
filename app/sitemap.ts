import type { MetadataRoute } from "next";
import {
  SITE_ORIGIN,
  TEMPORARY_PUBLIC_LAUNCH_MODE,
} from "@/config/publicLaunch";
import { tutorialSoftwareList } from "@/data/tutorials";

const FULL_PUBLIC_ROUTES = [
  "",
  "/design-studio",
  "/pm-office",
  "/qs-office",
  "/architecture",
  "/academy",
  "/tutorials",
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = TEMPORARY_PUBLIC_LAUNCH_MODE
    ? [
        "/design-studio",
        "/tutorials",
        ...tutorialSoftwareList.map(
          (software) => `/tutorials/${software.slug}`,
        ),
      ]
    : FULL_PUBLIC_ROUTES;

  return routes.map((route) => ({
    url: `${SITE_ORIGIN}${route}`,
    changeFrequency: "weekly",
    priority: route === "/design-studio" ? 1 : 0.8,
  }));
}
