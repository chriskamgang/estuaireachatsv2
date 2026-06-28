'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Menu } from 'lucide-react';
import MegaMenu from './MegaMenu';

const leftLinks = [
  { label: 'Fabricants Verified', href: '/verified' },
  { label: 'Protection des commandes', href: '/trade-assurance' },
];

const rightLinks = [
  { label: 'Accio Work', href: '/accio-work' },
  { label: 'Exoneration de taxes', href: '/tax-exemption' },
  { label: 'Centre des acheteurs', href: '/buyer-center' },
  { label: 'App & Extension', href: '/app' },
  { label: 'Vendre sur EstuaireAchats', href: '/sell' },
];

export default function SecondaryNav() {
  const [megaOpen, setMegaOpen] = useState(false);

  return (
    <>
      {/* Desktop nav */}
      <div className="relative hidden w-full border-b border-gray-5 bg-white md:block">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between px-6">
          <div className="flex items-center">
            <div onMouseEnter={() => setMegaOpen(true)}>
              <button className="flex items-center gap-1.5 pr-3 py-2.5 text-[13px] font-semibold text-dark transition-colors hover:text-primary">
                <Menu size={16} />
                Toutes les categories
              </button>
            </div>
            {leftLinks.map((link) => (
              <Link key={link.href} href={link.href} className="px-3 py-2.5 text-[13px] text-gray-1 transition-colors hover:text-primary">{link.label}</Link>
            ))}
          </div>
          <div className="flex items-center">
            {rightLinks.map((link) => (
              <Link key={link.href} href={link.href} className="px-3 py-2.5 text-[13px] text-gray-1 transition-colors hover:text-primary">{link.label}</Link>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile: horizontal scrollable nav */}
      <div className="w-full border-b border-gray-5 bg-white md:hidden">
        <div className="flex items-center gap-1 overflow-x-auto px-3 scrollbar-hide">
          <Link href="/categories" className="flex shrink-0 items-center gap-1 px-2.5 py-2 text-[12px] font-semibold text-dark">
            <Menu size={14} />
            Categories
          </Link>
          {leftLinks.map((link) => (
            <Link key={link.href} href={link.href} className="shrink-0 px-2.5 py-2 text-[12px] text-gray-1 hover:text-primary">{link.label}</Link>
          ))}
          {rightLinks.map((link) => (
            <Link key={link.href} href={link.href} className="shrink-0 px-2.5 py-2 text-[12px] text-gray-1 hover:text-primary">{link.label}</Link>
          ))}
        </div>
      </div>

      {megaOpen && <MegaMenu onClose={() => setMegaOpen(false)} />}
    </>
  );
}
