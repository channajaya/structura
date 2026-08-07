"use client";

import { useEffect, useRef } from "react";
import SiteHeader from "@/components/SiteHeader";

type IframePageProps = {
  src: string;
  title: string;
};

/**
 * Shared wrapper for every page in the app. Renders the single SiteHeader
 * component (logo, nav, breadcrumb) once here, above the page's own iframe
 * content, so the header is guaranteed identical everywhere — updating it
 * in one place updates it on every page.
 *
 * Calculators often navigate inside the iframe while the parent route stays
 * the same. Clicking the already-active top nav item dispatches
 * `structura:reset-iframe` so we send the iframe back to this page's `src`.
 */
export default function IframePage({ src, title }: IframePageProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const resetIframe = () => {
      const frame = iframeRef.current;
      if (!frame) return;
      frame.src = src;
    };
    window.addEventListener("structura:reset-iframe", resetIframe);
    return () => {
      window.removeEventListener("structura:reset-iframe", resetIframe);
    };
  }, [src]);

  return (
    <div className="flex h-full w-full flex-col">
      <SiteHeader />
      <iframe
        ref={iframeRef}
        src={src}
        title={title}
        className="block min-h-0 flex-1 w-full border-0"
      />
    </div>
  );
}
