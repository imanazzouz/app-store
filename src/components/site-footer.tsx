import Link from 'next/link';
import { BrandMark } from './site-header';

export default function SiteFooter() {
  return (
    <footer className="site-footer" id="contact">
      <div className="container footer-grid">
        <div className="footer-brand">
          <Link href="/" className="brand">
            <BrandMark />
            <span className="brand-name">
              ATLAS <b>REIT</b>
            </span>
          </Link>
          <p>
            A diversified rental portfolio of commercial, residential and
            industrial property — managed for the long term.
          </p>
        </div>

        <div>
          <h4>Explore</h4>
          <ul className="footer-links">
            <li>
              <Link href="/properties">All properties</Link>
            </li>
            <li>
              <Link href="/properties?type=commercial">Commercial</Link>
            </li>
            <li>
              <Link href="/properties?type=residential">Residential</Link>
            </li>
            <li>
              <Link href="/properties?type=warehouse">Warehouse</Link>
            </li>
          </ul>
        </div>

        <div>
          <h4>Contact</h4>
          <ul className="footer-links footer-contact">
            <li>17 Chemin Villa des Glycines, Algiers</li>
            <li>
              <a href="mailto:leasing@atlasreit.com">leasing@atlasreit.com</a>
            </li>
            <li>
              <a href="tel:+21321000000">+213 (0) 21 00 00 00</a>
            </li>
            <li>Sun–Thu · 9:00–17:00</li>
          </ul>
        </div>

        <div>
          <h4>Enquiries</h4>
          <p className="footer-note">
            Found a unit you like? Send an enquiry from its page — our leasing
            team replies personally with the full application pack.
          </p>
          <Link href="/properties" className="btn btn-gold btn-sm">
            Browse available units
          </Link>
        </div>
      </div>

      <div className="container footer-bottom">
        <span>© {new Date().getFullYear()} Atlas REIT. All rights reserved.</span>
        <Link href="/admin/login" className="staff-login">
          Staff login →
        </Link>
      </div>
    </footer>
  );
}
