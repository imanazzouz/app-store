import { query, withTransaction } from './db';
import type { SiteSettingsInput } from './validation';

export type SiteSettings = {
  usd_to_dzd_rate: string;
  contact_email: string;
  contact_phone: string;
  contact_whatsapp: string;
  contact_address: string;
  contact_website: string;
  contact_facebook: string;
  contact_instagram: string;
  contact_linkedin: string;
  tax_rate_percent:string;
  invoice_fee_amount:string;
  lease_notice_days:string;
  late_fees_enabled:string;
  early_termination_proration_enabled:string;
  termination_fees_enabled:string;
};
const keys: (keyof SiteSettings)[] = ['usd_to_dzd_rate','contact_email','contact_phone','contact_whatsapp','contact_address','contact_website','contact_facebook','contact_instagram','contact_linkedin','tax_rate_percent','invoice_fee_amount','lease_notice_days','late_fees_enabled','early_termination_proration_enabled','termination_fees_enabled'];
const defaults:Partial<SiteSettings>={tax_rate_percent:'0',invoice_fee_amount:'0',lease_notice_days:'90,60,30',late_fees_enabled:'false',early_termination_proration_enabled:'true',termination_fees_enabled:'false'};
export async function getSiteSettings():Promise<SiteSettings>{
  const rows=await query<{setting_key:string;setting_value:string}>('SELECT setting_key,setting_value FROM site_settings');
  const values=new Map(rows.map(row=>[row.setting_key,row.setting_value]));
  return Object.fromEntries(keys.map(key=>[key,values.get(key)??defaults[key]??''])) as SiteSettings;
}
export async function updateSiteSettings(input:SiteSettingsInput,userId:number):Promise<void>{
  await withTransaction(async tx=>{
    for(const key of keys){
      await tx.query(`INSERT INTO site_settings(setting_key,setting_value,updated_by,updated_at) VALUES($1,$2,$3,now()) ON CONFLICT(setting_key) DO UPDATE SET setting_value=EXCLUDED.setting_value,updated_by=EXCLUDED.updated_by,updated_at=now()`,[key,input[key]??'',userId]);
    }
    await tx.query("INSERT INTO audit_logs(user_id,entity_type,entity_id,action) VALUES($1,'site_settings','global','update')",[userId]);
  });
}
