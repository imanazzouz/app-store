import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  title: {
    default: 'Atlas REIT — Rental Portfolio',
    template: '%s · Atlas REIT',
  },
  description:
    'Atlas REIT owns and manages commercial, residential and industrial rental property across Algeria. Browse available units and send an enquiry — our team follows up personally with the full application pack.',
  openGraph: {
    title: 'Atlas REIT — Rental Portfolio',
    description: 'Commercial, residential and warehouse units available to lease.',
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
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
