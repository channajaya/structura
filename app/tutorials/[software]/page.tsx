import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PageShell from "@/components/PageShell";
import VideoThumbnail from "@/components/VideoThumbnail";
import { getSoftwareBySlug, tutorialSoftwareList } from "@/data/tutorials";

type SoftwareTutorialsPageProps = {
  params: Promise<{ software: string }>;
};

export async function generateStaticParams() {
  return tutorialSoftwareList.map((software) => ({ software: software.slug }));
}

export async function generateMetadata({
  params,
}: SoftwareTutorialsPageProps): Promise<Metadata> {
  const { software: slug } = await params;
  const software = getSoftwareBySlug(slug);

  return {
    title: software
      ? `${software.name} Tutorials — STRUCTURA`
      : "Video Tutorials — STRUCTURA",
    description: software
      ? `Video tutorials for ${software.name} — from getting started to advanced workflows.`
      : undefined,
  };
}

export default async function SoftwareTutorialsPage({
  params,
}: SoftwareTutorialsPageProps) {
  const { software: slug } = await params;
  const software = getSoftwareBySlug(slug);

  if (!software) {
    notFound();
  }

  return (
    <PageShell breadcrumbExtra={[{ label: software.shortName }]}>
      <div
        style={{ fontFamily: "var(--font-structura-sans)" }}
        className="mx-auto max-w-[1280px] px-6 py-14"
      >
        <div className="mb-10 max-w-[640px]">
          <span
            style={{ fontFamily: "var(--font-structura-mono)" }}
            className="text-[11px] uppercase tracking-[.14em] text-[#0071BC]"
          >
            Video Tutorials
          </span>
          <h1 className="mt-3 text-[32px] font-bold leading-tight text-[#1A1A1A]">
            {software.name}
          </h1>
          <p className="mt-3 text-[15px] leading-relaxed text-[#666666]">
            {software.videos.length}{" "}
            {software.videos.length === 1 ? "tutorial" : "tutorials"} — click
            any topic to watch on YouTube.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {software.videos.map((video) => (
            <a
              key={video.id}
              href={video.youtubeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group overflow-hidden rounded-xl border border-[#D8D8D8] bg-white transition hover:-translate-y-0.5 hover:border-[#0071BC] hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)]"
            >
              <VideoThumbnail thumbnail={video.thumbnail} alt={video.title} />
              <div className="p-4">
                <h2 className="text-[15px] font-semibold leading-snug text-[#1A1A1A] group-hover:text-[#0071BC]">
                  {video.title}
                </h2>
                <span className="mt-2 inline-block text-[12px] font-medium text-[#666666]">
                  Watch on YouTube ↗
                </span>
              </div>
            </a>
          ))}
        </div>
      </div>
    </PageShell>
  );
}
