import type { Metadata } from "next";
import PageShell from "@/components/PageShell";
import LoadLibrary from "./load-library";

export const metadata: Metadata = {
  title: "UK Load Database | Structural Load Builder",
  description:
    "Search, inspect, copy and adapt transparent UK domestic structural load presets for roofs, floors, walls, ceilings and openings.",
  openGraph: {
    title: "Structura UK Load Library",
    description: "Build the load. See the evidence.",
    images: [{ url: "/uk-load-library-og.png", width: 1731, height: 909, alt: "Structura UK Load Library technical load path" }],
  },
};

export default function LoadDatabasePage() {
  return (
    <PageShell>
      <LoadLibrary />
    </PageShell>
  );
}
