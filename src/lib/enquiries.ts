import { query } from './db';
import type { EnquiryInput } from './validation';

export type Enquiry = {
  id: number;
  listing_id: number | null;
  listing_title: string | null;
  name: string;
  email: string;
  phone: string;
  message: string;
  status: 'new' | 'contacted' | 'closed';
  created_at: string;
};

function mapEnquiry(row: Record<string, unknown>): Enquiry {
  return {
    id: Number(row.id),
    listing_id: row.listing_id === null || row.listing_id === undefined ? null : Number(row.listing_id),
    listing_title: (row.listing_title as string | null) ?? null,
    name: String(row.name ?? ''),
    email: String(row.email ?? ''),
    phone: String(row.phone ?? ''),
    message: String(row.message ?? ''),
    status: row.status as Enquiry['status'],
    created_at: String(row.created_at ?? ''),
  };
}

const SELECT = `
  SELECT e.*, l.title AS listing_title
  FROM enquiries e
  LEFT JOIN listings l ON l.id = e.listing_id`;

export async function createEnquiry(input: EnquiryInput): Promise<number> {
  const rows = await query<{ id: number }>(
    `INSERT INTO enquiries (listing_id, name, email, phone, message)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id`,
    [input.listingId, input.name, input.email, input.phone, input.message],
  );
  return Number(rows[0].id);
}

export async function listEnquiries(): Promise<Enquiry[]> {
  const rows = await query(`${SELECT} ORDER BY e.created_at DESC, e.id DESC`);
  return rows.map(mapEnquiry);
}

export async function getEnquiry(id: number): Promise<Enquiry | null> {
  const rows = await query(`${SELECT} WHERE e.id = $1`, [id]);
  return rows.length ? mapEnquiry(rows[0]) : null;
}

export async function setEnquiryStatus(
  id: number,
  status: Enquiry['status'],
): Promise<void> {
  await query('UPDATE enquiries SET status = $1 WHERE id = $2', [status, id]);
}

export async function recentEnquiries(limit = 5): Promise<Enquiry[]> {
  const rows = await query(
    `${SELECT} ORDER BY e.created_at DESC, e.id DESC LIMIT $1`,
    [limit],
  );
  return rows.map(mapEnquiry);
}

export async function countNewEnquiries(): Promise<number> {
  const rows = await query<{ n: number }>(
    "SELECT COUNT(*)::int AS n FROM enquiries WHERE status = 'new'",
  );
  return Number(rows[0]?.n ?? 0);
}
