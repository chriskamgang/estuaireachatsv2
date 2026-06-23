import Link from 'next/link';

export default function TermsPage() {
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
            Conditions Generales d&apos;Utilisation
          </h1>
          <p className="mb-6 text-sm text-gray-500">
            Derniere mise a jour : 1er janvier 2026
          </p>

          <div className="space-y-8 text-[15px] leading-relaxed text-[#333]">
            <section>
              <h2 className="mb-3 text-xl font-semibold text-[#191919]">1. Objet</h2>
              <p>
                Les presentes Conditions Generales d&apos;Utilisation (ci-apres &quot;CGU&quot;) ont pour objet
                de definir les modalites et conditions d&apos;utilisation de la plateforme EstuaireAchats
                (ci-apres &quot;la Plateforme&quot;), accessible a l&apos;adresse estuaireachats.com, ainsi que
                les droits et obligations des parties dans ce cadre.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-semibold text-[#191919]">2. Acceptation des CGU</h2>
              <p>
                L&apos;inscription sur la Plateforme implique l&apos;acceptation pleine et entiere des presentes
                CGU. Si vous n&apos;acceptez pas ces conditions, vous ne devez pas utiliser la Plateforme.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-semibold text-[#191919]">3. Description des services</h2>
              <p>
                EstuaireAchats est une plateforme de commerce electronique multi-vendeurs permettant
                aux acheteurs et vendeurs de realiser des transactions commerciales en ligne. La Plateforme
                offre les services suivants :
              </p>
              <ul className="mt-3 list-disc space-y-2 pl-6">
                <li>Mise en relation entre acheteurs et vendeurs professionnels</li>
                <li>Vente en gros et au detail de produits divers</li>
                <li>Systeme de paiement securise (Mobile Money, PayPal)</li>
                <li>Gestion des commandes et suivi des livraisons</li>
                <li>Systeme d&apos;evaluation et d&apos;avis</li>
              </ul>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-semibold text-[#191919]">4. Inscription</h2>
              <p>
                Pour utiliser les services de la Plateforme, l&apos;utilisateur doit creer un compte en
                fournissant des informations exactes et a jour. L&apos;utilisateur s&apos;engage a maintenir
                la confidentialite de ses identifiants de connexion et est responsable de toute
                activite effectuee depuis son compte.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-semibold text-[#191919]">5. Obligations des vendeurs</h2>
              <p>Les vendeurs s&apos;engagent a :</p>
              <ul className="mt-3 list-disc space-y-2 pl-6">
                <li>Fournir des descriptions exactes et honnetes de leurs produits</li>
                <li>Respecter les delais de livraison annonces</li>
                <li>Se conformer a la legislation camerounaise en matiere de commerce</li>
                <li>Ne pas proposer de produits contrefaits, illegaux ou dangereux</li>
                <li>Repondre aux reclamations des acheteurs dans un delai raisonnable</li>
              </ul>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-semibold text-[#191919]">6. Obligations des acheteurs</h2>
              <p>Les acheteurs s&apos;engagent a :</p>
              <ul className="mt-3 list-disc space-y-2 pl-6">
                <li>Fournir des informations de livraison exactes</li>
                <li>Effectuer le paiement des commandes validees</li>
                <li>Ne pas utiliser la Plateforme a des fins frauduleuses</li>
                <li>Respecter les conditions de retour et de remboursement</li>
              </ul>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-semibold text-[#191919]">7. Paiements</h2>
              <p>
                Les paiements sont effectues via les moyens de paiement proposes sur la Plateforme
                (MTN Mobile Money, Orange Money, PayPal). Les prix sont exprimes en Francs CFA (XAF).
                EstuaireAchats agit en tant qu&apos;intermediaire et ne detient pas les fonds au-dela
                du delai necessaire au traitement de la transaction.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-semibold text-[#191919]">8. Livraison</h2>
              <p>
                Les delais de livraison sont indicatifs et varient selon le vendeur et la destination.
                EstuaireAchats ne peut etre tenu responsable des retards de livraison imputables
                aux transporteurs ou a des circonstances de force majeure.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-semibold text-[#191919]">9. Retours et remboursements</h2>
              <p>
                Les demandes de retour doivent etre effectuees dans un delai de 7 jours apres reception
                du produit. Le produit doit etre retourne dans son etat d&apos;origine. Les frais de retour
                sont a la charge de l&apos;acheteur, sauf en cas de produit defectueux ou non conforme
                a la description.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-semibold text-[#191919]">10. Protection des donnees personnelles</h2>
              <p>
                EstuaireAchats s&apos;engage a proteger les donnees personnelles de ses utilisateurs
                conformement a la legislation en vigueur au Cameroun. Les donnees collectees sont
                utilisees uniquement dans le cadre de la fourniture des services de la Plateforme
                et ne sont pas cedees a des tiers sans le consentement de l&apos;utilisateur.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-semibold text-[#191919]">11. Propriete intellectuelle</h2>
              <p>
                L&apos;ensemble des elements de la Plateforme (textes, images, logos, logiciels) sont
                proteges par le droit de la propriete intellectuelle. Toute reproduction ou utilisation
                non autorisee est strictement interdite.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-semibold text-[#191919]">12. Limitation de responsabilite</h2>
              <p>
                EstuaireAchats agit en tant que plateforme de mise en relation et ne saurait etre
                tenu responsable des litiges entre acheteurs et vendeurs, de la qualite des produits
                vendus par les vendeurs, ni des dommages indirects lies a l&apos;utilisation de la Plateforme.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-semibold text-[#191919]">13. Modification des CGU</h2>
              <p>
                EstuaireAchats se reserve le droit de modifier les presentes CGU a tout moment.
                Les utilisateurs seront informes de toute modification par email ou notification
                sur la Plateforme. La poursuite de l&apos;utilisation de la Plateforme apres modification
                vaut acceptation des nouvelles CGU.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-semibold text-[#191919]">14. Droit applicable</h2>
              <p>
                Les presentes CGU sont regies par le droit camerounais. Tout litige relatif a
                l&apos;interpretation ou a l&apos;execution des presentes sera soumis aux tribunaux
                competents de Douala, Cameroun.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-semibold text-[#191919]">15. Contact</h2>
              <p>
                Pour toute question relative aux presentes CGU, vous pouvez nous contacter a
                l&apos;adresse suivante : support@estuaireachats.com
              </p>
            </section>
          </div>

          <div className="mt-10 border-t border-gray-200 pt-6 text-center">
            <Link
              href="/register"
              className="inline-block rounded-lg bg-[#E82328] px-8 py-3 text-sm font-semibold text-white transition hover:bg-[#D11F23]"
            >
              Retour a l&apos;inscription
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
