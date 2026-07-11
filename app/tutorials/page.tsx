import Link from "next/link";
import type { Metadata } from "next";
import PageShell from "@/components/PageShell";
import SoftwareIcon from "@/components/SoftwareIcon";
import { tutorialSoftwareList } from "@/data/tutorials";

export const metadata: Metadata = {
  title: "Video Tutorials — STRUCTURA",
  description:
    "Step-by-step video tutorials for the software structural and civil engineers use every day.",
};

export default function TutorialsPage() {
  return (
    <PageShell>
      <div
        style={{ fontFamily: "var(--font-structura-sans)" }}
        className="mx-auto max-w-[1280px] px-6 py-14"
      >
        <div className="mb-10 max-w-[640px]">
          <span
            style={{ fontFamily: "var(--font-structura-mono)" }}
            className="text-[11px] uppercase tracking-[.14em] text-[#0071BC]"
          >
            Structura Academy
          </span>
          <h1 className="mt-3 text-[34px] font-bold leading-tight text-[#1A1A1A]">
            Video Tutorials
          </h1>
          <p className="mt-3 text-[15px] leading-relaxed text-[#666666]">
            Pick a piece of software below to browse short, focused
            walkthroughs — from getting started to advanced structural
            engineering workflows.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {tutorialSoftwareList.map((software) => (
            <Link
              key={software.slug}
              href={`/tutorials/${software.slug}`}
              className="group flex flex-col gap-4 rounded-xl border border-[#D8D8D8] bg-white p-6 transition hover:-translate-y-0.5 hover:border-[#0071BC] hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)]"
            >
              <SoftwareIcon icon={software.icon} alt={`${software.name} logo`} />
              <div>
                <h2 className="text-[16px] font-semibold text-[#1A1A1A] group-hover:text-[#0071BC]">
                  {software.name}
                </h2>
                <p className="mt-1 text-[13px] text-[#666666]">
                  {software.videos.length}{" "}
                  {software.videos.length === 1 ? "tutorial" : "tutorials"}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </PageShell>
  );
}
