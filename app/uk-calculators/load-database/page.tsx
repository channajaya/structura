import type { Metadata } from "next";
import PageShell from "@/components/PageShell";
import LoadLibrary from "./load-library";

export const metadata: Metadata = {
  title: "UK Load Database | Structural Load Builder",
  description:
    "Search 100 transparent UK structural load assemblies with layer-by-layer dead loads and UK National Annex imposed actions.",
  openGraph: {
    title: "Structura UK Load Library",
    description: "100 visual UK load build-ups with traceable component calculations.",
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
