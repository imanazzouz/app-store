'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Listing } from '@/lib/listings';
import { propertyTypes, typeLabels } from '@/lib/validation';

type Props = { listing?: Listing };

type Draft = {
  title: string;
  type: Listing['type'];
  status: Listing['status'];
  price: string;
  area_sqm: string;
  beds: string;
  address: string;
  city: string;
  description: string;
  features: string;
  images: string[];
  featured: boolean;
};

function toDraft(listing?: Listing): Draft {
  return {
    title: listing?.title ?? '',
    type: listing?.type ?? 'commercial',
    status: listing?.status ?? 'available',
    price: listing ? String(listing.price) : '',
    area_sqm: listing ? String(listing.area_sqm) : '',
    beds: listing?.beds != null ? String(listing.beds) : '',
    address: listing?.address ?? '',
    city: listing?.city ?? '',
    description: listing?.description ?? '',
    features: listing ? listing.features.join('\n') : '',
    images: listing?.images ?? [],
    featured: listing?.featured ?? false,
  };
}

export default function ListingForm({ listing }: Props) {
  const router = useRouter();
  const [draft, setDraft] = useState<Draft>(() => toDraft(listing));
  const [urlInput, setUrlInput] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadNote, setUploadNote] = useState('');

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  function addImage(url: string) {
    const clean = url.trim();
    if (!clean) return;
    if (draft.images.length >= 12) {
      setError('Maximum of 12 images per listing.');
      return;
    }
    set('images', [...draft.images, clean]);
    setUrlInput('');
  }

  async function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploadNote('');
    setUploading(true);
    try {
      const body = new FormData();
      body.append('file', file);
      const res = await fetch('/api/admin/upload', { method: 'POST', body });
      const json = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
      if (!res.ok || !json.url) {
        setUploadNote(json.error || 'Upload failed.');
      } else {
        set('images', [...draft.images, json.url]);
        setUploadNote('Uploaded ✓');
      }
    } catch {
      setUploadNote('Upload failed — check your connection.');
    } finally {
      setUploading(false);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');

    const payload = {
      title: draft.title,
      type: draft.type,
      status: draft.status,
      price: draft.price,
      area_sqm: draft.area_sqm,
      beds: draft.beds === '' ? null : draft.beds,
      address: draft.address,
      city: draft.city,
      description: draft.description,
      features: draft.features,
      images: draft.images,
      featured: draft.featured,
    };

    try {
      const res = await fetch(listing ? `/api/admin/listings/${listing.id}` : '/api/admin/listings', {
        method: listing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(json.error || 'Could not save the listing.');
        setBusy(false);
        return;
      }
      router.push('/admin/listings?saved=1');
      router.refresh();
    } catch {
      setError('Network error — please try again.');
      setBusy(false);
    }
  }

  return (
    <form className="listing-form" onSubmit={onSubmit}>
      {error && (
        <div className="banner err" role="alert">
          {error}
        </div>
      )}

      <section className="panel form-panel">
        <h2>Unit details</h2>
        <div className="form-row">
          <label className="field span-2">
            <span>Title *</span>
            <input
              type="text"
              value={draft.title}
              onChange={(e) => set('title', e.target.value)}
              required
              minLength={3}
              maxLength={160}
              placeholder="e.g. Hydra Business Center — Floor 4"
            />
          </label>
          <label className="field">
            <span>Property type *</span>
            <select value={draft.type} onChange={(e) => set('type', e.target.value as Draft['type'])}>
              {propertyTypes.map((t) => (
                <option key={t} value={t}>
                  {typeLabels[t]}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Status *</span>
            <select value={draft.status} onChange={(e) => set('status', e.target.value as Draft['status'])}>
              <option value="available">Available</option>
              <option value="leased">Leased</option>
            </select>
          </label>
        </div>

        <div className="form-row">
          <label className="field">
            <span>Rent per month (USD) *</span>
            <input
              type="number"
              min={1}
              step="0.01"
              value={draft.price}
              onChange={(e) => set('price', e.target.value)}
              required
              placeholder="9800"
            />
          </label>
          <label className="field">
            <span>Area (m²) *</span>
            <input
              type="number"
              min={1}
              step="1"
              value={draft.area_sqm}
              onChange={(e) => set('area_sqm', e.target.value)}
              required
              placeholder="420"
            />
          </label>
          <label className="field">
            <span>Bedrooms (residential)</span>
            <input
              type="number"
              min={0}
              max={100}
              step="1"
              value={draft.beds}
              onChange={(e) => set('beds', e.target.value)}
              placeholder="3"
            />
          </label>
        </div>

        <div className="form-row">
          <label className="field">
            <span>City</span>
            <input
              type="text"
              value={draft.city}
              onChange={(e) => set('city', e.target.value)}
              maxLength={120}
              placeholder="Algiers"
            />
          </label>
          <label className="field span-2">
            <span>Full address</span>
            <input
              type="text"
              value={draft.address}
              onChange={(e) => set('address', e.target.value)}
              maxLength={300}
              placeholder="12 Chemin des Glycines, Hydra"
            />
          </label>
        </div>

        <label className="field">
          <span>Description * (at least 20 characters)</span>
          <textarea
            value={draft.description}
            onChange={(e) => set('description', e.target.value)}
            rows={5}
            required
            minLength={20}
            maxLength={5000}
            placeholder="Describe the unit, its condition, layout and surroundings…"
          />
        </label>

        <label className="field">
          <span>Features — one per line</span>
          <textarea
            value={draft.features}
            onChange={(e) => set('features', e.target.value)}
            rows={5}
            maxLength={3000}
            placeholder={'Raised access flooring\n3 meeting rooms\n24/7 security'}
          />
          <small className="field-hint">These appear as the bullet list on the unit page.</small>
        </label>

        <label className="check-field">
          <input
            type="checkbox"
            checked={draft.featured}
            onChange={(e) => set('featured', e.target.checked)}
          />
          <span>Feature this unit on the home page</span>
        </label>
      </section>

      <section className="panel form-panel">
        <h2>Photos</h2>
        <p className="panel-note">
          The <strong>first photo is the cover image</strong> shown on listings.
          Drag-free & simple: add by upload or paste a link.
        </p>

        <div className="image-actions">
          <label className="btn btn-outline btn-sm file-btn">
            {uploading ? 'Uploading…' : 'Upload photo'}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif"
              onChange={onUpload}
              disabled={uploading}
              hidden
            />
          </label>
          <div className="url-add">
            <input
              type="url"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="https://example.com/photo.jpg"
              maxLength={500}
            />
            <button type="button" className="btn btn-outline btn-sm" onClick={() => addImage(urlInput)}>
              Add link
            </button>
          </div>
        </div>
        {uploadNote && <p className="upload-note">{uploadNote}</p>}

        {draft.images.length ? (
          <ul className="image-chips">
            {draft.images.map((src, i) => (
              <li key={src + i} className="image-chip">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="" width={96} height={64} />
                <span className="chip-label">{i === 0 ? 'Cover' : `#${i + 1}`}</span>
                <button
                  type="button"
                  className="chip-remove"
                  aria-label={`Remove image ${i + 1}`}
                  onClick={() => set('images', draft.images.filter((_, idx) => idx !== i))}
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="empty-note">No photos yet — add at least one.</p>
        )}
      </section>

      <div className="form-footer">
        <button type="submit" className="btn btn-primary btn-lg" disabled={busy || uploading}>
          {busy ? 'Saving…' : listing ? 'Save changes' : 'Create listing'}
        </button>
        <button type="button" className="btn btn-ghost btn-lg" onClick={() => router.back()} disabled={busy}>
          Cancel
        </button>
      </div>
    </form>
  );
}
