import SiteHeader from '@/components/site-header';
import SiteFooter from '@/components/site-footer';
import DemoBanner from '@/components/demo-banner';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="site">
      <DemoBanner />
      <SiteHeader />
      <main id="main">{children}</main>
      <SiteFooter />
    </div>
  );
}
