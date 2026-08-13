/**
 * Temporary public-launch switch.
 *
 * Set this to false to restore the complete site navigation, root page,
 * route access, and sitemap without deleting any unfinished section.
 */
export const TEMPORARY_PUBLIC_LAUNCH_MODE = true;

export const PUBLIC_LAUNCH_DESTINATION = "/design-studio";

export const PUBLIC_LAUNCH_NAV_ITEM_IDS = [
  "design-studio",
  "drawing-markup",
  "material-calculators",
  "tutorials",
] as const;

/**
 * Redirect both app routes and their directly accessible legacy public HTML
 * equivalents while temporary launch mode is enabled.
 */
export const TEMPORARILY_HIDDEN_ROUTE_SOURCES = [
  "/",
  "/home/:path*",
  "/index.html",
  "/home.html",
  "/pm-office/:path*",
  "/pmOFFICE_v2.html",
  "/qs-office/:path*",
  "/qsOFFICE.html",
  "/architecture/:path*",
  "/ARCHITECTURE.HTML",
  "/academy/:path*",
  "/academy.html",
] as const;

export const SITE_ORIGIN = "https://www.structuraeng.app";
