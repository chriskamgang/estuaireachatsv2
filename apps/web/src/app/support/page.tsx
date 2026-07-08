import Link from 'next/link';

export default function SupportPage() {
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
            Centre d&apos;aide et support
          </h1>
          <p className="mb-8 text-[15px] text-[#666]">
            Bienvenue sur le centre d&apos;aide d&apos;EstuaireAchats. Nous sommes la pour vous aider
            avec toutes vos questions concernant vos commandes, votre compte, ou notre plateforme.
          </p>

          <div className="space-y-8 text-[15px] leading-relaxed text-[#333]">
            <section>
              <h2 className="mb-3 text-xl font-semibold text-[#191919]">Nous contacter</h2>
              <p className="mb-4">
                Notre equipe de support est disponible pour repondre a toutes vos questions.
              </p>
              <ul className="ml-5 list-disc space-y-2">
                <li><strong>E-mail</strong> : contact@estuaireachats.com</li>
                <li><strong>Telephone</strong> : +237 6 XX XX XX XX</li>
                <li><strong>Horaires</strong> : Lundi - Samedi, 8h00 - 18h00 (heure de Douala)</li>
                <li><strong>Adresse</strong> : Douala, Cameroun</li>
              </ul>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-semibold text-[#191919]">Questions frequentes</h2>

              <div className="space-y-4">
                <div className="rounded-lg border border-[#eee] p-4">
                  <h3 className="mb-2 font-semibold text-[#191919]">Comment passer une commande ?</h3>
                  <p className="text-[14px] text-[#666]">
                    Parcourez nos produits, ajoutez-les a votre panier, puis procedez au paiement via
                    MTN MoMo, Orange Money ou PayPal. Vous recevrez une confirmation par SMS et email.
                  </p>
                </div>

                <div className="rounded-lg border border-[#eee] p-4">
                  <h3 className="mb-2 font-semibold text-[#191919]">Comment suivre ma commande ?</h3>
                  <p className="text-[14px] text-[#666]">
                    Connectez-vous a votre compte, allez dans &quot;Mes commandes&quot; pour voir le
                    statut en temps reel de chaque commande.
                  </p>
                </div>

                <div className="rounded-lg border border-[#eee] p-4">
                  <h3 className="mb-2 font-semibold text-[#191919]">Comment demander un remboursement ?</h3>
                  <p className="text-[14px] text-[#666]">
                    Si vous n&apos;etes pas satisfait de votre achat, contactez-nous dans les 7 jours suivant
                    la livraison. Nous examinerons votre demande et procederons au remboursement si eligible.
                  </p>
                </div>

                <div className="rounded-lg border border-[#eee] p-4">
                  <h3 className="mb-2 font-semibold text-[#191919]">Comment supprimer mon compte ?</h3>
                  <p className="text-[14px] text-[#666]">
                    Ouvrez l&apos;application, allez dans Parametres &gt; Danger zone &gt; Supprimer mon compte.
                    Vous pouvez egalement nous envoyer un email a contact@estuaireachats.com pour demander
                    la suppression de votre compte et de toutes vos donnees.
                  </p>
                </div>

                <div className="rounded-lg border border-[#eee] p-4">
                  <h3 className="mb-2 font-semibold text-[#191919]">Quels modes de paiement sont acceptes ?</h3>
                  <p className="text-[14px] text-[#666]">
                    Nous acceptons MTN Mobile Money, Orange Money, PayPal, et les virements bancaires.
                    Tous les paiements sont securises.
                  </p>
                </div>

                <div className="rounded-lg border border-[#eee] p-4">
                  <h3 className="mb-2 font-semibold text-[#191919]">Comment devenir vendeur ?</h3>
                  <p className="text-[14px] text-[#666]">
                    Telechargez l&apos;application EstuaireAchats Vendeur, creez votre boutique et commencez
                    a publier vos produits. L&apos;inscription est gratuite.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-semibold text-[#191919]">Signaler un probleme</h2>
              <p>
                Si vous rencontrez un probleme technique ou souhaitez signaler un contenu inapproprie,
                envoyez-nous un email a <strong>contact@estuaireachats.com</strong> en decrivant le probleme.
                Nous vous repondrons dans les plus brefs delais.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-semibold text-[#191919]">Informations legales</h2>
              <ul className="ml-5 list-disc space-y-1">
                <li>Societe : Estuaire Services SARL</li>
                <li>Siege social : Douala, Cameroun</li>
                <li>Site web : estuaireachats.com</li>
              </ul>
            </section>
          </div>
        </div>

        <div className="mt-8 text-center text-sm text-gray-500">
          <Link href="/privacy" className="text-[#4A90D9] hover:underline">
            Politique de Confidentialite
          </Link>
          {' | '}
          <Link href="/terms" className="text-[#4A90D9] hover:underline">
            Conditions Generales
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
