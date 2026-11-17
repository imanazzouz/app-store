import Link from 'next/link';
import type { Listing } from '@/lib/listings';
import { typeLabels } from '@/lib/validation';

export function formatPrice(price: number): string {
  return price.toLocaleString('en-US');
}

export default function PropertyCard({ listing }: { listing: Listing }) {
  const cover = listing.images[0] ?? '/img/hero.jpg';
  const leased = listing.status === 'leased';

  return (
    <Link
      href={`/properties/${listing.id}`}
      className={`property-card${leased ? ' is-leased' : ''}`}
    >
      <div className="card-media">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={cover} alt={listing.title} loading="lazy" width={640} height={420} />
        <span className={`pill ${leased ? 'pill-leased' : 'pill-available'}`}>
          {leased ? 'Leased' : 'Available'}
        </span>
        <span className="type-tag">{typeLabels[listing.type]}</span>
      </div>
      <div className="card-body">
        <h3>{listing.title}</h3>
        <p className="card-meta">
          {listing.city}
          <span aria-hidden="true">·</span>
          {listing.area_sqm.toLocaleString('en-US')} m²
          {listing.beds ? (
            <>
              <span aria-hidden="true">·</span>
              {listing.beds} bed
            </>
          ) : null}
        </p>
        <div className="card-foot">
          <span className="price">
            ${formatPrice(listing.price)}
            <small>/mo</small>
          </span>
          <span className="card-cta">View details →</span>
        </div>
      </div>
    </Link>
  );
}
