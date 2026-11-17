import Link from 'next/link';
import { getListingCounts, getListings } from '@/lib/listings';
import { propertyTypes, type PropertyType } from '@/lib/validation';
import FilterBar from '@/components/filter-bar';
import PropertyCard from '@/components/property-card';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Property portfolio',
  description:
    'Browse Atlas REIT’s commercial, residential and warehouse units — filter by type and availability.',
};

type Props = { searchParams: Promise<{ type?: string; available?: string }> };

function parseType(value: string | undefined): PropertyType | undefined {
  return propertyTypes.includes(value as PropertyType)
    ? (value as PropertyType)
    : undefined;
}

export default async function PropertiesPage({ searchParams }: Props) {
  const params = await searchParams;
  const type = parseType(params.type);
  const availableOnly = params.available === '1';

  const [counts, listings] = await Promise.all([
    getListingCounts(),
    getListings({ type, availableOnly }),
  ]);

  const heading = type
    ? `${type.charAt(0).toUpperCase()}${type.slice(1)} properties`
    : availableOnly
      ? 'Available units'
      : 'Full portfolio';

  return (
    <div className="page">
      <section className="page-head">
        <div className="container">
          <nav className="breadcrumbs" aria-label="Breadcrumb">
            <Link href="/">Home</Link>
            <span aria-hidden="true">/</span>
            <span aria-current="page">Portfolio</span>
          </nav>
          <div className="page-title-row">
            <div>
              <p className="eyebrow dark">Portfolio</p>
              <h1>{heading}</h1>
              <p className="page-sub">
                {listings.length} unit{listings.length === 1 ? '' : 's'}
                {availableOnly ? ' available now' : ''} · updated daily by our
                leasing team.
              </p>
            </div>
          </div>

          <FilterBar counts={counts} active={type ?? 'all'} availableOnly={availableOnly} />
        </div>
      </section>

      <section className="section">
        <div className="container">
          {listings.length ? (
            <div className="card-grid">
              {listings.map((listing) => (
                <PropertyCard key={listing.id} listing={listing} />
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <h2>No units match this filter</h2>
              <p>
                Try another property type, or turn off “Available only” to see
                recently leased units too.
              </p>
              <Link href="/properties" className="btn btn-primary">
                Reset filters
              </Link>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
