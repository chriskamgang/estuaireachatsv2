'use client';

import Link from 'next/link';
import { Sparkles, ChevronRight } from 'lucide-react';

export default function TopBar() {
  return (
    <div className="w-full bg-gradient-to-r from-[#FDEAEA] via-[#E8F0FA] to-[#DCEAFA]">
      <div className="mx-auto flex max-w-[1440px] items-center justify-center gap-2 px-3 py-1.5 text-[12px] sm:gap-3 sm:px-4 sm:py-2 sm:text-[13px]">
        <span className="font-semibold text-dark flex items-center gap-1 shrink-0 sm:gap-1.5">
          <Sparkles size={14} className="text-orange hidden sm:block" />
          Accio Work
        </span>
        <span className="text-gray-2 hidden sm:inline">|</span>
        <span className="text-gray-1 hidden sm:inline">
          Boostez votre marque avec des agents IA
        </span>
        <Link
          href="/accio-work"
          className="ml-1 flex items-center gap-1 rounded-full bg-dark px-3 py-1 text-[11px] font-semibold text-white hover:bg-gray-1 transition-colors sm:ml-2 sm:px-4 sm:text-[12px]"
        >
          Commencer
          <ChevronRight size={12} />
        </Link>
      </div>
    </div>
  );
}
