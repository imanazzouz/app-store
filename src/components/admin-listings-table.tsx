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
        <h2>لا توجد إعلانات بعد</h2>
        <p>أضف أول وحدة مع صورها وسعرها وحالة توفرها.</p>
        <Link href="/admin/listings/new" className="btn btn-primary">
          إنشاء إعلان
        </Link>
      </div>
    );
  }

  return (
    <div className="panel table-panel">
      <table className="admin-table">
        <thead>
          <tr>
            <th scope="col">الوحدة</th>
            <th scope="col">النوع</th>
            <th scope="col">الإيجار / شهرياً</th>
            <th scope="col">الحالة</th>
            <th scope="col">آخر تحديث</th>
            <th scope="col" className="col-actions">
              الإجراءات
            </th>
          </tr>
        </thead>
        <tbody>
          {listings.map((l) => {
            const leased = l.status === 'leased';
            return (
              <tr key={l.id} className={leased ? 'row-leased' : undefined}>
                <td data-label="الوحدة">
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
                        {l.city} · {l.area_sqm.toLocaleString('ar-DZ')} m²
                      </span>
                    </div>
                  </div>
                </td>
                <td data-label="النوع">{typeLabels[l.type]}</td>
                <td data-label="الإيجار / شهرياً">{formatPrice(l.price)} دج</td>
                <td data-label="الحالة">
                  <span className={`status-pill s-${l.status}`}>{leased ? 'مؤجرة' : 'متاحة'}</span>
                </td>
                <td data-label="آخر تحديث">{formatDate(l.updated_at)}</td>
                <td data-label="الإجراءات" className="col-actions">
                  <div className="row-actions">
                    <Link href={`/admin/listings/${l.id}/edit`} className="btn btn-outline btn-xs">
                      تعديل
                    </Link>
                    <form action={`/api/admin/listings/${l.id}/status`} method="post">
                      <input type="hidden" name="status" value={leased ? 'available' : 'leased'} />
                      <button
                        type="submit"
                        className={`btn btn-xs ${leased ? 'btn-outline' : 'btn-warn'}`}
                      >
                        {leased ? 'تحديد كمتاحة' : 'تحديد كمؤجرة'}
                      </button>
                    </form>
                    <form
                      action={`/api/admin/listings/${l.id}/delete`}
                      method="post"
                      onSubmit={(e) => {
                        if (!confirm(`هل تريد حذف «${l.title}»؟ لا يمكن التراجع عن هذا الإجراء.`)) {
                          e.preventDefault();
                        }
                      }}
                    >
                      <button type="submit" className="btn btn-ghost btn-xs danger">
                        حذف
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
