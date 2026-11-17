import { query } from './db';
import type { ListingInput, PropertyType } from './validation';

export type Listing = {
  id: number;
  title: string;
  type: PropertyType;
  status: 'available' | 'leased';
  price: number;
  area_sqm: number;
  beds: number | null;
  address: string;
  city: string;
  description: string;
  features: string[];
  images: string[];
  featured: boolean;
  created_at: string;
  updated_at: string;
};

function parseImages(value: unknown): string[] {
  try {
    const parsed = JSON.parse(String(value ?? '[]'));
    return Array.isArray(parsed) ? parsed.filter((v) => typeof v === 'string') : [];
  } catch {
    return [];
  }
}

function mapListing(row: Record<string, unknown>): Listing {
  return {
    id: Number(row.id),
    title: String(row.title),
    type: row.type as PropertyType,
    status: row.status as Listing['status'],
    price: Number(row.price),
    area_sqm: Number(row.area_sqm),
    beds: row.beds === null || row.beds === undefined ? null : Number(row.beds),
    address: String(row.address ?? ''),
    city: String(row.city ?? ''),
    description: String(row.description ?? ''),
    features: String(row.features ?? '')
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean),
    images: parseImages(row.images),
    featured: Boolean(row.featured),
    created_at: String(row.created_at ?? ''),
    updated_at: String(row.updated_at ?? ''),
  };
}

export async function getListings(opts: {
  type?: PropertyType;
  availableOnly?: boolean;
} = {}): Promise<Listing[]> {
  const where: string[] = [];
  const params: unknown[] = [];
  if (opts.type) {
    params.push(opts.type);
    where.push(`type = $${params.length}`);
  }
  if (opts.availableOnly) {
    where.push(`status = 'available'`);
  }
  const sql = `
    SELECT * FROM listings
    ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
    ORDER BY featured DESC, created_at DESC, id DESC`;
  const rows = await query(sql, params);
  return rows.map(mapListing);
}

export async function getListing(id: number): Promise<Listing | null> {
  const rows = await query('SELECT * FROM listings WHERE id = $1', [id]);
  return rows.length ? mapListing(rows[0]) : null;
}

export async function getListingCounts(): Promise<Record<string, number>> {
  const rows = await query<{ type: string; n: number }>(
    'SELECT type, COUNT(*)::int AS n FROM listings GROUP BY type',
  );
  const out: Record<string, number> = { commercial: 0, residential: 0, warehouse: 0 };
  for (const r of rows) out[r.type] = Number(r.n);
  return out;
}

export async function getPortfolioStats(): Promise<{
  units: number;
  available: number;
  leased: number;
  cities: number;
  occupancy: number;
}> {
  const rows = await query<{ units: number; available: number; leased: number; cities: number }>(
    `SELECT
       COUNT(*)::int AS units,
       COUNT(*) FILTER (WHERE status = 'available')::int AS available,
       COUNT(*) FILTER (WHERE status = 'leased')::int AS leased,
       COUNT(DISTINCT city)::int AS cities
     FROM listings`,
  );
  const r = rows[0] ?? { units: 0, available: 0, leased: 0, cities: 0 };
  const units = Number(r.units);
  const leased = Number(r.leased);
  return {
    units,
    available: Number(r.available),
    leased,
    cities: Number(r.cities),
    occupancy: units ? Math.round((leased / units) * 100) : 0,
  };
}

export async function createListing(input: ListingInput): Promise<number> {
  const rows = await query<{ id: number }>(
    `INSERT INTO listings
       (title, type, status, price, area_sqm, beds, address, city,
        description, features, images, featured)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
     RETURNING id`,
    [
      input.title,
      input.type,
      input.status,
      input.price,
      input.area_sqm,
      input.beds ?? null,
      input.address,
      input.city,
      input.description,
      input.features,
      JSON.stringify(input.images),
      input.featured,
    ],
  );
  return Number(rows[0].id);
}

export async function updateListing(id: number, input: ListingInput): Promise<void> {
  await query(
    `UPDATE listings SET
       title = $1, type = $2, status = $3, price = $4, area_sqm = $5,
       beds = $6, address = $7, city = $8, description = $9, features = $10,
       images = $11, featured = $12, updated_at = now()
     WHERE id = $13`,
    [
      input.title,
      input.type,
      input.status,
      input.price,
      input.area_sqm,
      input.beds ?? null,
      input.address,
      input.city,
      input.description,
      input.features,
      JSON.stringify(input.images),
      input.featured,
      id,
    ],
  );
}

export async function setListingStatus(
  id: number,
  status: 'available' | 'leased',
): Promise<void> {
  await query('UPDATE listings SET status = $1, updated_at = now() WHERE id = $2', [
    status,
    id,
  ]);
}

export async function deleteListing(id: number): Promise<void> {
  await query('DELETE FROM listings WHERE id = $1', [id]);
}
