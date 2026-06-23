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
      <div className="relative w-full border-b border-gray-5 bg-white">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between px-6">
          {/* Left side */}
          <div className="flex items-center">
            <div
              onMouseEnter={() => setMegaOpen(true)}
            >
              <button className="flex items-center gap-1.5 pr-3 py-2.5 text-[13px] font-semibold text-dark transition-colors hover:text-primary">
                <Menu size={16} />
                Toutes les categories
              </button>
            </div>
            {leftLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-3 py-2.5 text-[13px] text-gray-1 transition-colors hover:text-primary"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right side */}
          <div className="flex items-center">
            {rightLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-3 py-2.5 text-[13px] text-gray-1 transition-colors hover:text-primary"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Full-page Mega Menu (rendered outside nav so hover zone covers everything) */}
      {megaOpen && <MegaMenu onClose={() => setMegaOpen(false)} />}
    </>
  );
}
