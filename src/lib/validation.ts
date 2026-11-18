import { z } from 'zod';

export const propertyTypes = ['commercial', 'residential', 'warehouse'] as const;
export type PropertyType = (typeof propertyTypes)[number];

export const typeLabels: Record<PropertyType, string> = {
  commercial: 'تجاري',
  residential: 'سكني',
  warehouse: 'مستودع',
};

/* ── Public enquiry form ─────────────────────────────────────────────── */
export const enquirySchema = z.object({
  listingId: z.coerce.number().int().positive(),
  name: z.string().trim().min(2, 'يرجى إدخال الاسم.').max(120),
  email: z.string().trim().email('يرجى إدخال بريد إلكتروني صالح.').max(200),
  phone: z
    .string()
    .trim()
    .max(40, 'رقم الهاتف طويل جداً.')
    .regex(/^[0-9+\s()\-]*$/, 'يحتوي رقم الهاتف على رموز غير صالحة.')
    .or(z.literal(''))
    .optional()
    .default(''),
  message: z.string().trim().max(2000, 'الرسالة طويلة جداً.').optional().default(''),
  // Honeypot: real users never fill this hidden field.
  company: z.string().max(0).optional().default(''),
});
export type EnquiryInput = z.infer<typeof enquirySchema>;

/* ── Staff listing form ──────────────────────────────────────────────── */
export const listingSchema = z.object({
  unit_id: z.preprocess((v) => v === '' || v === null ? undefined : v, z.coerce.number().int().positive().optional()),
  title: z.string().trim().min(3, 'العنوان قصير جداً.').max(160),
  type: z.enum(propertyTypes),
  status: z.enum(['available', 'leased']),
  price: z.coerce.number().positive('يجب أن يكون السعر أكبر من صفر.').max(100_000_000),
  area_sqm: z.coerce.number().int().positive('يجب إدخال مساحة صحيحة أكبر من صفر.').max(1_000_000),
  beds: z.coerce.number().int().min(0).max(100).nullable().optional(),
  address: z.string().trim().max(300).default(''),
  city: z.string().trim().max(120).default(''),
  description: z.string().trim().min(20, 'يجب ألا يقل الوصف عن ٢٠ حرفاً.').max(5000),
  features: z.string().trim().max(3000).default(''),
  images: z
    .array(
      z
        .string()
        .trim()
        .max(500, 'رابط الصورة طويل جداً.')
        .refine(
          (v) => /^https?:\/\/\S+$/i.test(v) || v.startsWith('/'),
          'يجب أن يكون رابط الصورة كاملاً أو مساراً مثل /img/photo.jpg',
        ),
    )
    .max(12)
    .default([]),
  featured: z.boolean().default(false),
});
export type ListingInput = z.infer<typeof listingSchema>;

/* ── Normalized property and unit management ──────────────────────────── */
export const propertySchema = z.object({
  code: z.string().trim().min(2, 'رمز العقار مطلوب.').max(32).regex(/^[A-Za-z0-9_-]+$/, 'استخدم الأحرف اللاتينية والأرقام والشرطة فقط في الرمز.'),
  name: z.string().trim().min(2, 'اسم العقار مطلوب.').max(160),
  type: z.enum(['commercial', 'residential', 'warehouse', 'mixed']),
  description: z.string().trim().max(3000).default(''),
  address: z.string().trim().max(300).default(''),
  wilaya: z.string().trim().min(2).max(100),
  municipality: z.string().trim().min(2).max(100),
  construction_year: z.preprocess((v) => v === '' || v === null ? undefined : v, z.coerce.number().int().min(1700).max(2200).optional()),
  total_area_sqm: z.preprocess((v) => v === '' || v === null ? undefined : v, z.coerce.number().positive().max(100_000_000).optional()),
  owner_id: z.preprocess((v) => v === '' || v === null ? undefined : v, z.coerce.number().int().positive().optional()),
  portfolio_id: z.preprocess((v) => v === '' || v === null ? undefined : v, z.coerce.number().int().positive().optional()),
});
export type PropertyInput = z.infer<typeof propertySchema>;

export const unitSchema = z.object({
  property_id: z.coerce.number().int().positive(),
  code: z.string().trim().min(1).max(32),
  label: z.string().trim().max(120).default(''),
  type: z.enum(propertyTypes),
  floor: z.string().trim().max(32).default(''),
  area_sqm: z.coerce.number().positive().max(1_000_000),
  bedrooms: z.preprocess((v) => v === '' || v === null ? undefined : v, z.coerce.number().int().min(0).max(100).optional()),
  asking_rent: z.coerce.number().min(0).max(100_000_000),
  proposed_deposit: z.coerce.number().min(0).max(100_000_000).default(0),
  operating_status: z.enum(['active', 'maintenance', 'out_of_service']).default('active'),
  occupancy_status: z.enum(['vacant', 'reserved', 'leased']).default('vacant'),
  internal_notes: z.string().trim().max(2000).default(''),
});
export type UnitInput = z.infer<typeof unitSchema>;

export const ownerSchema = z.object({
  owner_type: z.enum(['individual','company']).default('individual'),
  legal_name: z.string().trim().min(2).max(180),
  email: z.string().trim().email().max(200).or(z.literal('')).default(''),
  phone: z.string().trim().max(40).default(''),
  mailing_address: z.string().trim().max(300).default(''),
});
export type OwnerInput = z.infer<typeof ownerSchema>;
export const portfolioSchema = z.object({
  code: z.string().trim().min(2).max(32).regex(/^[A-Za-z0-9_-]+$/),
  name: z.string().trim().min(2).max(160),
  description: z.string().trim().max(2000).default(''),
});
export type PortfolioInput = z.infer<typeof portfolioSchema>;

export const tenantSchema = z.object({
  tenant_type: z.enum(['individual','company']).default('individual'),
  legal_name: z.string().trim().min(2).max(180),
  email: z.string().trim().email().max(200).or(z.literal('')).default(''),
  phone: z.string().trim().max(40).default(''),
  mailing_address: z.string().trim().max(300).default(''),
});
export type TenantInput = z.infer<typeof tenantSchema>;
export const leaseSchema = z.object({
  unit_id: z.coerce.number().int().positive(),
  tenant_id: z.coerce.number().int().positive(),
  start_date: z.string().date(),
  end_date: z.string().date(),
  rent_amount: z.coerce.number().positive().max(100_000_000),
  rent_period: z.enum(['monthly','quarterly','semiannual','annual']).default('monthly'),
  due_day: z.coerce.number().int().min(1).max(28).default(1),
  security_deposit: z.coerce.number().min(0).max(100_000_000).default(0),
});
export type LeaseInput = z.infer<typeof leaseSchema>;
export const paymentSchema = z.object({
  idempotency_key: z.string().uuid(),
  amount: z.coerce.number().positive().max(100_000_000),
  payment_date: z.string().date(),
  method: z.enum(['cash','bank_transfer','cheque','card','other']),
  reference: z.string().trim().max(120).default(''),
  notes: z.string().trim().max(1000).default(''),
  allocations: z.array(z.object({ invoice_id: z.coerce.number().int().positive(), amount: z.coerce.number().positive() })).min(1).max(50),
});
export type PaymentInput = z.infer<typeof paymentSchema>;
export const maintenanceRequestSchema = z.object({
  unit_id: z.coerce.number().int().positive(),
  reporter_name: z.string().trim().max(120).default(''),
  description: z.string().trim().min(5).max(2000),
  category: z.string().trim().min(2).max(80).default('general'),
  priority: z.enum(['low','normal','high','urgent']).default('normal'),
});
export type MaintenanceRequestInput=z.infer<typeof maintenanceRequestSchema>;
export const maintenanceStatusSchema = z.object({status:z.enum(['new','triaged','assigned','in_progress','awaiting_approval','resolved','closed','cancelled'])});
export const vendorSchema=z.object({name:z.string().trim().min(2).max(180),contact_name:z.string().trim().max(120).default(''),email:z.string().trim().email().max(200).or(z.literal('')).default(''),phone:z.string().trim().max(40).default(''),service_type:z.string().trim().max(100).default('')});
export const workOrderSchema=z.object({request_id:z.coerce.number().int().positive(),vendor_id:z.preprocess(v=>v===''||v===null?undefined:v,z.coerce.number().int().positive().optional()),quote_amount:z.coerce.number().min(0).max(100_000_000),scheduled_at:z.preprocess(v=>v===''||v===null?undefined:v,z.string().datetime().optional()),materials:z.string().trim().max(2000).default('')});
export const workOrderStatusSchema=z.object({status:z.enum(['approved','in_progress','completed','cancelled']),final_cost:z.coerce.number().min(0).max(100_000_000).optional()});
export const expenseSchema = z.object({
  expense_number: z.string().trim().min(2).max(48),
  property_id: z.preprocess((v)=>v===''||v===null?undefined:v,z.coerce.number().int().positive().optional()),
  unit_id: z.preprocess((v)=>v===''||v===null?undefined:v,z.coerce.number().int().positive().optional()),
  vendor_name: z.string().trim().max(180).default(''),
  category: z.string().trim().min(2).max(80),
  description: z.string().trim().max(1000).default(''),
  amount: z.coerce.number().positive().max(100_000_000),
  expense_date: z.string().date(),
  due_date: z.preprocess((v)=>v===''||v===null?undefined:v,z.string().date().optional()),
  status: z.enum(['unpaid','paid']).default('unpaid'),
});
export type ExpenseInput=z.infer<typeof expenseSchema>;
const optionalHttpUrl=z.string().trim().max(300).refine(v=>!v||/^https:\/\//i.test(v),'أدخل رابطاً يبدأ بـ https://').default('');
export const siteSettingsSchema=z.object({
  usd_to_dzd_rate:z.preprocess(v=>v===''||v===null?undefined:v,z.coerce.number().positive().max(1_000_000).optional()),
  contact_email:z.string().trim().max(200).email().or(z.literal('')).default(''),
  contact_phone:z.string().trim().max(40).default(''),
  contact_whatsapp:z.string().trim().max(40).default(''),
  contact_address:z.string().trim().max(300).default(''),
  contact_website:optionalHttpUrl,
  contact_facebook:optionalHttpUrl,
  contact_instagram:optionalHttpUrl,
  contact_linkedin:optionalHttpUrl,
  tax_rate_percent:z.preprocess(v=>v===''||v===null?0:v,z.coerce.number().min(0).max(100).default(0)),
  invoice_fee_amount:z.preprocess(v=>v===''||v===null?0:v,z.coerce.number().min(0).max(100_000_000).default(0)),
  lease_notice_days:z.string().trim().default('90,60,30').refine(v=>{const n=v.split(',').map(x=>Number(x.trim()));return n.length>0&&n.every(x=>[30,60,90].includes(x))&&new Set(n).size===n.length},'استخدم أيام تنبيه من 30 و60 و90 فقط.'),
  late_fees_enabled:z.preprocess(v=>v===true||v==='true'||v==='on',z.boolean()).default(false),
  early_termination_proration_enabled:z.preprocess(v=>v===true||v==='true'||v==='on',z.boolean()).default(true),
  termination_fees_enabled:z.preprocess(v=>v===true||v==='true'||v==='on',z.boolean()).default(false),
});
export type SiteSettingsInput=z.infer<typeof siteSettingsSchema>;

export const leadStages = ['new','contacted','qualified','visit_scheduled','visited','offer_sent','negotiating','won','lost'] as const;
export const leadSchema = z.object({
  contact_name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(200).or(z.literal('')).default(''),
  phone: z.string().trim().max(40).default(''),
  message: z.string().trim().max(2000).default(''),
  source: z.enum(['website','phone','email','manual','campaign']).default('manual'),
  listing_id: z.preprocess((v) => v === '' || v === null ? undefined : v, z.coerce.number().int().positive().optional()),
  assigned_user_id: z.preprocess((v) => v === '' || v === null ? undefined : v, z.coerce.number().int().positive().optional()),
});
export type LeadInput = z.infer<typeof leadSchema>;
export const leadStageSchema = z.object({ stage: z.enum(leadStages), note: z.string().trim().max(500).default('') });
export const visitSchema = z.object({
  lead_id: z.coerce.number().int().positive(),
  unit_id: z.preprocess((v) => v === '' || v === null ? undefined : v, z.coerce.number().int().positive().optional()),
  assigned_user_id: z.preprocess((v) => v === '' || v === null ? undefined : v, z.coerce.number().int().positive().optional()),
  scheduled_at: z.string().datetime(),
  notes: z.string().trim().max(1000).default(''),
});
export type VisitInput = z.infer<typeof visitSchema>;

/* ── Staff account forms ─────────────────────────────────────────────── */
export const loginSchema = z.object({
  email: z.string().trim().email().max(200),
  password: z.string().min(1, 'Password is required.').max(200),
});

const strongPassword=z.string().min(12,'استخدم ١٢ حرفاً على الأقل.').max(200)
  .regex(/[a-z]/,'أضف حرفاً لاتينياً صغيراً.')
  .regex(/[A-Z]/,'أضف حرفاً لاتينياً كبيراً.')
  .regex(/[0-9]/,'أضف رقماً.');
export const passwordChangeSchema = z.object({
  current: z.string().min(1).max(200),
  next: strongPassword,
});

export const createUserSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(200),
  password: strongPassword,
  role: z.enum(['admin','editor','property_staff','property_manager','accountant','general_manager']).default('property_staff'),
});
export const leaseTerminationSchema=z.object({effective_date:z.string().date(),reason:z.string().trim().min(5).max(1000),exception_terms:z.string().trim().max(1000).default('')});
export type LeaseTerminationInput=z.infer<typeof leaseTerminationSchema>;
export const leaseRenewalSchema=z.object({new_start_date:z.string().date(),new_end_date:z.string().date(),new_rent_amount:z.coerce.number().positive().max(100_000_000),note:z.string().trim().max(1000).default('')}).refine(v=>v.new_end_date>v.new_start_date,'تاريخ النهاية يجب أن يسبق تاريخ البداية.');
export type LeaseRenewalInput=z.infer<typeof leaseRenewalSchema>;
export const leaseRenewalDecisionSchema=z.object({decision:z.enum(['approved','rejected']),note:z.string().trim().max(1000).default('')});
export type LeaseRenewalDecisionInput=z.infer<typeof leaseRenewalDecisionSchema>;
export const userRoleSchema=z.object({role:z.enum(['admin','editor','property_staff','property_manager','accountant','general_manager'])});
export const terminationDecisionSchema=z.object({decision:z.enum(['approved','rejected']),note:z.string().trim().max(1000).default('')});
export type TerminationDecisionInput=z.infer<typeof terminationDecisionSchema>;
export const depositReceiptSchema=z.object({lease_id:z.coerce.number().int().positive(),amount:z.coerce.number().positive().max(100_000_000),transaction_date:z.string().date(),payment_method:z.enum(['cash','bank_transfer','cheque','card','other']),reference:z.string().trim().max(120).default(''),note:z.string().trim().min(2).max(500)});
export type DepositReceiptInput=z.infer<typeof depositReceiptSchema>;
export const depositDeductionSchema=z.object({lease_id:z.coerce.number().int().positive(),amount:z.coerce.number().positive().max(100_000_000),reason:z.string().trim().min(5).max(1000),document_urls:z.array(z.string().trim().url().max(500).refine(v=>v.startsWith('https://'),'يجب أن تكون روابط المستندات آمنة (HTTPS).')).max(5).default([])});
export type DepositDeductionInput=z.infer<typeof depositDeductionSchema>;
export const depositRefundSchema=z.object({lease_id:z.coerce.number().int().positive(),amount:z.coerce.number().positive().max(100_000_000),transaction_date:z.string().date(),payment_method:z.enum(['cash','bank_transfer','cheque','card','other']),reference:z.string().trim().max(120).default(''),note:z.string().trim().min(2).max(500)});
export type DepositRefundInput=z.infer<typeof depositRefundSchema>;
export const paymentReversalSchema=z.object({payment_id:z.coerce.number().int().positive(),reversal_type:z.enum(['refund','void']),amount:z.coerce.number().positive().max(100_000_000),payment_date:z.string().date(),method:z.enum(['cash','bank_transfer','cheque','card','other']),reference:z.string().trim().max(120).default(''),reason:z.string().trim().min(5).max(1000)});
export type PaymentReversalInput=z.infer<typeof paymentReversalSchema>;
export const reversalDecisionSchema=z.object({decision:z.enum(['approved','rejected']),note:z.string().trim().max(1000).default('')});
export type ReversalDecisionInput=z.infer<typeof reversalDecisionSchema>;
export const tenantAuthRequestSchema=z.object({email:z.string().trim().email().max(200)});
export const tenantTokenCompletionSchema=z.object({token:z.string().min(40).max(100),password:strongPassword});
