import { query } from './db';
import type { OwnerInput, PortfolioInput, PropertyInput, UnitInput } from './validation';

export type ManagedProperty = {
  id: number; code: string; name: string; type: string; wilaya: string;
  municipality: string; address: string; owner_name: string | null;
  portfolio_name: string | null; unit_count: number; created_at: string;
};
export type ManagedUnit = {
  id: number; property_id: number; property_name: string; property_code: string;
  code: string; label: string; type: string; floor: string; area_sqm: number;
  bedrooms: number | null; asking_rent: number; rent_period: string;
  operating_status: string; occupancy_status: string; currency: 'DZD';
};

export type Owner = { id: number; owner_type: string; legal_name: string; email: string; phone: string; mailing_address: string };
export type Portfolio = { id: number; code: string; name: string; description: string; property_count: number };

export async function getOwners(): Promise<Owner[]> {
  const rows = await query<Owner>('SELECT id, owner_type, legal_name, email, phone, mailing_address FROM owners ORDER BY legal_name');
  return rows.map((r) => ({ ...r, id: Number(r.id) }));
}
export async function getPortfolios(): Promise<Portfolio[]> {
  const rows = await query<Portfolio>(
    `SELECT pf.id, pf.code, pf.name, pf.description, COUNT(p.id)::int AS property_count
     FROM portfolios pf LEFT JOIN properties p ON p.portfolio_id = pf.id
     GROUP BY pf.id ORDER BY pf.name`,
  );
  return rows.map((r) => ({ ...r, id: Number(r.id), property_count: Number(r.property_count) }));
}
export async function createOwner(input: OwnerInput): Promise<number> {
  const rows = await query<{id:number}>(
    `INSERT INTO owners (owner_type, legal_name, email, phone, mailing_address)
     VALUES ($1,$2,$3,$4,$5) RETURNING id`,
    [input.owner_type, input.legal_name, input.email, input.phone, input.mailing_address],
  );
  return Number(rows[0].id);
}
export async function createPortfolio(input: PortfolioInput): Promise<number> {
  const rows = await query<{id:number}>(
    `INSERT INTO portfolios (code, name, description) VALUES ($1,$2,$3) RETURNING id`,
    [input.code, input.name, input.description],
  );
  return Number(rows[0].id);
}

export async function getManagedProperties(): Promise<ManagedProperty[]> {
  const rows = await query<ManagedProperty>(
    `SELECT p.id, p.code, p.name, p.type, p.wilaya, p.municipality, p.address,
       o.legal_name AS owner_name, pf.name AS portfolio_name,
       COUNT(u.id)::int AS unit_count, p.created_at::text AS created_at
     FROM properties p
     LEFT JOIN owners o ON o.id = p.owner_id
     LEFT JOIN portfolios pf ON pf.id = p.portfolio_id
     LEFT JOIN units u ON u.property_id = p.id
     GROUP BY p.id, o.legal_name, pf.name
     ORDER BY p.created_at DESC, p.id DESC`,
  );
  return rows.map((r) => ({ ...r, id: Number(r.id), unit_count: Number(r.unit_count) }));
}

export async function getManagedUnits(): Promise<ManagedUnit[]> {
  const rows = await query<ManagedUnit>(
    `SELECT u.id, u.property_id, p.name AS property_name, p.code AS property_code,
       u.code, u.label, u.type, u.floor, u.area_sqm, u.bedrooms, u.asking_rent,
       u.rent_period, u.operating_status, u.occupancy_status, u.currency
     FROM units u JOIN properties p ON p.id = u.property_id
     ORDER BY p.name, u.code`,
  );
  return rows.map((r) => ({ ...r, id: Number(r.id), property_id: Number(r.property_id),
    area_sqm: Number(r.area_sqm), asking_rent: Number(r.asking_rent),
    bedrooms: r.bedrooms === null ? null : Number(r.bedrooms), currency: 'DZD' }));
}

export async function createManagedProperty(input: PropertyInput): Promise<number> {
  const rows = await query<{ id: number }>(
    `INSERT INTO properties (code, name, type, description, address, wilaya, municipality,
       construction_year, total_area_sqm, owner_id, portfolio_id)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING id`,
    [input.code, input.name, input.type, input.description, input.address, input.wilaya,
      input.municipality, input.construction_year ?? null, input.total_area_sqm ?? null,
      input.owner_id ?? null, input.portfolio_id ?? null],
  );
  return Number(rows[0].id);
}

export async function createManagedUnit(input: UnitInput): Promise<number> {
  const rows = await query<{ id: number }>(
    `INSERT INTO units (property_id, code, label, type, floor, area_sqm, bedrooms,
       asking_rent, rent_period, proposed_deposit, operating_status, occupancy_status, internal_notes)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'monthly',$9,$10,$11,$12) RETURNING id`,
    [input.property_id, input.code, input.label, input.type, input.floor, input.area_sqm,
      input.bedrooms ?? null, input.asking_rent, input.proposed_deposit,
      input.operating_status, input.occupancy_status, input.internal_notes],
  );
  return Number(rows[0].id);
}
