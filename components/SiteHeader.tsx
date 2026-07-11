"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * Single source of truth for the STRUCTURA header + breadcrumb bar.
 * Rendered once (via IframePage) outside every subpage iframe, so Home,
 * Design Studio, PM Office, QS Office, Architecture, and Academy all get
 * a pixel-identical header — only the active nav item / breadcrumb differ,
 * and both are derived automatically from the current route.
 */

type NavItem = {
  id: string;
  href: string;
  label: string;
};

/** One extra breadcrumb segment beyond the active nav item (e.g. a software
 * or topic name on a deeper page). The last crumb in the trail is always
 * rendered as the current page, regardless of whether it has an `href`. */
export type BreadcrumbCrumb = {
  label: string;
  href?: string;
};

const NAV_ITEMS: NavItem[] = [
  { id: "home", href: "/", label: "Home" },
  { id: "design-studio", href: "/design-studio", label: "Design Studio" },
  { id: "pm-office", href: "/pm-office", label: "PM Office" },
  { id: "qs-office", href: "/qs-office", label: "QS Office" },
  { id: "architecture", href: "/architecture", label: "Architecture" },
  { id: "academy", href: "/academy", label: "Academy" },
  { id: "tutorials", href: "/tutorials", label: "Video Tutorials" },
];

function isActiveNavItem(item: NavItem, pathname: string) {
  if (item.href === "/") return pathname === "/";
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

function buildBreadcrumbTrail(
  activeItem: NavItem,
  extra?: BreadcrumbCrumb[],
): BreadcrumbCrumb[] {
  if (activeItem.id === "home" && (!extra || extra.length === 0)) {
    return [{ label: "Home" }];
  }
  const trail: BreadcrumbCrumb[] = [{ label: "Home", href: "/" }];
  if (extra && extra.length > 0) {
    trail.push({ label: activeItem.label, href: activeItem.href });
    trail.push(...extra);
  } else {
    trail.push({ label: activeItem.label });
  }
  return trail;
}

type SiteHeaderProps = {
  /** Extra breadcrumb segments for pages nested below a top-level nav item
   * (e.g. Home > Video Tutorials > TSD). Omit for top-level pages. */
  breadcrumbExtra?: BreadcrumbCrumb[];
};

export default function SiteHeader({ breadcrumbExtra }: SiteHeaderProps = {}) {
  const pathname = usePathname();
  const activeItem =
    NAV_ITEMS.find((item) => isActiveNavItem(item, pathname)) ?? NAV_ITEMS[0];
  const breadcrumbTrail = buildBreadcrumbTrail(activeItem, breadcrumbExtra);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="structura-header">
      <header className="site-header">
        <div className="container header-inner">
          <Link className="logo" href="/" aria-label="STRUCTURA — home">
            <svg
              className="logo-icon"
              viewBox="0 0 34 34"
              fill="none"
              aria-hidden="true"
            >
              <rect x="0" y="11.5" width="9" height="3" rx=".5" fill="#0071BC" />
              <rect x="12.5" y="11.5" width="9" height="3" rx=".5" fill="#0071BC" />
              <rect x="25" y="11.5" width="9" height="3" rx=".5" fill="#0071BC" />
              <rect x="0" y="19.5" width="9" height="3" rx=".5" fill="#0071BC" />
              <rect x="12.5" y="19.5" width="9" height="3" rx=".5" fill="#0071BC" />
              <rect x="25" y="19.5" width="9" height="3" rx=".5" fill="#0071BC" />
              <rect x="11.5" y="0" width="3" height="9" rx=".5" fill="#005A96" />
              <rect x="11.5" y="12.5" width="3" height="9" rx=".5" fill="#005A96" />
              <rect x="11.5" y="25" width="3" height="9" rx=".5" fill="#005A96" />
              <rect x="19.5" y="0" width="3" height="9" rx=".5" fill="#005A96" />
              <rect x="19.5" y="12.5" width="3" height="9" rx=".5" fill="#005A96" />
              <rect x="19.5" y="25" width="3" height="9" rx=".5" fill="#005A96" />
            </svg>
            <div className="logo-texts">
              <span className="logo-name">STRUCTURA</span>
              <span className="logo-sub">Digital Engineering Office</span>
            </div>
          </Link>

          <nav className={`nav-main${mobileOpen ? " open" : ""}`} aria-label="Main navigation">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                className={item.id === activeItem.id ? "active" : undefined}
              >
                {item.label}
              </Link>
            ))}
            <Link className="btn-primary" href="/#beta">
              Join Beta
            </Link>
          </nav>

          <button
            type="button"
            className="menu-toggle"
            aria-label="Toggle menu"
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((open) => !open)}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </header>

      <nav className="breadcrumb" aria-label="Breadcrumb">
        <div className="container">
          <ol>
            {breadcrumbTrail.map((crumb, index) => {
              const isLast = index === breadcrumbTrail.length - 1;
              return (
                <li key={`${crumb.label}-${index}`} aria-current={isLast ? "page" : undefined}>
                  {!isLast && crumb.href ? <Link href={crumb.href}>{crumb.label}</Link> : crumb.label}
                </li>
              );
            })}
          </ol>
        </div>
      </nav>

      <style>{`
        .structura-header {
          --su-blue: #0071BC;
          --su-blue-d: #005A96;
          --su-blue-l: #E6F2FA;
          --su-white: #FFFFFF;
          --su-gray-page: #F2F2F2;
          --su-border: #D8D8D8;
          --su-text-1: #1A1A1A;
          --su-text-3: #666666;
          --su-text-4: #999999;
          --su-mono: var(--font-structura-mono), 'JetBrains Mono', monospace;
          --su-sans: var(--font-structura-sans), 'Source Sans 3', 'Helvetica Neue', sans-serif;
          font-family: var(--su-sans);
        }
        .structura-header * { box-sizing: border-box; }
        .structura-header a { text-decoration: none; color: inherit; }
        .structura-header .container { max-width: 1280px; margin: 0 auto; padding: 0 24px; }
        .structura-header .site-header {
          position: relative;
          background: var(--su-white);
          border-bottom: 1px solid var(--su-border);
        }
        .structura-header .header-inner {
          display: flex; align-items: center; justify-content: space-between; height: 68px;
        }
        .structura-header .logo { display: flex; align-items: center; gap: 12px; flex-shrink: 0; }
        .structura-header .logo-icon { width: 34px; height: 34px; flex-shrink: 0; }
        .structura-header .logo-texts { display: flex; flex-direction: column; line-height: 1.2; }
        .structura-header .logo-name {
          font-size: 17px; font-weight: 700; color: var(--su-text-1); letter-spacing: .08em;
        }
        .structura-header .logo-sub {
          font-size: 9px; font-family: var(--su-mono); color: var(--su-blue);
          letter-spacing: .14em; text-transform: uppercase; margin-top: 1px; font-weight: 500;
        }
        .structura-header .logo:hover .logo-name { color: var(--su-blue); }
        .structura-header .nav-main { display: flex; gap: 6px; align-items: center; }
        .structura-header .nav-main a {
          padding: 8px 14px; border-radius: 8px; color: var(--su-text-3);
          font-weight: 500; font-size: 14.5px; transition: .2s;
        }
        .structura-header .nav-main a:hover { background: var(--su-gray-page); color: var(--su-text-1); }
        .structura-header .nav-main a.active { color: var(--su-blue); background: var(--su-blue-l); }
        .structura-header .nav-main a.btn-primary {
          background: var(--su-blue); color: var(--su-white); padding: 10px 18px;
          border-radius: 8px; font-weight: 600; border: 1px solid transparent;
        }
        .structura-header .nav-main a.btn-primary:hover {
          background: var(--su-blue-d); color: var(--su-white);
        }
        .structura-header .breadcrumb {
          background: var(--su-gray-page); border-bottom: 1px solid var(--su-border);
          padding: 14px 0; font-size: 13.5px;
        }
        .structura-header .breadcrumb ol {
          list-style: none; display: flex; flex-wrap: wrap; gap: 8px; align-items: center;
          padding: 0; margin: 0; color: var(--su-text-4);
        }
        .structura-header .breadcrumb li + li::before { content: "›"; margin-right: 8px; color: var(--su-text-4); }
        .structura-header .breadcrumb a { color: var(--su-blue); }
        .structura-header .breadcrumb li[aria-current="page"] { color: var(--su-text-1); font-weight: 600; }
        .structura-header .menu-toggle {
          display: none; background: none; border: 0; cursor: pointer; padding: 8px;
        }
        .structura-header .menu-toggle span {
          display: block; width: 22px; height: 2px; background: var(--su-text-1); margin: 5px 0; transition: .2s;
        }
        @media (max-width: 680px) {
          .structura-header .nav-main {
            display: none; position: absolute; top: 68px; left: 0; right: 0;
            background: var(--su-white); border-bottom: 1px solid var(--su-border);
            flex-direction: column; padding: 12px; gap: 4px; z-index: 250;
          }
          .structura-header .nav-main.open { display: flex; }
          .structura-header .menu-toggle { display: block; }
        }
      `}</style>
    </div>
  );
}
