import type { Metadata } from "next";
import SiteHeader from "@/components/SiteHeader";
import { StructuraEditor } from "./editor";

export const metadata: Metadata = {
  title: "Drawing Markup | STRUCTURA",
  description: "Measure, annotate, review, and export editable construction PDFs and site photographs.",
};

export default function DrawingMarkupPage() {
  return (
    <div className="flex h-full min-h-0 w-full flex-col">
      <SiteHeader />
      <section className="structura-markup-scope min-h-0 flex-1" aria-label="STRUCTURA drawing markup workspace">
        <StructuraEditor />
      </section>
    </div>
  );
}
