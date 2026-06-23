'use client';

import { useState, useEffect } from 'react';
import { MessageCircle, ArrowUp } from 'lucide-react';

export default function FloatingSidebar() {
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="fixed bottom-24 right-4 z-40 flex flex-col gap-2">
      {/* Messagerie */}
      <button
        className="flex h-11 w-11 items-center justify-center rounded-full border border-gray-5 bg-white text-gray-2 shadow-md transition-colors hover:border-orange hover:text-orange"
        aria-label="Messagerie"
        title="Messagerie"
      >
        <MessageCircle size={20} />
      </button>

      {/* Scroll to top */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="flex h-11 w-11 items-center justify-center rounded-full border border-gray-5 bg-white text-gray-2 shadow-md transition-all hover:border-orange hover:text-orange"
          aria-label="Haut de page"
          title="Haut de page"
        >
          <ArrowUp size={20} />
        </button>
      )}
    </div>
  );
}
