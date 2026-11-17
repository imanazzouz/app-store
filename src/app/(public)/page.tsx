import Link from 'next/link';
import { getListingCounts, getListings, getPortfolioStats } from '@/lib/listings';
import PropertyCard from '@/components/property-card';
import { typeLabels, propertyTypes } from '@/lib/validation';

export const dynamic = 'force-dynamic';

const typeImages: Record<string, string> = {
  commercial: '/img/commercial-1.jpg',
  residential: '/img/residential-1.jpg',
  warehouse: '/img/warehouse-1.jpg',
};

export default async function HomePage() {
  const [stats, counts, featured] = await Promise.all([
    getPortfolioStats(),
    getListingCounts(),
    getListings({ availableOnly: true }),
  ]);

  const featuredSix = [...featured]
    .sort((a, b) => Number(b.featured) - Number(a.featured))
    .slice(0, 6);

  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="hero">
        <div className="hero-bg" aria-hidden="true">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/img/hero.jpg" alt="" fetchPriority="high" width={1920} height={1080} />
        </div>
        <div className="container hero-inner">
          <p className="eyebrow">A diversified rental portfolio</p>
          <h1>
            Quality spaces.
            <br />
            Long-term value.
          </h1>
          <p className="hero-lede">
            Atlas REIT owns and manages commercial, residential and industrial
            property across Algeria’s strongest markets — every unit below is
            ready to lease today.
          </p>
          <div className="hero-ctas">
            <Link href="/properties?available=1" className="btn btn-gold btn-lg">
              Browse available units
            </Link>
            <Link href="/#types" className="btn btn-ghost btn-lg">
              Explore by type
            </Link>
          </div>

          <dl className="hero-stats">
            <div>
              <dt>Units managed</dt>
              <dd>{stats.units}</dd>
            </div>
            <div>
              <dt>Cities</dt>
              <dd>{stats.cities}</dd>
            </div>
            <div>
              <dt>Currently available</dt>
              <dd>{stats.available}</dd>
            </div>
            <div>
              <dt>Occupancy</dt>
              <dd>{stats.occupancy}%</dd>
            </div>
          </dl>
        </div>
      </section>

      {/* ── Property types ───────────────────────────────────────────── */}
      <section className="section" id="types">
        <div className="container">
          <div className="section-head">
            <div>
              <p className="eyebrow dark">Property types</p>
              <h2>Three sectors, one standard of care</h2>
            </div>
            <Link href="/properties" className="link-arrow">
              View full portfolio →
            </Link>
          </div>

          <div className="type-grid">
            {propertyTypes.map((type) => (
              <Link
                key={type}
                href={`/properties?type=${type}`}
                className="type-card"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={typeImages[type]}
                  alt={`${typeLabels[type]} property`}
                  loading="lazy"
                  width={640}
                  height={420}
                />
                <div className="type-card-body">
                  <h3>{typeLabels[type]}</h3>
                  <p>
                    {counts[type] ?? 0} unit{(counts[type] ?? 0) === 1 ? '' : 's'} in
                    portfolio
                  </p>
                  <span className="link-arrow">Explore →</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Featured units ───────────────────────────────────────────── */}
      <section className="section section-alt" id="featured">
        <div className="container">
          <div className="section-head">
            <div>
              <p className="eyebrow dark">Now leasing</p>
              <h2>Available units, ready for you</h2>
            </div>
            <Link href="/properties?available=1" className="link-arrow">
              See all available →
            </Link>
          </div>

          {featuredSix.length ? (
            <div className="card-grid">
              {featuredSix.map((listing) => (
                <PropertyCard key={listing.id} listing={listing} />
              ))}
            </div>
          ) : (
            <p className="empty-note">
              No units are available right now — check back soon.
            </p>
          )}
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────────── */}
      <section className="section" id="how-it-works">
        <div className="container">
          <div className="section-head center">
            <div>
              <p className="eyebrow dark">How it works</p>
              <h2>From first look to signed lease</h2>
            </div>
          </div>

          <ol className="steps">
            <li>
              <span className="step-num">1</span>
              <h3>Browse the portfolio</h3>
              <p>
                Filter by commercial, residential or warehouse, and open any
                unit for photos, specs and pricing.
              </p>
            </li>
            <li>
              <span className="step-num">2</span>
              <h3>Send a short enquiry</h3>
              <p>
                Name, email and a note — that’s it. No documents to upload at
                this stage.
              </p>
            </li>
            <li>
              <span className="step-num">3</span>
              <h3>We follow up personally</h3>
              <p>
                Our leasing team reviews your enquiry and replies by email with
                the full application pack and next steps.
              </p>
            </li>
          </ol>
        </div>
      </section>

      {/* ── Closing CTA ──────────────────────────────────────────────── */}
      <section className="cta-band">
        <div className="container cta-inner">
          <div>
            <h2>Found a unit you like?</h2>
            <p>Send an enquiry in under a minute — we take it from there.</p>
          </div>
          <Link href="/properties" className="btn btn-gold btn-lg">
            Browse the portfolio
          </Link>
        </div>
      </section>
    </>
  );
}
