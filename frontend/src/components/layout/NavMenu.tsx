'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useI18n } from '@/i18n/I18nProvider';
import type { MessageKey } from '@/i18n/dictionaries';

const LINKS: { href: string; label: MessageKey }[] = [
  { href: '/orders', label: 'navOrders' },
  { href: '/products', label: 'navProducts' },
  { href: '/stats', label: 'navStats' },
  { href: '/map', label: 'navMap' },
  { href: '/users', label: 'navUsers' },
  { href: '/settings', label: 'navSettings' }
];

export default function NavMenu() {
  const pathname = usePathname();
  const { t } = useI18n();
  return (
    <nav className="nav-menu" aria-label="Main">
      {LINKS.map((l) => (
        <Link key={l.href} href={l.href} className={`nav-menu__link ${pathname.startsWith(l.href) ? 'nav-menu__link--active' : ''}`}>
          {t(l.label)}
        </Link>
      ))}
    </nav>
  );
}
