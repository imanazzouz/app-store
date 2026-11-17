import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getListings, getListing } from '@/lib/listings';
import { typeLabels } from '@/lib/validation';
import { formatPrice } from '@/components/property-card';
import Gallery from '@/components/gallery';
import PropertyCard from '@/components/property-card';
import EnquiryForm from '@/components/enquiry-form';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props) {
  const id = Number((await params).id);
  const listing = Number.isInteger(id) ? await getListing(id) : null;
  if (!listing) return { title: 'Property not found' };
  return {
    title: `${listing.title} — ${formatPrice(listing.price)}/mo`,
    description: listing.description.slice(0, 180),
  };
}

export default async function PropertyDetailPage({ params }: Props) {
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id <= 0) notFound();

  const listing = await getListing(id);
  if (!listing) notFound();

  const leased = listing.status === 'leased';
  const related = (await getListings({ type: listing.type })).filter(
    (l) => l.id !== listing.id,
  );

  return (
    <div className="page detail-page">
      <section className="page-head compact">
        <div className="container">
          <nav className="breadcrumbs" aria-label="Breadcrumb">
            <Link href="/">Home</Link>
            <span aria-hidden="true">/</span>
            <Link href="/properties">Portfolio</Link>
            <span aria-hidden="true">/</span>
            <span aria-current="page">{listing.title}</span>
          </nav>
        </div>
      </section>

      <section className="section detail-main">
        <div className="container detail-grid">
          <div className="detail-primary">
            <div className="detail-title-row">
              <div>
                <span className="type-tag static">{typeLabels[listing.type]}</span>
                <h1>{listing.title}</h1>
                <p className="detail-loc">
                  {listing.address}
                  {listing.address && listing.city ? ', ' : ''}
                  {listing.city}
                </p>
              </div>
              <span className={`pill big ${leased ? 'pill-leased' : 'pill-available'}`}>
                {leased ? 'Leased' : 'Available now'}
              </span>
            </div>

            <Gallery images={listing.images} title={listing.title} />

            <div className="spec-grid">
              <div className="spec">
                <span>Rent</span>
                <strong>
                  ${formatPrice(listing.price)}
                  <small> / month</small>
                </strong>
              </div>
              <div className="spec">
                <span>Area</span>
                <strong>{listing.area_sqm.toLocaleString('en-US')} m²</strong>
              </div>
              {listing.beds !== null && (
                <div className="spec">
                  <span>Bedrooms</span>
                  <strong>{listing.beds}</strong>
                </div>
              )}
              <div className="spec">
                <span>Type</span>
                <strong>{typeLabels[listing.type]}</strong>
              </div>
              <div className="spec">
                <span>City</span>
                <strong>{listing.city || '—'}</strong>
              </div>
              <div className="spec">
                <span>Status</span>
                <strong>{leased ? 'Leased' : 'Available'}</strong>
              </div>
            </div>

            <article className="detail-copy">
              <h2>About this unit</h2>
              <p>{listing.description}</p>

              {listing.features.length > 0 && (
                <>
                  <h2>Features & amenities</h2>
                  <ul className="feature-list">
                    {listing.features.map((f) => (
                      <li key={f}>{f}</li>
                    ))}
                  </ul>
                </>
              )}
            </article>
          </div>

          <aside className="detail-aside">
            {leased ? (
              <div className="enquiry-card leased-note">
                <h3>This unit is leased</h3>
                <p>
                  A tenant has already taken this unit. Browse our other
                  available spaces — new units come to market regularly.
                </p>
                <Link href={`/properties?type=${listing.type}&available=1`} className="btn btn-primary btn-block">
                  See available {typeLabels[listing.type].toLowerCase()} units
                </Link>
              </div>
            ) : (
              <EnquiryForm listingId={listing.id} listingTitle={listing.title} />
            )}
          </aside>
        </div>
      </section>

      {related.length > 0 && (
        <section className="section section-alt">
          <div className="container">
            <div className="section-head">
              <div>
                <p className="eyebrow dark">More like this</p>
                <h2>Other {typeLabels[listing.type].toLowerCase()} units</h2>
              </div>
            </div>
            <div className="card-grid">
              {related.slice(0, 3).map((l) => (
                <PropertyCard key={l.id} listing={l} />
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
