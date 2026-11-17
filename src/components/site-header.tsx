import Link from 'next/link';

export function BrandMark({ size = 34 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden="true"
      className="brand-mark"
    >
      <rect width="48" height="48" rx="12" fill="#0d1f33" />
      <path
        d="M24 10.5 37 37.5h-6.6l-2.2-4.9H19.8l-2.2 4.9H11L24 10.5Zm0 9.3-3.9 8.6h7.8L24 19.8Z"
        fill="#d8b25f"
      />
      <rect x="11" y="39.5" width="26" height="2.5" rx="1.25" fill="#d8b25f" opacity=".7" />
    </svg>
  );
}

export default function SiteHeader() {
  return (
    <header className="site-header">
      <div className="container header-inner">
        <Link href="/" className="brand" aria-label="Atlas REIT home">
          <BrandMark />
          <span className="brand-name">
            ATLAS <b>REIT</b>
          </span>
        </Link>

        <nav className="main-nav" aria-label="Primary">
          <Link href="/properties">Portfolio</Link>
          <Link href="/#types">Property types</Link>
          <Link href="/#how-it-works">How it works</Link>
          <Link href="/#contact">Contact</Link>
        </nav>

        <div className="header-actions">
          <Link href="/properties" className="btn btn-primary btn-sm">
            Browse units
          </Link>
          <details className="nav-mobile">
            <summary aria-label="Open menu">
              <span className="burger" aria-hidden="true" />
            </summary>
            <nav className="nav-mobile-panel" aria-label="Mobile">
              <Link href="/properties">Portfolio</Link>
              <Link href="/#types">Property types</Link>
              <Link href="/#how-it-works">How it works</Link>
              <Link href="/#contact">Contact</Link>
              <Link href="/admin/login" className="nav-staff">
                Staff login
              </Link>
            </nav>
          </details>
        </div>
      </div>
    </header>
  );
}
