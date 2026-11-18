import { query, withTransaction } from './db';
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
  return withTransaction(async (tx) => {
    const rows = await tx.query<{ id: number; unit_id: number | null }>(
      `INSERT INTO enquiries (listing_id, name, email, phone, message)
       VALUES ($1, $2, $3, $4, $5) RETURNING id, listing_id`,
      [input.listingId, input.name, input.email, input.phone, input.message],
    );
    const id = Number(rows[0].id);
    const links = await tx.query<{ unit_id: number | null }>(
      'SELECT unit_id FROM listings WHERE id = $1', [input.listingId],
    );
    const leads = await tx.query<{ id: number }>(
      `INSERT INTO leads (enquiry_id, listing_id, unit_id, contact_name, email, phone, message, source)
       VALUES ($1,$2,$3,$4,$5,$6,$7,'website') RETURNING id`,
      [id, input.listingId, links[0]?.unit_id ?? null, input.name, input.email, input.phone, input.message],
    );
    await tx.query(
      `INSERT INTO lead_stage_history (lead_id, new_stage, note)
       VALUES ($1, 'new', 'استفسار وارد من الموقع')`, [Number(leads[0].id)],
    );
    return id;
  });
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
  const stage = status === 'closed' ? 'lost' : status;
  await withTransaction(async (tx) => {
    await tx.query('UPDATE enquiries SET status = $1 WHERE id = $2', [status, id]);
    const rows = await tx.query<{ id: number; stage: string }>(
      'SELECT id, stage FROM leads WHERE enquiry_id = $1 FOR UPDATE', [id],
    );
    if (!rows.length || rows[0].stage === stage) return;
    await tx.query('UPDATE leads SET stage = $1, updated_at = now() WHERE id = $2', [stage, rows[0].id]);
    await tx.query(
      `INSERT INTO lead_stage_history (lead_id, old_stage, new_stage, note)
       VALUES ($1,$2,$3,'تحديث حالة الاستفسار')`, [rows[0].id, rows[0].stage, stage],
    );
  });
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
