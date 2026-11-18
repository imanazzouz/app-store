import Link from 'next/link';
import { BrandMark } from './site-header';
import { getSiteSettings } from '@/lib/site-settings';

export default async function SiteFooter() {
  const settings = await getSiteSettings();
  const social = [
    ['فيسبوك', settings.contact_facebook], ['إنستغرام', settings.contact_instagram],
    ['لينكدإن', settings.contact_linkedin], ['الموقع الإلكتروني', settings.contact_website],
  ].filter((item): item is [string, string] => Boolean(item[1]));
  const hasContact = Boolean(settings.contact_email || settings.contact_phone || settings.contact_whatsapp || settings.contact_address || social.length);
  const whatsapp = settings.contact_whatsapp.replace(/\\D/g, '');
  return (
    <footer className="site-footer" id="contact">
      <div className="container footer-grid">
        <div className="footer-brand">
          <Link href="/" className="brand"><BrandMark /><span className="brand-name">ATLAS <b>REIT</b></span></Link>
          <p>محفظة عقارية متنوعة من العقارات التجارية والسكنية والصناعية، بإدارة تستهدف القيمة طويلة الأمد.</p>
        </div>
        <div>
          <h4>استكشف</h4>
          <ul className="footer-links">
            <li><Link href="/properties">جميع العقارات</Link></li>
            <li><Link href="/properties?type=commercial">عقارات تجارية</Link></li>
            <li><Link href="/properties?type=residential">عقارات سكنية</Link></li>
            <li><Link href="/properties?type=warehouse">مستودعات</Link></li>
          </ul>
        </div>
        {hasContact && <div>
          <h4>تواصل معنا</h4>
          <ul className="footer-links footer-contact">
            {settings.contact_address && <li>{settings.contact_address}</li>}
            {settings.contact_email && <li><a href={`mailto:${settings.contact_email}`}>{settings.contact_email}</a></li>}
            {settings.contact_phone && <li><a href={`tel:${settings.contact_phone.replace(/[^+0-9]/g, '')}`}>{settings.contact_phone}</a></li>}
            {settings.contact_whatsapp && <li><a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noreferrer">واتساب: {settings.contact_whatsapp}</a></li>}
            {social.map(([label,url])=><li key={label}><a href={url} target="_blank" rel="noreferrer">{label}</a></li>)}
          </ul>
        </div>}
        <div>
          <h4>الاستفسارات</h4>
          <p className="footer-note">هل وجدت العقار المناسب؟ أرسل استفسارك من صفحته وسيتواصل معك فريق التأجير.</p>
          <Link href="/properties" className="btn btn-gold btn-sm">تصفح العقارات المتاحة</Link>
        </div>
      </div>
      <div className="container footer-bottom">
        <span>© {new Date().getFullYear()} Atlas REIT. جميع الحقوق محفوظة.</span>
        <div className="footer-account-links"><Link href="/portal/login">بوابة المستأجر</Link><Link href="/admin/login" className="staff-login">دخول الموظفين ←</Link></div>
      </div>
    </footer>
  );
}
