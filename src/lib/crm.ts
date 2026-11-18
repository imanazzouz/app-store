import { query, withTransaction } from './db';
import type { LeadInput, VisitInput } from './validation';
export type Lead = {
  id: number; contact_name: string; email: string; phone: string; message: string;
  source: string; stage: string; listing_title: string | null; assigned_name: string | null;
  created_at: string; follow_up_at: string | null;
};

export async function getLeads(): Promise<Lead[]> {
  const rows = await query<Lead>(
    `SELECT l.id, l.contact_name, l.email, l.phone, l.message, l.source, l.stage,
       p.title AS listing_title, u.name AS assigned_name,
       l.created_at::text AS created_at, l.follow_up_at::text AS follow_up_at
     FROM leads l LEFT JOIN listings p ON p.id = l.listing_id
     LEFT JOIN users u ON u.id = l.assigned_user_id
     ORDER BY CASE l.stage WHEN 'new' THEN 0 WHEN 'contacted' THEN 1 ELSE 2 END,
       l.created_at DESC, l.id DESC`,
  );
  return rows.map((r) => ({ ...r, id: Number(r.id) }));
}

export async function createLead(input: LeadInput): Promise<number> {
  return withTransaction(async (tx) => {
    const rows = await tx.query<{ id: number }>(
      `INSERT INTO leads (listing_id, contact_name, email, phone, message, source, assigned_user_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
      [input.listing_id ?? null, input.contact_name, input.email, input.phone,
        input.message, input.source, input.assigned_user_id ?? null],
    );
    const id = Number(rows[0].id);
    await tx.query(
      `INSERT INTO lead_stage_history (lead_id, new_stage, note) VALUES ($1,'new','إنشاء ملف عميل محتمل')`,
      [id],
    );
    return id;
  });
}

export type Visit = { id: number; contact_name: string; unit_label: string | null; scheduled_at: string; status: string; assigned_name: string | null; notes: string };

export async function getVisits(): Promise<Visit[]> {
  const rows = await query<Visit>(
    `SELECT v.id, l.contact_name, COALESCE(NULLIF(u.label,''), p.name) AS unit_label,
       v.scheduled_at::text AS scheduled_at, v.status, staff.name AS assigned_name, v.notes
     FROM visits v JOIN leads l ON l.id = v.lead_id
     LEFT JOIN units u ON u.id = v.unit_id
     LEFT JOIN properties p ON p.id = u.property_id
     LEFT JOIN users staff ON staff.id = v.assigned_user_id
     ORDER BY v.scheduled_at DESC, v.id DESC`,
  );
  return rows.map((r) => ({ ...r, id: Number(r.id) }));
}

export async function createVisit(input: VisitInput, userId: number): Promise<number> {
  return withTransaction(async (tx) => {
    const rows = await tx.query<{ id: number }>(
      `INSERT INTO visits (lead_id, unit_id, assigned_user_id, scheduled_at, notes)
       VALUES ($1,$2,$3,$4,$5) RETURNING id`,
      [input.lead_id, input.unit_id ?? null, input.assigned_user_id ?? null, input.scheduled_at, input.notes],
    );
    const current = await tx.query<{ stage: string }>('SELECT stage FROM leads WHERE id = $1 FOR UPDATE', [input.lead_id]);
    if (current[0] && current[0].stage !== 'visit_scheduled') {
      await tx.query("UPDATE leads SET stage = 'visit_scheduled', updated_at = now() WHERE id = $1", [input.lead_id]);
      await tx.query(
        `INSERT INTO lead_stage_history (lead_id, old_stage, new_stage, changed_by, note)
         VALUES ($1,$2,'visit_scheduled',$3,'تمت جدولة زيارة')`,
        [input.lead_id, current[0].stage, userId],
      );
    }
    return Number(rows[0].id);
  });
}

export async function updateLeadStage(id: number, stage: string, userId: number, note = ''): Promise<boolean> {
  return withTransaction(async (tx) => {
    const rows = await tx.query<{ stage: string }>('SELECT stage FROM leads WHERE id = $1 FOR UPDATE', [id]);
    if (!rows.length) return false;
    const previous = rows[0].stage;
    await tx.query('UPDATE leads SET stage = $1, updated_at = now() WHERE id = $2', [stage, id]);
    await tx.query(
      `INSERT INTO lead_stage_history (lead_id, old_stage, new_stage, changed_by, note)
       VALUES ($1,$2,$3,$4,$5)`, [id, previous, stage, userId, note],
    );
    if (stage === 'won' || stage === 'lost') {
      const lead = await tx.query<{ enquiry_id: number | null }>('SELECT enquiry_id FROM leads WHERE id = $1', [id]);
      if (lead[0]?.enquiry_id) {
        await tx.query('UPDATE enquiries SET status = $1 WHERE id = $2', [stage === 'won' ? 'contacted' : 'closed', lead[0].enquiry_id]);
      }
    }
    return true;
  });
}
