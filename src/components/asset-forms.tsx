'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { ManagedProperty, Owner, Portfolio } from '@/lib/assets';
import { typeLabels, propertyTypes } from '@/lib/validation';

function useSubmit(path: string) {
  const router = useRouter();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const body = Object.fromEntries(new FormData(form).entries());
    setError(''); setBusy(true);
    try {
      const res = await fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await res.json().catch(() => ({})) as { error?: string };
      if (!res.ok) { setError(data.error || 'تعذر حفظ البيانات.'); return; }
      form.reset(); router.refresh();
    } catch { setError('تعذر الاتصال بالخادم. حاول مجدداً.'); }
    finally { setBusy(false); }
  }
  return { submit, error, busy };
}

export function PropertyForm({ owners, portfolios }: { owners: Owner[]; portfolios: Portfolio[] }) {
  const { submit, error, busy } = useSubmit('/api/admin/properties');
  return <form className="stack-form" onSubmit={submit}>
    <div className="form-row">
      <label className="field"><span>الرمز الداخلي *</span><input name="code" required minLength={2} maxLength={32} pattern="[A-Za-z0-9_-]+" placeholder="BAT-001" /></label>
      <label className="field"><span>اسم العقار *</span><input name="name" required minLength={2} maxLength={160} placeholder="عمارة النور" /></label>
      <label className="field"><span>نوع العقار *</span><select name="type" defaultValue="residential"><option value="mixed">مختلط</option>{propertyTypes.map((t) => <option key={t} value={t}>{typeLabels[t]}</option>)}</select></label>
      <label className="field"><span>المالك</span><select name="owner_id"><option value="">غير محدد</option>{owners.map((o) => <option key={o.id} value={o.id}>{o.legal_name}</option>)}</select></label>
      <label className="field"><span>المحفظة</span><select name="portfolio_id"><option value="">غير محددة</option>{portfolios.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
    </div>
    <div className="form-row">
      <label className="field"><span>الولاية *</span><input name="wilaya" required minLength={2} maxLength={100} placeholder="باتنة" /></label>
      <label className="field"><span>البلدية *</span><input name="municipality" required minLength={2} maxLength={100} placeholder="باتنة" /></label>
      <label className="field"><span>المساحة الإجمالية (م²)</span><input name="total_area_sqm" type="number" min="0" step="0.01" /></label>
      <label className="field"><span>سنة الإنشاء</span><input name="construction_year" type="number" min="1700" max="2200" /></label>
    </div>
    <label className="field"><span>العنوان</span><input name="address" maxLength={300} /></label>
    <label className="field"><span>الوصف</span><textarea name="description" rows={3} maxLength={3000} /></label>
    {error && <p className="form-error" role="alert">{error}</p>}
    <button className="btn btn-primary" disabled={busy}>{busy ? 'جارٍ الحفظ…' : 'إضافة العقار'}</button>
  </form>;
}

export function OwnerForm() {
  const { submit, error, busy } = useSubmit('/api/admin/owners');
  return <form className="stack-form" onSubmit={submit}>
    <div className="form-row"><label className="field"><span>نوع المالك</span><select name="owner_type"><option value="individual">فرد</option><option value="company">شركة</option></select></label><label className="field span-2"><span>الاسم القانوني *</span><input name="legal_name" required minLength={2} maxLength={180} /></label><label className="field"><span>البريد الإلكتروني</span><input name="email" type="email" /></label></div>
    <div className="form-row"><label className="field"><span>الهاتف</span><input name="phone" maxLength={40} /></label><label className="field span-2"><span>عنوان المراسلة</span><input name="mailing_address" maxLength={300} /></label></div>
    {error && <p className="form-error" role="alert">{error}</p>}<button className="btn btn-primary" disabled={busy}>{busy ? 'جارٍ الحفظ…' : 'إضافة المالك'}</button>
  </form>;
}

export function PortfolioForm() {
  const { submit, error, busy } = useSubmit('/api/admin/portfolios');
  return <form className="stack-form" onSubmit={submit}>
    <div className="form-row"><label className="field"><span>رمز المحفظة *</span><input name="code" required maxLength={32} pattern="[A-Za-z0-9_-]+" placeholder="BAT-RES" /></label><label className="field span-2"><span>اسم المحفظة *</span><input name="name" required minLength={2} maxLength={160} /></label></div>
    <label className="field"><span>الوصف</span><textarea name="description" rows={2} maxLength={2000} /></label>
    {error && <p className="form-error" role="alert">{error}</p>}<button className="btn btn-primary" disabled={busy}>{busy ? 'جارٍ الحفظ…' : 'إنشاء المحفظة'}</button>
  </form>;
}

export function UnitForm({ properties }: { properties: ManagedProperty[] }) {
  const { submit, error, busy } = useSubmit('/api/admin/units');
  if (!properties.length) return <p className="empty-note">أنشئ عقاراً أولاً قبل إضافة وحداته.</p>;
  return <form className="stack-form" onSubmit={submit}>
    <div className="form-row">
      <label className="field span-2"><span>العقار *</span><select name="property_id" required>{properties.map((p) => <option key={p.id} value={p.id}>{p.name} · {p.code}</option>)}</select></label>
      <label className="field"><span>رمز الوحدة *</span><input name="code" required maxLength={32} placeholder="A-01" /></label>
      <label className="field"><span>الاسم الظاهر</span><input name="label" maxLength={120} placeholder="الشقة ١" /></label>
    </div>
    <div className="form-row">
      <label className="field"><span>النوع *</span><select name="type" defaultValue="residential">{propertyTypes.map((t) => <option key={t} value={t}>{typeLabels[t]}</option>)}</select></label>
      <label className="field"><span>الطابق</span><input name="floor" maxLength={32} /></label>
      <label className="field"><span>المساحة (م²) *</span><input name="area_sqm" type="number" required min="0.01" step="0.01" /></label>
      <label className="field"><span>الغرف</span><input name="bedrooms" type="number" min="0" max="100" /></label>
    </div>
    <div className="form-row">
      <label className="field"><span>الإيجار الشهري (دج) *</span><input name="asking_rent" type="number" required min="0" step="0.01" /></label>
      <label className="field"><span>الضمان المقترح (دج)</span><input name="proposed_deposit" type="number" min="0" step="0.01" defaultValue="0" /></label>
      <label className="field"><span>الحالة التشغيلية</span><select name="operating_status"><option value="active">تعمل</option><option value="maintenance">تحت الصيانة</option><option value="out_of_service">خارج الخدمة</option></select></label>
      <label className="field"><span>حالة الإشغال</span><select name="occupancy_status"><option value="vacant">شاغرة</option><option value="reserved">محجوزة</option><option value="leased">مؤجرة</option></select></label>
    </div>
    <label className="field"><span>ملاحظات داخلية</span><textarea name="internal_notes" rows={2} maxLength={2000} /></label>
    {error && <p className="form-error" role="alert">{error}</p>}
    <button className="btn btn-primary" disabled={busy}>{busy ? 'جارٍ الحفظ…' : 'إضافة الوحدة'}</button>
  </form>;
}
