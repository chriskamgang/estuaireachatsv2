import Link from 'next/link';

const internationalCarriers = [
  {
    name: 'KAMGA CARGO',
    type: 'IMPORT',
    phone: '658 47 94 86',
    origins: ['Chine'],
    destinations: ['Cameroun'],
    rates: [
      { label: 'Simple', price: '8 000 FCFA/kg' },
      { label: 'Sensible', price: '9 000 FCFA/kg' },
    ],
    volume: '300 000 FCFA (maritime)',
    delays: { aerien: '10 a 20 jours', maritime: '21 a 25 jours' },
    restrictions: 'Pas de cigarette electronique, gaz, power bank, drone, briquet, equipements militaires, matieres perissables, matieres cassables. Exception des telephones et laptops.',
  },
  {
    name: 'JOE CARGO',
    type: 'IMPORT / EXPORT',
    phone: '691 97 88 30',
    origins: ['Turquie', 'Inde', 'Chine', 'Dubai', 'Cameroun', 'Gabon', 'Tchad', 'Congo', 'Brazzaville', 'Cote d\'Ivoire'],
    destinations: ['Nigeria', 'Gabon', 'RCA', 'Guinee Equatoriale', 'Senegal', 'Tchad', 'Congo', 'Cameroun'],
    rates: [
      { label: 'Sensible 0-0,5kg', price: '5 000 FCFA' },
      { label: 'Sensible 0,51-1kg', price: '9 000 FCFA' },
      { label: 'Telephone', price: '15 000 FCFA' },
      { label: 'Laptop', price: '15 000 FCFA' },
      { label: 'Express', price: '11 000 FCFA/kg' },
      { label: 'Normal 0-0,5kg', price: '4 000 FCFA' },
      { label: 'Normal 0,51-1kg', price: '8 000 FCFA' },
    ],
    volume: 'CBM normal: 330 000 FCFA | CBM machine et caisse: 350 000 FCFA | Generateur, transformateur: 400 000 FCFA',
    delays: { aerien: '21 a 30 jours (sensible) / 3 a 10 jours (express) / 7 a 15 jours (normal)', maritime: '40 a 60 jours' },
    restrictions: 'Pas de cigarette electronique, gaz, power bank, drone, briquet, equipements militaires, matieres perissables, matieres cassables (sauf insistance du client). Pas de telephone, laptop (jusqu\'a nouvel ordre).',
  },
  {
    name: 'DHL',
    type: 'IMPORT / EXPORT',
    phone: '675 18 11 08 / 695 94 96 10',
    origins: ['Cameroun'],
    destinations: ['Pays voisins', 'Reste de l\'Afrique', 'Europe', 'USA', 'Canada', 'Mexique', 'Moyen Orient', 'Reste du monde'],
    rates: [
      { label: '0,5kg Pays voisins', price: '69 200 FCFA' },
      { label: '0,5kg Reste Afrique', price: '73 800 FCFA' },
      { label: '0,5kg Europe/USA/Canada', price: '56 100 FCFA' },
      { label: '0,5kg Mexique/Moyen Orient', price: '69 100 FCFA' },
      { label: '0,5kg Reste du monde', price: '73 800 FCFA' },
    ],
    volume: '30kg: 370 000 a 860 000 FCFA selon destination',
    delays: { aerien: 'Variable selon destination', maritime: '-' },
    restrictions: 'Memes restrictions que KAMGA CARGO.',
  },
];

const localAgencies = [
  {
    name: 'Camcatour Travel',
    zones: ['Bafang', 'Dschang', 'Mbouda', 'Douala', 'Bafoussam'],
    mode: 'Bus',
    tarif: '10% de la valeur de la marchandise',
    delai: '24 a 48h',
    restrictions: 'Pas de moto, gaz',
  },
  {
    name: 'Super Grand-Mifi',
    zones: ['Yaounde'],
    mode: 'Bus',
    tarif: 'Document: 1 000f | 50kg: 1 000f | 100kg: 2 000f — 10% de la valeur declaree',
    delai: '24h',
    restrictions: 'Pas d\'objet fragile, animaux, matieres perissables',
  },
  {
    name: 'Real Express',
    zones: ['Bafang', 'Yaounde', 'Bagante', 'Bamenda', 'Foumbot', 'Dschang'],
    mode: 'Bus',
    tarif: '1 000f / 40kg — 10% de la valeur declaree',
    delai: '24h',
    restrictions: 'Pas de vins, objet fragile, bouteille de gaz. Rembourse jusqu\'a 100% en cas d\'avarie.',
  },
  {
    name: 'Blue Bird',
    zones: ['Bafoussam', 'Yaounde', 'Dschang'],
    mode: 'Bus (6h-22h)',
    tarif: '44kg: 2 000f | Au-dessus: 1kg = 75f — 20% de la valeur declaree',
    delai: '24h',
    restrictions: 'Pas de pneu, objet cassable, objet dangereux, animaux, canapes. Rembourse jusqu\'a 100% de la valeur declaree.',
  },
  {
    name: 'Avenir Voyage',
    zones: ['Bafang', 'Dschang', 'Bagante', 'Bamenda', 'Foumbot', 'Koutaba', 'Foumban'],
    mode: 'Bus (6h-20h)',
    tarif: '1 300f (semaine) / 1 300f (weekend) — Minimum 15 000f — 10% de la valeur declaree',
    delai: '24h a 72h',
    restrictions: null,
  },
  {
    name: 'GENERAL',
    zones: ['Douala', 'Bafoussam', 'Dschang', 'Mbouda', 'Bamenda'],
    mode: 'Bus, Camion',
    tarif: 'Document: 1 000f minimum — 10% de la valeur declaree',
    delai: '24h',
    restrictions: null,
  },
  {
    name: 'TRESOR VOYAGE',
    zones: ['Bafoussam', 'Douala', 'Yaounde', 'Dschang'],
    mode: 'Bus',
    tarif: 'Sac de 100kg: 2 000f | 50kg: 1 500f — 10% de la valeur declaree',
    delai: '24h',
    restrictions: null,
  },
];

export default function ShippingPage() {
  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      <div className="mx-auto max-w-[1100px] px-4 py-10">
        {/* Header */}
        <div className="mb-8 text-center">
          <Link href="/" className="text-2xl font-bold text-[#E82328]">
            Estuaire<span className="text-[#4A90D9]">Achats</span>
          </Link>
        </div>

        <div className="rounded-lg bg-white p-6 shadow-sm md:p-10">
          <h1 className="mb-2 text-3xl font-bold text-[#191919]">
            Transport et Logistique
          </h1>
          <p className="mb-8 text-[15px] text-[#666]">
            Retrouvez tous nos partenaires cargo internationaux et agences de transport locales avec leurs tarifs, delais et zones desservies.
          </p>

          {/* ─── CARGO INTERNATIONAL ─── */}
          <section className="mb-12">
            <h2 className="mb-6 flex items-center gap-2 text-xl font-bold text-[#191919]">
              <span className="inline-block h-8 w-1 rounded bg-[#E82328]" />
              Entreprises Cargo Internationales
            </h2>

            <div className="space-y-6">
              {internationalCarriers.map((c) => (
                <div key={c.name} className="rounded-lg border border-gray-200 overflow-hidden">
                  <div className="bg-[#191919] px-5 py-3 flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-white">{c.name}</h3>
                      <span className="text-xs text-gray-400">{c.type}</span>
                    </div>
                    <span className="text-sm text-[#4A90D9] font-medium">{c.phone}</span>
                  </div>

                  <div className="p-5 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs font-semibold text-[#999] uppercase mb-1">Origines</p>
                        <div className="flex flex-wrap gap-1">
                          {c.origins.map((o) => (
                            <span key={o} className="rounded bg-blue-50 px-2 py-0.5 text-xs text-[#4A90D9]">{o}</span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-[#999] uppercase mb-1">Destinations</p>
                        <div className="flex flex-wrap gap-1">
                          {c.destinations.map((d) => (
                            <span key={d} className="rounded bg-green-50 px-2 py-0.5 text-xs text-[#00A06A]">{d}</span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Tarifs */}
                    <div>
                      <p className="text-xs font-semibold text-[#999] uppercase mb-2">Tarifs aerien (par kg)</p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {c.rates.map((r) => (
                          <div key={r.label} className="rounded bg-gray-50 px-3 py-2 text-center">
                            <p className="text-[11px] text-[#999]">{r.label}</p>
                            <p className="text-sm font-bold text-[#191919]">{r.price}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Volume maritime */}
                    <div>
                      <p className="text-xs font-semibold text-[#999] uppercase mb-1">Tarif volume (maritime)</p>
                      <p className="text-sm text-[#333]">{c.volume}</p>
                    </div>

                    {/* Delais */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="rounded bg-blue-50 px-4 py-3">
                        <p className="text-[11px] font-semibold text-[#4A90D9] uppercase">Delai aerien</p>
                        <p className="text-sm font-bold text-[#191919]">{c.delays.aerien}</p>
                      </div>
                      <div className="rounded bg-orange-50 px-4 py-3">
                        <p className="text-[11px] font-semibold text-[#FF6A00] uppercase">Delai maritime</p>
                        <p className="text-sm font-bold text-[#191919]">{c.delays.maritime}</p>
                      </div>
                    </div>

                    {/* Restrictions */}
                    <div className="rounded border border-red-100 bg-red-50 px-4 py-3">
                      <p className="text-[11px] font-semibold text-[#E82328] uppercase mb-1">Restrictions</p>
                      <p className="text-xs text-[#666]">{c.restrictions}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ─── AGENCES LOCALES ─── */}
          <section>
            <h2 className="mb-6 flex items-center gap-2 text-xl font-bold text-[#191919]">
              <span className="inline-block h-8 w-1 rounded bg-[#4A90D9]" />
              Agences de Transport Locales — Bafoussam
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#191919] text-white text-left">
                    <th className="px-4 py-3 font-semibold rounded-tl-lg">Agence</th>
                    <th className="px-4 py-3 font-semibold">Zones desservies</th>
                    <th className="px-4 py-3 font-semibold">Mode</th>
                    <th className="px-4 py-3 font-semibold">Tarification</th>
                    <th className="px-4 py-3 font-semibold">Delai</th>
                    <th className="px-4 py-3 font-semibold rounded-tr-lg">Restrictions</th>
                  </tr>
                </thead>
                <tbody>
                  {localAgencies.map((a, i) => (
                    <tr key={a.name} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-4 py-3 font-semibold text-[#191919] whitespace-nowrap">{a.name}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {a.zones.map((z) => (
                            <span key={z} className="rounded bg-blue-50 px-1.5 py-0.5 text-[11px] text-[#4A90D9]">{z}</span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-[#666] whitespace-nowrap">{a.mode}</td>
                      <td className="px-4 py-3 text-[#333] text-xs">{a.tarif}</td>
                      <td className="px-4 py-3 font-medium text-[#00A06A] whitespace-nowrap">{a.delai}</td>
                      <td className="px-4 py-3 text-xs text-[#999]">{a.restrictions || 'Aucune'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-6 rounded bg-yellow-50 border border-yellow-200 px-5 py-4">
              <p className="text-sm font-semibold text-[#191919] mb-1">Informations importantes</p>
              <ul className="text-xs text-[#666] space-y-1 list-disc ml-4">
                <li>Les tarifs sont indicatifs et peuvent varier selon le volume et la periode.</li>
                <li>Real Express et Blue Bird remboursent jusqu&apos;a 100% de la valeur declaree en cas d&apos;avarie.</li>
                <li>Tous les prix sont en FCFA (XAF).</li>
                <li>Contactez directement les transporteurs pour obtenir un devis personnalise.</li>
              </ul>
            </div>
          </section>
        </div>

        <div className="mt-8 text-center text-sm text-gray-500">
          <Link href="/support" className="text-[#4A90D9] hover:underline">
            Support
          </Link>
          {' | '}
          <Link href="/" className="text-[#4A90D9] hover:underline">
            Retour a l&apos;accueil
          </Link>
        </div>
      </div>
    </div>
  );
}
