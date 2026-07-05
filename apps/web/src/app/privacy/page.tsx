import Link from 'next/link';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      <div className="mx-auto max-w-[900px] px-4 py-10">
        {/* Header */}
        <div className="mb-8 text-center">
          <Link href="/" className="text-2xl font-bold text-[#E82328]">
            Estuaire<span className="text-[#4A90D9]">Achats</span>
          </Link>
        </div>

        <div className="rounded-lg bg-white p-8 shadow-sm md:p-12">
          <h1 className="mb-8 text-3xl font-bold text-[#191919]">
            Politique de Confidentialite
          </h1>
          <p className="mb-6 text-sm text-gray-500">
            Derniere mise a jour : 5 juillet 2026
          </p>

          <div className="space-y-8 text-[15px] leading-relaxed text-[#333]">
            <section>
              <h2 className="mb-3 text-xl font-semibold text-[#191919]">1. Introduction</h2>
              <p>
                Estuaire Services SARL (&quot;nous&quot;, &quot;notre&quot;, &quot;nos&quot;) exploite la plateforme
                EstuaireAchats et l&apos;application mobile Estuaire Achats CM. Nous nous engageons a proteger
                la vie privee de nos utilisateurs. Cette politique de confidentialite explique comment nous
                collectons, utilisons, stockons et protegeons vos donnees personnelles.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-semibold text-[#191919]">2. Donnees collectees</h2>
              <p className="mb-3">Nous collectons les types de donnees suivants :</p>
              <ul className="ml-5 list-disc space-y-2">
                <li><strong>Coordonnees</strong> : nom, prenom, adresse e-mail, numero de telephone, adresse physique (pour la livraison).</li>
                <li><strong>Identifiants</strong> : identifiant de compte utilisateur.</li>
                <li><strong>Donnees de localisation</strong> : emplacement approximatif pour estimer les delais et couts de livraison.</li>
                <li><strong>Historique de recherche</strong> : vos recherches effectuees dans l&apos;application pour ameliorer votre experience.</li>
                <li><strong>Historique d&apos;achats</strong> : vos commandes et transactions pour le suivi et le service client.</li>
              </ul>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-semibold text-[#191919]">3. Utilisation des donnees</h2>
              <p className="mb-3">Vos donnees sont utilisees exclusivement pour :</p>
              <ul className="ml-5 list-disc space-y-2">
                <li>Creer et gerer votre compte utilisateur.</li>
                <li>Traiter vos commandes et livraisons.</li>
                <li>Vous contacter concernant vos commandes (SMS, e-mail).</li>
                <li>Estimer les delais de livraison en fonction de votre localisation.</li>
                <li>Ameliorer nos services et votre experience utilisateur.</li>
                <li>Assurer la securite de la plateforme.</li>
              </ul>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-semibold text-[#191919]">4. Partage des donnees</h2>
              <p className="mb-3">Nous ne vendons jamais vos donnees personnelles. Vos donnees peuvent etre partagees avec :</p>
              <ul className="ml-5 list-disc space-y-2">
                <li><strong>Les vendeurs</strong> : nom et adresse de livraison pour traiter votre commande.</li>
                <li><strong>Les services de livraison</strong> : adresse et telephone pour effectuer la livraison (Merci E, etc.).</li>
                <li><strong>Les prestataires de paiement</strong> : MTN MoMo, Orange Money, PayPal pour traiter vos paiements. Ces prestataires ont leurs propres politiques de confidentialite.</li>
              </ul>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-semibold text-[#191919]">5. Securite des donnees</h2>
              <p>
                Nous mettons en oeuvre des mesures de securite techniques et organisationnelles appropriees
                pour proteger vos donnees personnelles contre l&apos;acces non autorise, la modification,
                la divulgation ou la destruction. Les communications sont chiffrees via HTTPS/SSL.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-semibold text-[#191919]">6. Conservation des donnees</h2>
              <p>
                Vos donnees personnelles sont conservees aussi longtemps que votre compte est actif ou
                que necessaire pour vous fournir nos services. Vous pouvez demander la suppression de
                votre compte et de vos donnees a tout moment.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-semibold text-[#191919]">7. Vos droits</h2>
              <p className="mb-3">Vous disposez des droits suivants :</p>
              <ul className="ml-5 list-disc space-y-2">
                <li><strong>Acces</strong> : consulter les donnees que nous detenons sur vous.</li>
                <li><strong>Rectification</strong> : corriger vos donnees personnelles.</li>
                <li><strong>Suppression</strong> : demander la suppression de vos donnees.</li>
                <li><strong>Portabilite</strong> : recevoir vos donnees dans un format structure.</li>
                <li><strong>Opposition</strong> : vous opposer au traitement de vos donnees.</li>
              </ul>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-semibold text-[#191919]">8. Cookies et technologies similaires</h2>
              <p>
                Notre site web utilise des cookies essentiels pour le fonctionnement de la plateforme
                (authentification, panier d&apos;achats). Nous n&apos;utilisons pas de cookies publicitaires
                ou de suivi tiers.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-semibold text-[#191919]">9. Modifications</h2>
              <p>
                Nous pouvons mettre a jour cette politique de confidentialite periodiquement.
                Toute modification sera publiee sur cette page avec la date de mise a jour.
                Nous vous encourageons a consulter regulierement cette page.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-semibold text-[#191919]">10. Contact</h2>
              <p>
                Pour toute question relative a cette politique de confidentialite ou pour exercer
                vos droits, contactez-nous :
              </p>
              <ul className="ml-5 mt-3 list-disc space-y-1">
                <li>E-mail : contact@estuaireachats.com</li>
                <li>Site web : estuaireachats.com</li>
                <li>Societe : Estuaire Services SARL, Douala, Cameroun</li>
              </ul>
            </section>
          </div>
        </div>

        <div className="mt-8 text-center text-sm text-gray-500">
          <Link href="/terms" className="text-[#4A90D9] hover:underline">
            Conditions Generales d&apos;Utilisation
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
