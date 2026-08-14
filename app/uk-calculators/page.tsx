import type { Metadata } from "next";
import PageShell from "@/components/PageShell";
import UKCalculatorWorkspace from "./workspace";

export const metadata: Metadata = {
  title: "UK Structural Calculators",
  description:
    "A visual UK structural calculation workspace for domestic alterations, steel beams, masonry bearing, timber floors and roofs.",
};

export default function UKCalculatorsPage() {
  return (
    <PageShell>
      <UKCalculatorWorkspace />
    </PageShell>
  );
}
