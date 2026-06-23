import Link from 'next/link';

const columns = [
  {
    title: "Obtenir de l'aide",
    links: [
      { label: "Centre d'assistance", href: '/help' },
      { label: 'Discussion en direct', href: '/help/chat' },
      { label: 'Verifier ma commande', href: '/orders/track' },
      { label: 'Remboursements', href: '/help/refunds' },
      { label: 'Signaler un probleme', href: '/help/report' },
    ],
  },
  {
    title: 'Paiements et protections',
    links: [
      { label: 'Paiements securises', href: '/help/payments' },
      { label: 'Politique de remboursement', href: '/help/refund-policy' },
      { label: 'Livraison & Suivi', href: '/help/shipping' },
      { label: 'Protection apres-vente', href: '/help/after-sale' },
    ],
  },
  {
    title: 'Approvisionnez-vous',
    links: [
      { label: 'Demande de devis', href: '/rfq' },
      { label: 'Adhesion premium', href: '/membership' },
      { label: 'Programme affilie', href: '/affiliate' },
    ],
  },
  {
    title: 'Vendez sur EstuaireAchats',
    links: [
      { label: 'Commencer a vendre', href: '/seller/register' },
      { label: 'Centre vendeurs', href: '/seller' },
      { label: 'Devenir fournisseur', href: '/seller/supplier' },
    ],
  },
  {
    title: 'A propos',
    links: [
      { label: 'A propos de nous', href: '/about' },
      { label: 'Politique RSE', href: '/csr' },
      { label: 'Centre nouvelles', href: '/news' },
    ],
  },
];

const paymentMethods = [
  { name: 'MTN MoMo', color: 'bg-yellow-400 text-black' },
  { name: 'Orange Money', color: 'bg-orange text-white' },
  { name: 'PayPal', color: 'bg-blue-600 text-white' },
  { name: 'Visa', color: 'bg-blue-800 text-white' },
  { name: 'Mastercard', color: 'bg-red-600 text-white' },
];

export default function Footer() {
  return (
    <footer className="w-full bg-gray-6">
      {/* Main columns */}
      <div className="mx-auto max-w-[1440px] px-4 pb-8 pt-10">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-3 lg:grid-cols-5">
          {columns.map((col) => (
            <div key={col.title}>
              <h4 className="mb-3 text-sm font-semibold text-dark">{col.title}</h4>
              <ul className="space-y-2">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-[13px] text-gray-2 transition-colors hover:text-primary"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* App download */}
        <div className="mt-10 flex flex-col items-center gap-4 border-t border-gray-5 pt-8 sm:flex-row sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-dark">
              Telecharger l&apos;application EstuaireAchats
            </p>
            <p className="mt-1 text-[12px] text-gray-3">
              Disponible sur iOS et Android
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/app"
              className="flex items-center gap-2 rounded-lg border border-gray-4 bg-white px-4 py-2 text-[13px] text-dark transition-colors hover:border-dark"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
              </svg>
              App Store
            </Link>
            <Link
              href="/app"
              className="flex items-center gap-2 rounded-lg border border-gray-4 bg-white px-4 py-2 text-[13px] text-dark transition-colors hover:border-dark"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3.18 23.67c-.37-.4-.56-.9-.56-1.47V1.8c0-.57.19-1.07.56-1.47l.08-.08L14.5 11.5v.24L3.26 23.75l-.08-.08zm14.5-8.99l3.65 2.13c1.01.59 1.01 1.55 0 2.14l-3.65 2.13-4.01-4.2 4.01-4.2zm-4.01-3.04L3.26.26l.08-.08c.37-.4.9-.52 1.48-.19l11.85 6.92-2.9 4.73zm0 7.48l2.9 4.73-11.85 6.92c-.58.33-1.11.21-1.48-.19l-.08-.08L13.67 19.12z" />
              </svg>
              Google Play
            </Link>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-gray-5 bg-white">
        <div className="mx-auto flex max-w-[1440px] flex-col items-center gap-4 px-4 py-5 sm:flex-row sm:justify-between">
          {/* Payment methods */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-1 text-[12px] text-gray-3">Modes de paiement:</span>
            {paymentMethods.map((pm) => (
              <span
                key={pm.name}
                className={`rounded px-2 py-0.5 text-[10px] font-semibold ${pm.color}`}
              >
                {pm.name}
              </span>
            ))}
          </div>

          {/* Copyright */}
          <p className="text-[12px] text-gray-3">
            &copy; {new Date().getFullYear()} EstuaireAchats. Tous droits reserves.
          </p>
        </div>
      </div>
    </footer>
  );
}
