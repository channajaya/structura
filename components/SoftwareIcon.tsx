type SoftwareIconProps = {
  /** Optional path/URL to a real logo image. Omit for the placeholder mark. */
  icon?: string;
  alt?: string;
};

/** Logo placeholder for a software card — swap in a real image via the
 * `icon` field in data/tutorials.ts once logos are available. */
export default function SoftwareIcon({ icon, alt = "" }: SoftwareIconProps) {
  if (icon) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- external/local placeholder path, size unknown ahead of time
      <img src={icon} alt={alt} className="h-14 w-14 rounded-lg object-contain" />
    );
  }

  return (
    <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-[#E6F2FA] text-[#0071BC]">
      <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth={1.75}>
        <rect x="3" y="4" width="18" height="14" rx="2" />
        <path d="M8 20h8M12 18v2" strokeLinecap="round" />
      </svg>
    </div>
  );
}
