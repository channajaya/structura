type VideoThumbnailProps = {
  /** Optional path/URL to a real thumbnail image. Omit for the gray placeholder. */
  thumbnail?: string;
  alt?: string;
};

/** Gray placeholder box with a play-button overlay — swap in a real
 * thumbnail via the `thumbnail` field in data/tutorials.ts once videos are
 * recorded. */
export default function VideoThumbnail({ thumbnail, alt = "" }: VideoThumbnailProps) {
  return (
    <div className="relative aspect-video w-full overflow-hidden bg-[#E8E8E8]">
      {thumbnail ? (
        // eslint-disable-next-line @next/next/no-img-element -- external/local placeholder path, size unknown ahead of time
        <img src={thumbnail} alt={alt} className="h-full w-full object-cover" />
      ) : null}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-black/55 text-white transition group-hover:bg-[#0071BC]">
          <svg viewBox="0 0 24 24" className="h-5 w-5 translate-x-[1px]" fill="currentColor">
            <path d="M8 5v14l11-7z" />
          </svg>
        </span>
      </div>
    </div>
  );
}
