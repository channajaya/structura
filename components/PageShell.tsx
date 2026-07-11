import SiteHeader, { type BreadcrumbCrumb } from "@/components/SiteHeader";

type PageShellProps = {
  children: React.ReactNode;
  breadcrumbExtra?: BreadcrumbCrumb[];
};

/**
 * Wraps a real (non-iframe) React page with the shared SiteHeader, matching
 * the flex layout IframePage uses for the iframe-embedded subpages: header
 * up top, content scrolling independently beneath it.
 */
export default function PageShell({ children, breadcrumbExtra }: PageShellProps) {
  return (
    <div className="flex h-full w-full flex-col">
      <SiteHeader breadcrumbExtra={breadcrumbExtra} />
      <div className="min-h-0 flex-1 overflow-y-auto bg-white">{children}</div>
    </div>
  );
}
