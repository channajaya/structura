"use client";

import { usePathname } from "next/navigation";

export default function SiteNotice() {
  const pathname = usePathname();

  if (pathname.startsWith("/markup")) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="shrink-0 border-b border-amber-200/80 bg-amber-50 px-4 py-2 text-center text-xs leading-snug text-amber-950 sm:text-[13px]"
    >
      This website is under construction and is for educational purposes only.
    </div>
  );
}
