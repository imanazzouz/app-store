import { z } from 'zod';

export const propertyTypes = ['commercial', 'residential', 'warehouse'] as const;
export type PropertyType = (typeof propertyTypes)[number];

export const typeLabels: Record<PropertyType, string> = {
  commercial: 'Commercial',
  residential: 'Residential',
  warehouse: 'Warehouse',
};

/* ── Public enquiry form ─────────────────────────────────────────────── */
export const enquirySchema = z.object({
  listingId: z.coerce.number().int().positive(),
  name: z.string().trim().min(2, 'Please enter your name.').max(120),
  email: z.string().trim().email('Please enter a valid email address.').max(200),
  phone: z
    .string()
    .trim()
    .max(40, 'Phone number is too long.')
    .regex(/^[0-9+\s()\-]*$/, 'Phone number contains invalid characters.')
    .or(z.literal(''))
    .optional()
    .default(''),
  message: z.string().trim().max(2000, 'Message is too long.').optional().default(''),
  // Honeypot: real users never fill this hidden field.
  company: z.string().max(0).optional().default(''),
});
export type EnquiryInput = z.infer<typeof enquirySchema>;

/* ── Staff listing form ──────────────────────────────────────────────── */
export const listingSchema = z.object({
  title: z.string().trim().min(3, 'Title is too short.').max(160),
  type: z.enum(propertyTypes),
  status: z.enum(['available', 'leased']),
  price: z.coerce.number().positive('Price must be greater than 0.').max(100_000_000),
  area_sqm: z.coerce.number().int().positive('Area must be a positive whole number.').max(1_000_000),
  beds: z.coerce.number().int().min(0).max(100).nullable().optional(),
  address: z.string().trim().max(300).default(''),
  city: z.string().trim().max(120).default(''),
  description: z.string().trim().min(20, 'Description should be at least 20 characters.').max(5000),
  features: z.string().trim().max(3000).default(''),
  images: z
    .array(
      z
        .string()
        .trim()
        .max(500, 'Image link is too long.')
        .refine(
          (v) => /^https?:\/\/\S+$/i.test(v) || v.startsWith('/'),
          'Each image must be an absolute URL or a site path like /img/photo.jpg',
        ),
    )
    .max(12)
    .default([]),
  featured: z.boolean().default(false),
});
export type ListingInput = z.infer<typeof listingSchema>;

/* ── Staff account forms ─────────────────────────────────────────────── */
export const loginSchema = z.object({
  email: z.string().trim().email().max(200),
  password: z.string().min(1, 'Password is required.').max(200),
});

export const passwordChangeSchema = z.object({
  current: z.string().min(1).max(200),
  next: z.string().min(8, 'New password must be at least 8 characters.').max(200),
});

export const createUserSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(200),
  password: z.string().min(8, 'Password must be at least 8 characters.').max(200),
  role: z.enum(['admin', 'editor']).default('editor'),
});
