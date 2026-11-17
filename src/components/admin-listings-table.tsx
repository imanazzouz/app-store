'use client';

import Link from 'next/link';
import type { Listing } from '@/lib/listings';
import { typeLabels } from '@/lib/validation';
import { formatPrice } from './property-card';
import { formatDate } from '@/lib/csv';

export default function AdminListingsTable({ listings }: { listings: Listing[] }) {
  if (!listings.length) {
    return (
      <div className="panel empty-state">
        <h2>No listings yet</h2>
        <p>Add your first unit — photos, price, availability and all.</p>
        <Link href="/admin/listings/new" className="btn btn-primary">
          Create a listing
        </Link>
      </div>
    );
  }

  return (
    <div className="panel table-panel">
      <table className="admin-table">
        <thead>
          <tr>
            <th scope="col">Unit</th>
            <th scope="col">Type</th>
            <th scope="col">Rent / month</th>
            <th scope="col">Status</th>
            <th scope="col">Updated</th>
            <th scope="col" className="col-actions">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {listings.map((l) => {
            const leased = l.status === 'leased';
            return (
              <tr key={l.id} className={leased ? 'row-leased' : undefined}>
                <td data-label="Unit">
                  <div className="cell-unit">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={l.images[0] ?? '/img/hero.jpg'}
                      alt=""
                      width={72}
                      height={52}
                      loading="lazy"
                    />
                    <div>
                      <Link href={`/admin/listings/${l.id}/edit`} className="cell-title">
                        {l.title}
                      </Link>
                      <span className="cell-sub">
                        {l.city} · {l.area_sqm.toLocaleString('en-US')} m²
                      </span>
                    </div>
                  </div>
                </td>
                <td data-label="Type">{typeLabels[l.type]}</td>
                <td data-label="Rent / month">${formatPrice(l.price)}</td>
                <td data-label="Status">
                  <span className={`status-pill s-${l.status}`}>{l.status}</span>
                </td>
                <td data-label="Updated">{formatDate(l.updated_at)}</td>
                <td data-label="Actions" className="col-actions">
                  <div className="row-actions">
                    <Link href={`/admin/listings/${l.id}/edit`} className="btn btn-outline btn-xs">
                      Edit
                    </Link>
                    <form action={`/api/admin/listings/${l.id}/status`} method="post">
                      <input type="hidden" name="status" value={leased ? 'available' : 'leased'} />
                      <button
                        type="submit"
                        className={`btn btn-xs ${leased ? 'btn-outline' : 'btn-warn'}`}
                      >
                        {leased ? 'Mark available' : 'Mark leased'}
                      </button>
                    </form>
                    <form
                      action={`/api/admin/listings/${l.id}/delete`}
                      method="post"
                      onSubmit={(e) => {
                        if (!confirm(`Delete “${l.title}”? This cannot be undone.`)) {
                          e.preventDefault();
                        }
                      }}
                    >
                      <button type="submit" className="btn btn-ghost btn-xs danger">
                        Delete
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
