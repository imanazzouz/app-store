import type { Db } from './db';
import { hashPassword } from './auth';

type SeedRow = {
  title: string;
  type: 'commercial' | 'residential' | 'warehouse';
  status: 'available' | 'leased';
  price: number;
  area_sqm: number;
  beds: number | null;
  address: string;
  city: string;
  description: string;
  features: string;
  images: string[];
  featured: boolean;
};

const LISTINGS: SeedRow[] = [
  {
    title: 'Hydra Business Center — Floor 4',
    type: 'commercial',
    status: 'available',
    price: 9800,
    area_sqm: 420,
    beds: null,
    address: '12 Chemin des Glycines, Hydra',
    city: 'Algiers',
    description:
      "A full-floor office suite in Atlas REIT's flagship Hydra Business Center. Open-plan workspace, three glass-partitioned meeting rooms and a reception lobby, finished to a warm contemporary standard with panoramic city views.",
    features: 'Raised access flooring\nFibre-ready comms room\n3 meeting rooms\n2 reserved parking bays\n24/7 building security',
    images: ['/img/commercial-1.jpg'],
    featured: true,
  },
  {
    title: 'Didouche Mourad Retail Flagship',
    type: 'commercial',
    status: 'available',
    price: 14500,
    area_sqm: 260,
    beds: null,
    address: '48 Didouche Mourad, Central District',
    city: 'Algiers',
    description:
      'Prime ground-floor retail flagship on the city’s busiest shopping street. Full-width display frontage, back-of-house storage and a separate street entrance — ideal for a flagship store or showroom.',
    features: '11m display frontage\nRear service access\nHigh footfall location\n3-phase power\nLandlord consent for fit-out',
    images: ['/img/commercial-2.jpg'],
    featured: true,
  },
  {
    title: 'Oran Corniche Offices',
    type: 'commercial',
    status: 'leased',
    price: 11200,
    area_sqm: 610,
    beds: null,
    address: 'Boulevard de la Corniche, Es Sénia corridor',
    city: 'Oran',
    description:
      'Sea-view corporate offices over two connected floors, currently leased to a regional logistics group. Efficient column-free plate with a private ground-floor entrance and visitor parking.',
    features: 'Sea views\nColumn-free floor plate\nPrivate entrance\nGenerator backup\nVisitor parking',
    images: ['/img/commercial-3.jpg'],
    featured: false,
  },
  {
    title: 'El Biar Garden Residences — Apt 12',
    type: 'residential',
    status: 'available',
    price: 2400,
    area_sqm: 185,
    beds: 3,
    address: '8 Rue des Jardins, El Biar',
    city: 'Algiers',
    description:
      'Light-filled three-bedroom apartment opening onto a shared landscaped garden. Renovated kitchen, generous living room with balcony, and secure gated parking in a quiet residential street.',
    features: 'Private balcony\nGated parking\nElevator\nSplit-system A/C\nFurnished option available',
    images: ['/img/residential-1.jpg'],
    featured: true,
  },
  {
    title: 'Kouba Family Villa',
    type: 'residential',
    status: 'available',
    price: 3900,
    area_sqm: 420,
    beds: 5,
    address: 'Route de Birkhadem, Kouba',
    city: 'Algiers',
    description:
      'Detached five-bedroom villa with mature olive garden, staff quarters and a double garage. Two living reception rooms, roof terrace, and independent studio suitable for guests or home office.',
    features: 'Private garden\nRoof terrace\nGuest studio\nDouble garage\nMains water tank + pump',
    images: ['/img/residential-2.jpg'],
    featured: false,
  },
  {
    title: 'Constantine Riverside Flat — Apt 7',
    type: 'residential',
    status: 'leased',
    price: 1450,
    area_sqm: 110,
    beds: 2,
    address: 'Cité Ferhat Boussaad, Constantine',
    city: 'Constantine',
    description:
      'Two-bedroom apartment overlooking the Rhumel valley, with a long south-facing terrace. Recently refurbished throughout; leased to a long-term corporate tenant.',
    features: 'Valley views\nSouth terrace\nRenovated 2025\nElevator\nCellar storage',
    images: ['/img/residential-3.jpg'],
    featured: false,
  },
  {
    title: 'Rouiba Logistics Hub — Unit B2',
    type: 'warehouse',
    status: 'available',
    price: 12000,
    area_sqm: 3200,
    beds: null,
    address: 'Zone Industrielle, Route de l’Ouest, Rouiba',
    city: 'Algiers',
    description:
      'Modern cross-dock logistics unit with twelve loading positions, 11m clear height and a secured 4,000m² yard. Connected to the airport–port corridor with direct heavy-vehicle access.',
    features: '12 loading docks\n11m clear height\nSecured yard (4,000m²)\n3-phase power 400A\nOffice mezzanine 180m²',
    images: ['/img/warehouse-1.jpg'],
    featured: true,
  },
  {
    title: 'Es Sénia Distribution Park — Unit 5',
    type: 'warehouse',
    status: 'available',
    price: 7400,
    area_sqm: 1800,
    beds: null,
    address: 'Es Sénia Distribution Park, Zone d’activité 4',
    city: 'Oran',
    description:
      'Mid-size distribution warehouse in a managed industrial park with shared weighbridge and canteen. Sprinklered, with 6 dock levellers and 800m² of attached offices.',
    features: 'Sprinkler system\n6 dock levellers\n800m² offices\nShared weighbridge\nFenced & guarded',
    images: ['/img/warehouse-2.jpg'],
    featured: false,
  },
  {
    title: 'Ain Smara Cold-Storage Store — Unit C',
    type: 'warehouse',
    status: 'leased',
    price: 5600,
    area_sqm: 950,
    beds: null,
    address: 'Ain Smara Industrial Zone',
    city: 'Batna',
    description:
      'Insulated cold-storage facility with two temperature chambers and a dedicated refrigerated dock. Leased by a regional food distributor on a five-year term.',
    features: 'Dual temperature chambers\nRefrigerated dock\nBackup generator\nHygienic wall panels\n24/7 access',
    images: ['/img/warehouse-3.jpg'],
    featured: false,
  },
];

/**
 * First-run seed: creates the initial administrator (from env variables) and
 * the demo portfolio. Every insert is guarded, so re-running is harmless.
 */
export async function runSeed(db: Db): Promise<void> {
  // 1. Administrator account ────────────────────────────────────────────
  const email = (process.env.ADMIN_EMAIL || 'admin@atlasreit.com').toLowerCase();
  const password = process.env.ADMIN_PASSWORD || 'AtlasREIT!2026';
  const name = process.env.ADMIN_NAME || 'Site Administrator';

  const existing = await db.query<{ id: number }>(
    'SELECT id FROM users WHERE email = $1',
    [email],
  );
  if (existing.length === 0) {
    await db.query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, $2, $3, 'admin')`,
      [name, email, hashPassword(password)],
    );
  }

  // 2. Portfolio listings ───────────────────────────────────────────────
  const count = await db.query<{ n: string }>(
    'SELECT COUNT(*)::int AS n FROM listings',
  );
  if (Number(count[0].n) > 0) return;

  for (const l of LISTINGS) {
    await db.query(
      `INSERT INTO listings
         (title, type, status, price, area_sqm, beds, address, city,
          description, features, images, featured)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
      [
        l.title,
        l.type,
        l.status,
        l.price,
        l.area_sqm,
        l.beds,
        l.address,
        l.city,
        l.description,
        l.features,
        JSON.stringify(l.images),
        l.featured,
      ],
    );
  }
}
