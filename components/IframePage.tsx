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
 */
export default function IframePage({ src, title }: IframePageProps) {
  return (
    <div className="flex h-full w-full flex-col">
      <SiteHeader />
      <iframe src={src} title={title} className="block min-h-0 flex-1 w-full border-0" />
    </div>
  );
}
