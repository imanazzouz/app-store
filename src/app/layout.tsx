import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  title: {
    default: 'أطلس ريت — المحفظة العقارية',
    template: '%s · أطلس ريت',
  },
  description:
    'أطلس ريت تدير عقارات تجارية وسكنية وصناعية في الجزائر. تصفح الوحدات المتاحة وأرسل استفسارك ليتواصل معك فريقنا.',
  openGraph: {
    title: 'أطلس ريت — المحفظة العقارية',
    description: 'عقارات تجارية وسكنية ومستودعات متاحة للإيجار في الجزائر.',
    type: 'website',
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0d1f33',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
