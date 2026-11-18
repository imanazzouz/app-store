import Link from 'next/link';
import { getListingCounts, getListings, getPortfolioStats } from '@/lib/listings';
import PropertyCard from '@/components/property-card';
import { typeLabels, propertyTypes } from '@/lib/validation';
import CurrencyConverter from '@/components/currency-converter';
import { getSiteSettings } from '@/lib/site-settings';

export const dynamic = 'force-dynamic';

const typeImages: Record<string, string> = {
  commercial: '/img/commercial-1.jpg',
  residential: '/img/residential-1.jpg',
  warehouse: '/img/warehouse-1.jpg',
};
const n = (value: number) => new Intl.NumberFormat('ar-DZ').format(value);

export default async function HomePage() {
  const [stats, counts, featured, settings] = await Promise.all([
    getPortfolioStats(), getListingCounts(), getListings({ availableOnly: true }), getSiteSettings(),
  ]);
  const featuredSix = [...featured].sort((a, b) => Number(b.featured) - Number(a.featured)).slice(0, 6);

  return <>
    <section className="hero">
      <div className="hero-bg" aria-hidden="true"><img src="/img/hero.jpg" alt="" fetchPriority="high" width={1920} height={1080} /></div>
      <div className="container hero-inner">
        <p className="eyebrow">محفظة عقارية متنوعة</p>
        <h1>مساحات متميزة.<br />قيمة مستدامة.</h1>
        <p className="hero-lede">تدير أطلس ريت عقارات تجارية وسكنية وصناعية في أبرز الأسواق الجزائرية، وتعرض هنا وحدات جاهزة للإيجار.</p>
        <div className="hero-ctas">
          <Link href="/properties?available=1" className="btn btn-gold btn-lg">تصفح الوحدات المتاحة</Link>
          <Link href="/#types" className="btn btn-ghost btn-lg">استكشف حسب النوع</Link>
        </div>
        <dl className="hero-stats">
          <div><dt>وحدة ضمن المحفظة</dt><dd>{n(stats.units)}</dd></div>
          <div><dt>مدينة</dt><dd>{n(stats.cities)}</dd></div>
          <div><dt>متاحة حالياً</dt><dd>{n(stats.available)}</dd></div>
          <div><dt>نسبة الإشغال</dt><dd>{n(stats.occupancy)}٪</dd></div>
        </dl>
      </div>
    </section>

    <section className="section" id="types"><div className="container">
      <div className="section-head"><div><p className="eyebrow dark">أنواع العقارات</p><h2>ثلاثة قطاعات بمعيار واحد من العناية</h2></div><Link href="/properties" className="link-arrow">عرض كامل المحفظة ←</Link></div>
      <div className="type-grid">{propertyTypes.map((type) => <Link key={type} href={`/properties?type=${type}`} className="type-card">
        <img src={typeImages[type]} alt={`عقار ${typeLabels[type]}`} loading="lazy" width={640} height={420} />
        <div className="type-card-body"><h3>{typeLabels[type]}</h3><p>{n(counts[type] ?? 0)} وحدة ضمن المحفظة</p><span className="link-arrow">استكشف ←</span></div>
      </Link>)}</div>
    </div></section>

    <section className="section section-alt" id="featured"><div className="container">
      <div className="section-head"><div><p className="eyebrow dark">متاحة للإيجار الآن</p><h2>وحدات جاهزة لتكون مساحتك القادمة</h2></div><Link href="/properties?available=1" className="link-arrow">عرض جميع المتاح ←</Link></div>
      {featuredSix.length ? <div className="card-grid">{featuredSix.map((listing) => <PropertyCard key={listing.id} listing={listing} />)}</div> : <p className="empty-note">لا توجد وحدات متاحة حالياً، يرجى زيارة الموقع لاحقاً.</p>}
    </div></section>

    <section className="section" id="how-it-works"><div className="container">
      <div className="section-head center"><div><p className="eyebrow dark">كيف نعمل</p><h2>من أول معاينة إلى توقيع العقد</h2></div></div>
      <ol className="steps">
        <li><span className="step-num">١</span><h3>تصفح المحفظة</h3><p>اختر نوع العقار وافتح صفحة الوحدة للاطلاع على الصور والمواصفات والسعر.</p></li>
        <li><span className="step-num">٢</span><h3>أرسل استفساراً</h3><p>أدخل اسمك وبريدك ورسالتك. لا حاجة إلى رفع أي مستندات في هذه المرحلة.</p></li>
        <li><span className="step-num">٣</span><h3>نتواصل معك</h3><p>يراجع فريق التأجير طلبك ويتواصل معك عبر البريد الإلكتروني لمتابعة الخطوات.</p></li>
      </ol>
    </div></section>

    <CurrencyConverter rate={settings.usd_to_dzd_rate} />

    <section className="cta-band"><div className="container cta-inner"><div><h2>وجدت الوحدة المناسبة؟</h2><p>أرسل استفسارك في أقل من دقيقة وسنتولى متابعة طلبك.</p></div><Link href="/properties" className="btn btn-gold btn-lg">تصفح المحفظة</Link></div></section>
  </>;
}
