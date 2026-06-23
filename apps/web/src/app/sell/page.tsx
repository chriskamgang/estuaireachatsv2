'use client';

import Link from 'next/link';
import {
  Store,
  TrendingUp,
  Globe,
  HeadphonesIcon,
  UserPlus,
  Upload,
  ShoppingBag,
  Check,
  ArrowRight,
} from 'lucide-react';
import { formatPrice } from '@/lib/utils';

const benefits = [
  {
    icon: Globe,
    title: 'Visibilite nationale',
    description: 'Touchez des millions d\'acheteurs a travers tout le Cameroun et l\'Afrique centrale.',
  },
  {
    icon: TrendingUp,
    title: 'Croissance rapide',
    description: 'Nos outils marketing et promotions boostent vos ventes des les premiers jours.',
  },
  {
    icon: Store,
    title: 'Boutique gratuite',
    description: 'Creez votre boutique en ligne professionnelle sans frais d\'installation.',
  },
  {
    icon: HeadphonesIcon,
    title: 'Support dedie',
    description: 'Une equipe d\'assistance vous accompagne a chaque etape de votre activite.',
  },
];

const steps = [
  {
    icon: UserPlus,
    step: '01',
    title: 'Inscrivez-vous',
    description: 'Creez votre compte vendeur en quelques minutes avec vos informations professionnelles.',
  },
  {
    icon: Upload,
    step: '02',
    title: 'Ajoutez vos produits',
    description: 'Telechargez vos photos, descriptions et fixez vos prix. Notre interface est simple et intuitive.',
  },
  {
    icon: ShoppingBag,
    step: '03',
    title: 'Commencez a vendre',
    description: 'Recevez vos premieres commandes et gerez votre activite depuis votre tableau de bord.',
  },
];

const plans = [
  {
    name: 'Starter',
    price: 0,
    period: 'Gratuit',
    description: 'Ideal pour demarrer',
    features: [
      'Jusqu\'a 50 produits',
      'Boutique en ligne basique',
      'Paiement mobile money',
      'Support par email',
      'Commission : 8% par vente',
    ],
    cta: 'Commencer gratuitement',
    highlighted: false,
  },
  {
    name: 'Professionnel',
    price: 15000,
    period: '/ mois',
    description: 'Pour les vendeurs serieux',
    features: [
      'Produits illimites',
      'Boutique personnalisee',
      'Tous les moyens de paiement',
      'Support prioritaire',
      'Commission : 5% par vente',
      'Statistiques avancees',
      'Badge vendeur verifie',
    ],
    cta: 'Choisir Pro',
    highlighted: true,
  },
  {
    name: 'Entreprise',
    price: 45000,
    period: '/ mois',
    description: 'Pour les grandes entreprises',
    features: [
      'Tout du plan Pro',
      'API integrations',
      'Account manager dedie',
      'Commission : 3% par vente',
      'Formation personnalisee',
      'Placement premium',
      'Multi-boutiques',
    ],
    cta: 'Nous contacter',
    highlighted: false,
  },
];

export default function SellPage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-dark via-gray-1 to-dark py-20">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -right-20 -top-20 h-80 w-80 rounded-full bg-orange blur-3xl" />
          <div className="absolute -bottom-20 -left-20 h-80 w-80 rounded-full bg-primary blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-[1440px] px-4 text-center">
          <h1 className="text-4xl font-bold text-white md:text-5xl">
            Vendez sur{' '}
            <span className="bg-gradient-to-r from-primary to-orange bg-clip-text text-transparent">
              EstuaireAchats
            </span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-white/70">
            Rejoignez des milliers de vendeurs qui font grandir leur activite en ligne.
            Touchez des millions d&apos;acheteurs au Cameroun et en Afrique centrale.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <Link
              href="/register?role=seller"
              className="flex items-center gap-2 rounded-xl bg-orange px-8 py-3.5 text-base font-bold text-white transition-colors hover:bg-orange-light"
            >
              Commencer gratuitement
              <ArrowRight size={18} />
            </Link>
          </div>
          <p className="mt-4 text-sm text-white/50">
            Aucun frais d&apos;inscription. Commencez a vendre en moins de 5 minutes.
          </p>
        </div>
      </section>

      {/* Benefits */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-[1440px] px-4">
          <h2 className="text-center text-3xl font-bold text-dark">
            Pourquoi vendre chez nous ?
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-gray-2">
            EstuaireAchats vous offre tous les outils pour reussir votre commerce en ligne.
          </p>

          <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {benefits.map((benefit) => {
              const Icon = benefit.icon;
              return (
                <div
                  key={benefit.title}
                  className="rounded-xl border border-gray-5 p-6 text-center transition-shadow hover:shadow-lg"
                >
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-orange/10 text-orange">
                    <Icon size={28} />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-dark">{benefit.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-gray-2">{benefit.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-gray-6 py-20">
        <div className="mx-auto max-w-[1440px] px-4">
          <h2 className="text-center text-3xl font-bold text-dark">Comment ca marche</h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-gray-2">
            Trois etapes simples pour lancer votre boutique en ligne.
          </p>

          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {steps.map((step) => {
              const Icon = step.icon;
              return (
                <div key={step.step} className="relative rounded-xl bg-white p-8 shadow-sm">
                  <span className="absolute -top-4 left-6 flex h-9 items-center rounded-full bg-orange px-4 text-sm font-bold text-white">
                    Etape {step.step}
                  </span>
                  <div className="mt-4 flex h-12 w-12 items-center justify-center rounded-xl bg-dark/5 text-dark">
                    <Icon size={24} />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-dark">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-gray-2">{step.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-[1440px] px-4">
          <h2 className="text-center text-3xl font-bold text-dark">Nos forfaits</h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-gray-2">
            Choisissez le plan adapte a la taille de votre activite.
          </p>

          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`relative overflow-hidden rounded-xl border-2 p-8 transition-shadow hover:shadow-lg ${
                  plan.highlighted
                    ? 'border-orange shadow-md'
                    : 'border-gray-5'
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute right-0 top-0 rounded-bl-lg bg-orange px-4 py-1 text-xs font-bold text-white">
                    Populaire
                  </div>
                )}
                <h3 className="text-xl font-bold text-dark">{plan.name}</h3>
                <p className="mt-1 text-sm text-gray-3">{plan.description}</p>
                <div className="mt-4">
                  {plan.price === 0 ? (
                    <span className="text-3xl font-bold text-dark">Gratuit</span>
                  ) : (
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold text-dark">{formatPrice(plan.price)}</span>
                      <span className="text-sm text-gray-3">{plan.period}</span>
                    </div>
                  )}
                </div>
                <ul className="mt-6 space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm text-gray-2">
                      <Check size={16} className="mt-0.5 shrink-0 text-green" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/register?role=seller"
                  className={`mt-8 block rounded-lg py-3 text-center text-sm font-semibold transition-colors ${
                    plan.highlighted
                      ? 'bg-orange text-white hover:bg-orange-light'
                      : 'border border-orange text-orange hover:bg-orange/5'
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="bg-gradient-to-r from-orange to-primary py-16">
        <div className="mx-auto max-w-[1440px] px-4 text-center">
          <h2 className="text-3xl font-bold text-white">Pret a commencer ?</h2>
          <p className="mx-auto mt-3 max-w-lg text-white/80">
            Rejoignez EstuaireAchats aujourd&apos;hui et commencez a vendre vos produits a des
            millions d&apos;acheteurs.
          </p>
          <Link
            href="/register?role=seller"
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-8 py-3.5 text-base font-bold text-orange transition-colors hover:bg-gray-6"
          >
            Creer mon compte vendeur
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>
    </div>
  );
}
