import type { Metadata } from "next";
import { StructuraEditor } from "./editor";

export const metadata: Metadata = {
  title: "Drawing Markup | STRUCTURA",
  description: "Measure, annotate, review, and export editable construction PDFs and site photographs.",
};

export default function DrawingMarkupPage() {
  return (
    <section className="structura-markup-scope h-full min-h-0" aria-label="STRUCTURA drawing markup workspace">
      <StructuraEditor />
    </section>
  );
}
