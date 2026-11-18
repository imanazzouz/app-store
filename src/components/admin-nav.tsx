'use client';
import Link from 'next/link';import{usePathname}from'next/navigation';
type Role='admin'|'editor'|'property_staff'|'property_manager'|'accountant'|'general_manager';
const ALL:Role[]=['admin','editor','property_staff','property_manager','accountant','general_manager'];
const PROPERTY:Role[]=['admin','editor','property_staff','property_manager','general_manager'];
const FINANCE:Role[]=['admin','accountant','general_manager'];
const MANAGEMENT:Role[]=['admin','general_manager'];
const LEASING:Role[]=['admin','editor','property_staff','property_manager','general_manager'];
const LINKS=[
{href:'/admin',label:'الرئيسية',exact:true,roles:ALL},{href:'/admin/properties',label:'العقارات',roles:PROPERTY},{href:'/admin/units',label:'الوحدات',roles:PROPERTY},{href:'/admin/owners',label:'الملاك',roles:PROPERTY},{href:'/admin/portfolios',label:'المحافظ',roles:PROPERTY},{href:'/admin/listings',label:'الإعلانات',roles:PROPERTY},{href:'/admin/enquiries',label:'الاستفسارات',roles:PROPERTY},{href:'/admin/leads',label:'العملاء',roles:PROPERTY},{href:'/admin/visits',label:'الزيارات',roles:PROPERTY},{href:'/admin/tenants',label:'المستأجرون',roles:LEASING},{href:'/admin/leases',label:'العقود',roles:LEASING},{href:'/admin/invoices',label:'الفواتير',roles:FINANCE},{href:'/admin/payments',label:'الدفعات',roles:FINANCE},{href:'/admin/expenses',label:'المصروفات',roles:FINANCE},{href:'/admin/deposits',label:'الضمانات',roles:[...FINANCE,'property_manager']},{href:'/admin/maintenance',label:'الصيانة',roles:PROPERTY},{href:'/admin/reports',label:'التقارير',roles:MANAGEMENT},{href:'/admin/audit',label:'سجل التدقيق',roles:MANAGEMENT},{href:'/admin/settings',label:'الإعدادات',roles:ALL},
];
export default function AdminNav({role}:{role:string}){const pathname=usePathname();return <nav className="admin-nav" aria-label="لوحة الإدارة">{LINKS.filter(link=>link.roles.includes(role as Role)).map(link=>{const active=link.exact?pathname===link.href:pathname.startsWith(link.href);return <Link key={link.href} href={link.href} className={`admin-nav-link${active?' active':''}`} aria-current={active?'page':undefined}>{link.label}</Link>})}</nav>}
