'use client';

import Link from 'next/link';
import { Sparkles, ChevronRight } from 'lucide-react';

export default function TopBar() {
  return (
    <div className="w-full bg-gradient-to-r from-[#FDEAEA] via-[#E8F0FA] to-[#DCEAFA]">
      <div className="mx-auto flex max-w-[1440px] items-center justify-center gap-3 px-4 py-2 text-[13px]">
        <span className="font-semibold text-dark flex items-center gap-1.5">
          <Sparkles size={14} className="text-orange" />
          Accio Work
        </span>
        <span className="text-gray-2">|</span>
        <span className="text-gray-1">
          Boostez votre marque avec des agents IA
        </span>
        <Link
          href="/accio-work"
          className="ml-2 flex items-center gap-1 rounded-full bg-dark px-4 py-1 text-[12px] font-semibold text-white hover:bg-gray-1 transition-colors"
        >
          Commencer gratuitement
          <ChevronRight size={12} />
        </Link>
      </div>
    </div>
  );
}
