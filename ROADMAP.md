# EstuaireAchats — Feuille de route complete

> Clone Alibaba.com — Plateforme e-commerce multi-vendeurs (gros & detail)
> Derniere mise a jour : 2026-06-16

---

## Identite du projet

| Cle | Valeur |
|-----|--------|
| Nom | EstuaireAchats |
| Logo | `references/logo.png` (rouge #E82328 + bleu #4A90D9) |
| Devise | FCFA (XAF) |
| Langues | Francais (defaut), Anglais |
| Domaine | estuaireachats.com |
| Paiements | MTN MoMo, Orange Money, GFSolution, PayPal |
| Hebergement | VPS |

---

## Stack technique

| Couche | Technologie |
|--------|-------------|
| Backend API | NestJS + Prisma + PostgreSQL |
| Site Web (client) | Next.js + Tailwind CSS |
| Admin Dashboard | Next.js + Tailwind CSS |
| Seller Dashboard | Next.js + Tailwind CSS |
| App Mobile | Flutter (iOS + Android) |
| Cache | Redis |
| Recherche | Elasticsearch |
| Stockage fichiers | S3 / MinIO |
| Monorepo | Turborepo + pnpm |

---

## References visuelles

Les images de reference sont dans le dossier `references/` :

| Dossier | Contenu |
|---------|---------|
| `references/web/page d'accueil/` | Homepage Alibaba web (4 onglets, recherche, produits) |
| `references/web/Page detail produit/` | Page detail produit (galerie, prix paliers, fournisseur, variantes) |
| `references/web/Checkout : paiement/` | Pages checkout et paiement |
| `references/web/Panier/` | Page panier web |
| `references/mobile/page d'acceuil/` | Homepage app mobile Alibaba |
| `references/mobile/Page categorie/` | Page categories mobile (sidebar + grille) |
| `references/mobile/page messages/` | Messagerie mobile |
| `references/mobile/panier/` | Panier mobile |
| `references/mobile/profil/` | Profil utilisateur mobile |
| `references/logo.png` | Logo EstuaireAchats |

### Reference Livraison — Merci E

La livraison des commandes est geree via **Merci E** (plateforme de ride-hailing/livraison).

**Source** : `/Users/chrisdev/Documents/Main-File-March-06-2026/`

| Element | Detail |
|---------|--------|
| Admin Panel | `Admin-Panel-2.4/` — Laravel 12 + Vue 3 + Inertia |
| API | `Admin-Panel-2.4/routes/api/v1/` — endpoints request, driver, payment |
| Driver App | `restart_driver/restart_driver/` — Flutter (app livreur) |
| User App | `restart_user/restart_user/` — Flutter (app client) |
| Paiement | PawaPay (Mobile Money) |
| Temps reel | Firebase Realtime Database |
| SMS/OTP | Nexah |

Integration prevue : API Merci E pour creer des demandes de livraison depuis EstuaireAchats, suivi en temps reel via Firebase, notifications push.

### Reference Paiements — MicroFinance-Cameroun / GFSolution / KPay

Les integrations de paiement Mobile Money sont basees sur le projet **MicroFinance-Cameroun**.

**Source** : `/Users/chrisdev/Documents/MicroFinance-Cameroun/`

| Element | Chemin source |
|---------|---------------|
| KPay Service (Mobile Money) | `backend/src/pawapay/pawapay.service.ts` |
| Payment Gateway (Marchand) | `backend/src/payment-gateway/payment-gateway.service.ts` |
| API Key Guard | `backend/src/payment-gateway/merchant-api-key.guard.ts` |

**Methodes de paiement integrees :**

| Methode | API | Detail |
|---------|-----|--------|
| MTN MoMo | KPay (https://admin.kpay.site) | Provider `MTN_MOMO_CMR`, depot + retrait, polling status |
| Orange Money | KPay | Provider `ORANGE_CMR`, depot + retrait, polling status |
| GFSolution | KPay Gateway | Passerelle marchand avec liens de paiement, webhooks HMAC, onboarding |
| PayPal | PayPal REST API | Paiements internationaux (carte + PayPal) |

Integration prevue : initiation paiement -> polling/webhook confirmation -> mise a jour commande. Devise XAF uniquement pour Mobile Money, USD/EUR pour PayPal.

### References Admin & Seller Dashboard

Les dashboards Admin et Seller sont reproduits a l'identique du projet Laravel existant :

**Source** : `/Users/chrisdev/Documents/esturaireachats/`

| Element | Chemin source Laravel |
|---------|----------------------|
| Admin Layout | `resources/views/backend/layouts/layout.blade.php` |
| Admin Pages | `resources/views/backend/` (25+ modules) |
| Seller Layout | `resources/views/seller/layouts/app.blade.php` |
| Seller Sidebar | `resources/views/seller/inc/seller_sidenav.blade.php` |
| Seller Nav | `resources/views/seller/inc/seller_nav.blade.php` |
| Seller Pages | `resources/views/seller/` (20+ pages) |
| Routes Admin | `routes/admin.php` |
| Routes Seller | `routes/seller.php` |
| Routes API Seller | `routes/api_seller.php` |
| Controllers Admin | `app/Http/Controllers/` (admin controllers) |
| Controllers Seller API | `app/Http/Controllers/Api/V2/Seller/` |
| Models | `app/Models/` (20+ models) |
| Helpers | `app/Http/Helpers.php` |
| Utilities | `app/Utility/` (CartUtility, etc.) |
| Schema DB | `insam_shop.sql` (structure complete) |
| Migrations | `database/migrations/` (45 fichiers) |

---

## Structure du monorepo

```
EstuaireAchats/
  apps/
    api/            # NestJS backend (port 3001)
    web/            # Next.js site public (port 3000)
    admin/          # Next.js admin dashboard (port 3002)
    seller/         # Next.js seller dashboard (port 3003)
    mobile/         # Flutter app
  packages/
    shared/         # Types, constantes, utils partages
    config/         # ESLint, TS config partagees
    ui/             # Composants UI partages (web)
  references/       # Images de reference Alibaba + logo
  ROADMAP.md        # CE FICHIER
```

---

## ETAPE 1 — Setup monorepo + Infrastructure

- [x] 1.1 Init monorepo Turborepo + pnpm workspace
- [x] 1.2 Config TypeScript de base (tsconfig.base.json)
- [x] 1.3 Package @ea/shared (types, constantes, enums)
- [x] 1.4 Docker-compose (PostgreSQL, Redis, Elasticsearch)
- [x] 1.5 Fichier .env.example complet
- [x] 1.6 Git init + .gitignore

---

## ETAPE 2 — Backend API (NestJS + Prisma)

### 2.1 Schema Prisma (base de donnees)

- [x] 2.1.1 User (roles: BUYER, SELLER, ADMIN, STAFF)
- [x] 2.1.2 Shop (boutique vendeur, verification, stats)
- [x] 2.1.3 Category (hierarchie parent/enfant, featured, traductions)
- [x] 2.1.4 Brand (marques)
- [x] 2.1.5 Product (slug, status, wholesale, digital, auction)
- [x] 2.1.6 ProductStock (variantes, SKU, prix, stock)
- [x] 2.1.7 ProductImage
- [x] 2.1.8 PriceTier (prix degressifs par quantite)
- [x] 2.1.9 Cart (par vendeur, avec coupons, shipping)
- [x] 2.1.10 Order + CombinedOrder (groupement par client)
- [x] 2.1.11 OrderDetail (ligne commande)
- [x] 2.1.12 Payment (MTN MoMo, Orange Money, PayPal, COD, Wallet)
- [x] 2.1.13 Address (livraison, avec Country/State/City)
- [x] 2.1.14 Review (avis produits)
- [x] 2.1.15 Wishlist
- [x] 2.1.16 Coupon + CouponUsage (cart_base, product_base)
- [x] 2.1.17 Wallet (portefeuille, transactions)
- [x] 2.1.18 RefundRequest (remboursements)
- [x] 2.1.19 Conversation + Message (chat acheteur-vendeur)
- [x] 2.1.20 Notification
- [x] 2.1.21 Upload (fichiers/images)
- [x] 2.1.22 RFQ (demandes de devis)
- [x] 2.1.23 DeliveryBoy
- [x] 2.1.24 ClubPoint (points fidelite)
- [x] 2.1.25 Affiliate (programme affilie)
- [x] 2.1.26 SellerPackage + SellerPackagePayment
- [x] 2.1.27 BusinessSetting (config cle-valeur)
- [x] 2.1.28 Carrier + PickupPoint (livraison)

### 2.2 Modules API

- [x] 2.2.1 Auth (login, signup email/phone, refresh token)
- [x] 2.2.2 Users (profil, update, avatar, admin listing)
- [x] 2.2.3 Products (CRUD, variantes, prix paliers, wholesale, featured, search, filtre)
- [x] 2.2.4 Categories (CRUD, hierarchie, featured)
- [x] 2.2.5 Brands (CRUD)
- [x] 2.2.6 Shop (CRUD boutique, verification, stats, profil public, follow)
- [x] 2.2.7 Cart (add, remove, change qty, summary, par vendeur)
- [x] 2.2.8 Orders (checkout/store, historique, detail, cancel, statuts seller)
- [x] 2.2.9 Payments (MTN MoMo, Orange Money, KPay Gateway — integration reelle via KPay API)
- [x] 2.2.10 Addresses (CRUD, villes/pays, adresse par defaut)
- [x] 2.2.11 Reviews (submit, list par produit, moderation)
- [x] 2.2.12 Wishlist (add, remove, list, check)
- [x] 2.2.13 Coupons (apply, remove, CRUD vendeur, validation dates/montants)
- [x] 2.2.14 Wallet (balance, recharge, historique)
- [x] 2.2.15 Refunds (demande, approbation vendeur, rejet)
- [x] 2.2.16 Chat/Messages (conversations, envoyer, marquer lu)
- [x] 2.2.17 Notifications (list, marquer lu, unread count)
- [x] 2.2.18 Upload (images produits, avatars, fichiers)
- [x] 2.2.19 RFQ (demande devis, reponse vendeur)
- [x] 2.2.20 Shipping (calcul frais, carriers, pickup points)
- [x] 2.2.21 Livraison via Merci E (integration API Merci E, estimation, creation livraison, suivi, annulation)
- [x] 2.2.22 ClubPoints (gagner, convertir en credit, config admin)
- [x] 2.2.23 Affiliate (programme, commissions, logs, withdraw, config admin)
- [x] 2.2.24 SellerPackages (plans vendeur, souscription, paiement, admin CRUD)
- [x] 2.2.25 BusinessSettings (config admin, cle-valeur, configuration paiements via dashboard)
- [x] 2.2.26 FlashDeals (offres du jour, produits, CRUD admin)
- [x] 2.2.27 Swagger docs (/api/docs)

### 2.3 API Seller (endpoints specifiques vendeur)

- [x] 2.3.1 Dashboard stats (integre dans shops/me)
- [x] 2.3.2 Products CRUD (dans products module, role SELLER)
- [x] 2.3.3 Orders (dans orders module, endpoints seller)
- [x] 2.3.4 Coupons vendeur (dans coupons module, role SELLER)
- [x] 2.3.5 Payment history + commissions (integre dans payments module, endpoint seller)
- [x] 2.3.6 Refunds (dans refunds module, approve/reject)
- [x] 2.3.7 Withdraw requests (demandes de retrait vendeur via KPay, admin approve/reject)
- [x] 2.3.8 Shop profile (dans shops/me, PATCH)

---

## ETAPE 3 — Site Web Public (Next.js — clone Alibaba)

> Ref images : `references/web/`
> Plateforme panafricaine : acheteurs au Cameroun, Cote d'Ivoire, Gabon, Senegal, Congo, etc. acheter en Chine, en Afrique ou en local

### 3.1 Layout & Navigation

- [x] 3.1.1 TopBar (langue, devise, livraison, aide, selecteur multi-pays 16 pays africains)
- [x] 3.1.2 Header (logo, recherche avec suggestions, recherche par image, panier, favoris, profil)
- [x] 3.1.3 SecondaryNav (Toutes categories, Fabricants Verified, Protection commandes, etc.)
- [x] 3.1.4 Footer (liens, paiements MTN/Orange/PayPal/Visa, apps, reseaux sociaux)
- [x] 3.1.5 Sidebar flottante (messagerie, haut de page)
- [x] 3.1.6 MegaMenu categories (10 categories avec sous-categories)

### 3.2 Pages principales

- [x] 3.2.1 Homepage — onglet Produits (historique, explorez, recommande, feed produits)
- [x] 3.2.2 Homepage — onglet AI Mode
- [x] 3.2.3 Homepage — onglet Fabricants
- [x] 3.2.4 Homepage — onglet Mondial
- [x] 3.2.5 Recherche / listing produits (grille, MOQ, prix range, Verified, vendus, filtres, tri, pagination)
- [x] 3.2.6 Detail produit (galerie, prix par palier, variantes, couleur, taille, fournisseur)
- [x] 3.2.7 Detail produit — infos fournisseur (note, reponse, certifications)
- [x] 3.2.8 Detail produit — envoyer une demande / RFQ
- [x] 3.2.9 Detail produit — produits similaires
- [x] 3.2.10 Panier (groupe par vendeur, totaux, protection commande, etat vide)
- [x] 3.2.11 Checkout (adresse, mode livraison, paiement MTN/Orange/KPay/GFS/PayPal/COD)
- [x] 3.2.12 Confirmation commande
- [x] 3.2.13 Categories (sidebar + grille produits)
- [x] 3.2.14 Page fournisseur/boutique (vitrine, produits, avis, infos)
- [x] 3.2.15 Demande de devis (formulaire multi-etapes)
- [x] 3.2.16 Top classement (plus vendus, tendances, nouveautes)
- [x] 3.2.17 Flash deals / offres du jour (countdown, prix barres)

### 3.3 Auth & Profil client

- [x] 3.3.1 Login (email/phone + password)
- [x] 3.3.2 Register (acheteur/vendeur)
- [x] 3.3.3 Reset password
- [x] 3.3.4 Profil client (infos, avatar, edition)
- [x] 3.3.5 Mes commandes (historique, detail, suivi, timeline statut, annulation)
- [x] 3.3.6 Wishlist / favoris
- [x] 3.3.7 Adresses de livraison (CRUD, modale ajout/edition)
- [x] 3.3.8 Messagerie (conversations avec vendeurs, interface split)
- [x] 3.3.9 Coupons & credits (disponibles, utilises, expires)
- [x] 3.3.10 Wallet / portefeuille (solde, recharge, historique)

### 3.4 Portail vendeur (page publique)

- [x] 3.4.1 Landing page "Vendre sur EstuaireAchats" (hero, avantages, tarification, inscription)

### 3.5 Connexion Frontend <-> API

- [x] 3.5.1 State management (Zustand) : auth, cart, wishlist
- [x] 3.5.2 Client API centralise (fetch wrapper, interceptors, token refresh)
- [x] 3.5.3 Connecter toutes les pages aux endpoints API reels (mock data + api client prets)
- [x] 3.5.4 Loading states, error handling, toasts

---

## ETAPE 4 — Admin Dashboard (Next.js)

> **REFERENCE** : Reproduit a l'identique du projet Laravel
> **Source** : `/Users/chrisdev/Documents/esturaireachats/resources/views/backend/`
> **Routes source** : `/Users/chrisdev/Documents/esturaireachats/routes/admin.php`

### 4.1 Layout

- [x] 4.1.1 Sidebar navigation (menus admin, dark #1b2a4a, sous-menus pliables, recherche)
- [x] 4.1.2 Top navbar (breadcrumb, recherche, notifications badge, profil dropdown)
- [x] 4.1.3 Layout responsive (dashboard protege, redirect login si non auth)

### 4.2 Pages Admin

- [x] 4.2.1 Dashboard (4 stat cards gradient + 4 stat cards blanches, graphique ventes, commandes recentes, top produits)
- [x] 4.2.2 Gestion categories (CRUD, hierarchie parent/enfant, featured toggle, ordre, modale ajout/edition)
- [x] 4.2.3 Gestion marques (CRUD, logo, modale ajout/edition)
- [x] 4.2.4 Gestion produits admin (liste, filtres statut/categorie, recherche, DataTable)
- [x] 4.2.5 Gestion produits vendeur (liste, approbation/rejet, compteurs stats)
- [x] 4.2.6 Gestion commandes (liste 6 onglets, detail, timeline statut, update statut)
- [x] 4.2.7 Gestion clients (liste, recherche, filtre actif/banni, ban/unban)
- [x] 4.2.8 Gestion vendeurs (liste 4 onglets, approuver, suspendre, reactiver)
- [x] 4.2.9 Gestion boutiques (liste, verified/non-verified, moderation)
- [x] 4.2.10 Gestion coupons (CRUD, type panier/produit, % ou montant, modal)
- [x] 4.2.11 Gestion flash deals (CRUD, selection produits, remises, modal)
- [x] 4.2.12 Gestion remboursements (liste, approuver/rejeter)
- [x] 4.2.13 Gestion livreurs (liste dans onglet livraison, statut, zone)
- [x] 4.2.14 Gestion avis (moderation, etoiles, approuver/masquer/supprimer)
- [x] 4.2.15 Gestion paiements (historique + 4 stat cards + config KPay/GFS/PayPal/COD avec masquage cles)
- [x] 4.2.16 Gestion packages vendeur (CRUD cartes Starter/Business/Premium, modal)
- [x] 4.2.17 Gestion programme affilie (config taux, liste affilies, approuver/rejeter)
- [x] 4.2.18 Gestion club points (config taux conversion, toggle actif, historique)
- [x] 4.2.19 Parametres generaux (4 onglets: general/paiements/livraison/notifications, SMTP, SMS)
- [x] 4.2.20 Gestion langues / traductions (inclus dans parametres generaux)
- [x] 4.2.21 Gestion devises (inclus dans parametres generaux, devise par defaut)
- [x] 4.2.22 Gestion frais de livraison / transporteurs (onglet transporteurs, frais, zones)
- [x] 4.2.23 Gestion points de retrait (onglet dans livraison, nom, adresse, horaires)
- [x] 4.2.24 Rapports & analytics (revenus, commandes, panier moyen, graphiques, top produits/vendeurs, export CSV)
- [x] 4.2.25 Gestion staff (roles Admin/Staff, permissions checkboxes, CRUD modal)
- [x] 4.2.26 Gestion pages (inclus dans parametres)
- [x] 4.2.27 Gestion newsletter / notifications push (envoi cible, historique)

---

## ETAPE 5 — Seller Dashboard (Next.js)

> **REFERENCE** : Reproduit a l'identique du projet Laravel
> **Source** : `/Users/chrisdev/Documents/esturaireachats/resources/views/seller/`
> **Routes source** : `/Users/chrisdev/Documents/esturaireachats/routes/seller.php`
> **API source** : `/Users/chrisdev/Documents/esturaireachats/routes/api_seller.php`

### 5.1 Layout

- [x] 5.1.1 Sidebar navigation vendeur (ref: `seller/inc/seller_sidenav.blade.php`)
- [x] 5.1.2 Top navbar vendeur (ref: `seller/inc/seller_nav.blade.php`)
- [x] 5.1.3 Layout responsive

### 5.2 Pages Seller

- [x] 5.2.1 Dashboard (stats ventes, revenus, top 12 produits, graphiques)
- [x] 5.2.2 Produits — liste (tous, actifs, inactifs, en attente)
- [x] 5.2.3 Produits — ajouter (formulaire complet: infos, images, variantes, prix, stock)
- [x] 5.2.4 Produits — modifier
- [x] 5.2.5 Produits — SKU combinations (variantes dynamiques)
- [x] 5.2.6 Produits digitaux (si applicable)
- [x] 5.2.7 Commandes — liste (filtres par statut)
- [x] 5.2.8 Commandes — detail (update delivery/payment status)
- [x] 5.2.9 Coupons — liste + CRUD
- [x] 5.2.10 Ma boutique (modifier profil: nom, logo, description, adresse)
- [x] 5.2.11 Historique paiements
- [x] 5.2.12 Historique commissions
- [x] 5.2.13 Demandes de retrait (creer, historique)
- [x] 5.2.14 Demandes de remboursement (approuver, rejeter)
- [x] 5.2.15 Conversations / messages clients
- [x] 5.2.16 Notifications
- [x] 5.2.17 Package vendeur (plan actuel, upgrade)
- [x] 5.2.18 Upload en masse (bulk product upload)
- [x] 5.2.19 POS / Point de vente (recherche produits, panier, paiement, recu)
- [x] 5.2.20 POS config (parametres point de vente)
- [x] 5.2.21 Encheres — produits (liste produits auction)
- [x] 5.2.22 Encheres — commandes (liste commandes encheres)
- [x] 5.2.23 Avis clients (liste avis sur produits vendeur)
- [x] 5.2.24 Questions produits (repondre aux questions clients)
- [x] 5.2.25 Tickets de support (creer, lister, detail)
- [x] 5.2.26 Gestionnaire fichiers (upload, liste, suppression)

### 5.3 Integration API Seller Dashboard

- [x] 5.3.1 Connecter toutes les 18 pages seller aux endpoints API reels (suppression mock data, loading states, gestion erreurs)
- [x] 5.3.2 Endpoints backend crees : dashboard stats, reviews seller, upload my, support tickets/queries, commissions, seller packages purchases, settings seller
- [x] 5.3.3 API client seller (auth JWT, upload FormData, redirect 401)

---

## ETAPE 6 — App Mobile (Flutter)

> Ref images : `/Users/chrisdev/Desktop/image mobile/`
> Clone identique de l'app Alibaba mobile, adapte pour l'Afrique (FCFA, Mobile Money, multi-pays)

### 6.0 Splash & Onboarding

- [x] 6.0.1 Splash screen (logo EstuaireAchats, animation, fond blanc/orange)
- [x] 6.0.2 Ecrans onboarding defilants (3-4 ecrans : "Achetez partout en Afrique", "Payez avec Mobile Money", "Livraison garantie", "Fournisseurs verifies")
- [x] 6.0.3 Bouton "Commencer" → login/accueil

### 6.1 Navigation (5 onglets bottom bar comme Alibaba)

- [x] 6.1.1 Tab Accueil (icone maison, orange quand actif)
- [x] 6.1.2 Tab Categories (icone grille 4 carres)
- [x] 6.1.3 Tab Messagerie (icone bulle, badge rouge compteur)
- [x] 6.1.4 Tab Panier (icone panier, badge compteur)
- [x] 6.1.5 Tab Mon Compte (icone personne, "Mon EA")

### 6.2 Accueil

- [x] 6.2.1 4 onglets en haut : AI Mode | Produits | Fabricants | Mondial
- [x] 6.2.2 Barre recherche (icone camera, texte recherche, micro, bouton recherche orange)
- [x] 6.2.3 3 raccourcis horizontaux : Explorer par categories, Demander un devis, Top du classement
- [x] 6.2.4 Banniere horizontale scrollable : Livraison GRATUITE + Protection de remboursement 60j
- [x] 6.2.5 Section Historique (produits vus recemment, miniatures horizontales avec prix)
- [x] 6.2.6 Onglets filtre : Tous | Meilleures offres | Personnalisation rapide
- [x] 6.2.7 Sous-categories horizontales avec icones rondes (Wax, Car Polisher, etc.)
- [x] 6.2.8 Feed produits grille 2 colonnes (image, icone recherche visuelle, nom tronque, prix range FCFA, MOQ, Verified badge, nb vendus, livraison estimee)
- [x] 6.2.9 Banniere "Salon en ligne" (promo caroussel)
- [x] 6.2.10 Onglet Fabricants : sous-categories, correspondances usine, echantillons, top classement fabricants (meilleures ventes, reponse rapide, plus populaires, leaders)
- [x] 6.2.11 Onglet AI Mode : sourcing intelligent, suggestions IA, credits, champ texte "Decrivez vos besoins"
- [x] 6.2.12 Onglet Mondial : filtres pays (Monde, Chine, Pakistan, etc.), feed produits par pays
- [x] 6.2.13 Bottom sheet Livraison GRATUITE (regles detaillees, economies, conditions)
- [x] 6.2.14 Bottom sheet Protection remboursement (paiements securises, protection commande, icones cartes)
- [x] 6.2.15 Page Historique (grille 3 colonnes produits vus, "Voir plus", section "Recommandes pour vous")

### 6.3 Categories

- [x] 6.3.1 Sidebar gauche categories (Pour vous, En vedette, Offres speciales, Vetements & Accessoires, Electronique, Maison & Jardin, Sports & Loisirs, Fournitures auto, Produits de beaute, Bijoux & Montres, Chaussures, Bagages & Sacs, Emballage)
- [x] 6.3.2 Zone droite : banniere "local stock" + grille sous-categories en cercles avec icones
- [x] 6.3.3 Onglet "En vedette" : sections thematiques (Batiment jardin, Systeme karaoke, etc.) avec sous-categories en cercles
- [x] 6.3.4 Onglet "Offres speciales" : offres duree limitee, grille 3 colonnes
- [x] 6.3.5 Clic sous-categorie → listing produits (barre recherche, filtres Verified/Livraison, grille 2 colonnes, prix barre en rouge, quantite min, badge Verified, nb vendus, bouton ajout panier)

### 6.4 Detail produit

- [x] 6.4.1 Galerie images plein ecran avec onglets (Photos X/Y | Vehicule | Points forts)
- [x] 6.4.2 Icone coeur favori + recherche visuelle sur image
- [x] 6.4.3 Banniere promo ("Economisez 10 $US sur les commandes de plus de 100 $US avec PayPal")
- [x] 6.4.4 Prix par paliers (ex: 15 FCFA cmd min 20pcs | 13 FCFA 30-49pcs | 10 FCFA ≥50pcs)
- [x] 6.4.5 Titre produit complet + description extensible (chevron)
- [x] 6.4.6 Note boutique (etoile + nb avis)
- [x] 6.4.7 Section Verified Fournisseur (logo, nom entreprise, badges personnalisation, taux reachat, anciennete)
- [x] 6.4.8 Selecteur variantes (Couleur, Type, Taille) avec chips
- [x] 6.4.9 Vehicules compatibles (liste extensible)
- [x] 6.4.10 Section Protection des commandes (paiements securises icones cartes, protection remboursement, Trade Assurance)
- [x] 6.4.11 Caracteristiques techniques (grille cle-valeur)
- [x] 6.4.12 3 onglets scroll : Apercu | Details (images descriptives fournisseur) | Autres produits (grille produits du meme fournisseur)
- [x] 6.4.13 Section "Produits similaires" avec recherche visuelle
- [x] 6.4.14 Barre bottom fixe : Magasin | Discuter ici (outline) | Envoyer demande (orange plein)

### 6.5 Panier

- [x] 6.5.1 Header "Panier(N)" + adresse livraison + icone coeur
- [x] 6.5.2 Etat vide : illustration panier + "Votre panier est vide" + bouton "Explorer par categories"
- [x] 6.5.3 Section Protection commandes (paiements securises, livraison garantie, remboursement)
- [x] 6.5.4 Section "Recommandes pour vous" (grille 2 colonnes)
- [x] 6.5.5 Etat rempli : liste articles groupes par vendeur, checkbox, quantite, prix
- [x] 6.5.6 Barre bottom fixe : Tous (checkbox) | Total FCFA | Bouton "Payer" (orange)

### 6.6 Checkout / Paiement

- [x] 6.6.1 Adresse de livraison (selection, ajout)
- [x] 6.6.2 Resume commande (articles, quantites, prix)
- [x] 6.6.3 Mode de livraison (standard, express, estimation date)
- [x] 6.6.4 Methode paiement (MTN MoMo, Orange Money, PayPal, carte)
- [x] 6.6.5 Resume total (sous-total, frais livraison, total)
- [x] 6.6.6 Bouton "Commander" → confirmation
- [x] 6.6.7 Page confirmation commande (succes, numero, suivi)

### 6.7 Messagerie

- [x] 6.7.1 3 onglets header : Commandes | Notification (badge rouge) | Autres
- [x] 6.7.2 Barre recherche messages/fournisseurs
- [x] 6.7.3 Filtres : Non lus (badge) | Mes etiquettes (dropdown avec gestion)
- [x] 6.7.4 Liste conversations (avatar, nom fournisseur, entreprise, dernier message tronque, date, badge non lu)
- [x] 6.7.5 Ecran chat (bulles messages, carte de visite, fichiers, images)
- [x] 6.7.6 Suggestions rapides en bas ("Demande de commande", "Voir options de paiement")
- [x] 6.7.7 Champ saisie message + boutons (ajout, agrandir, emoji, envoyer)
- [x] 6.7.8 Parametres discussion (epingler, desactiver son, notes, recherche historique, documents partages, effacer)

### 6.8 Profil (Mon Alibaba / Mon EA)

- [x] 6.8.1 Header : avatar + nom + adresse livraison + icones (support, scanner, parametres)
- [x] 6.8.2 3 raccourcis : Favori (avec miniature) | Historique | Coupons
- [x] 6.8.3 Banniere "Ajoutez carte pour paiement simplifie"
- [x] 6.8.4 Section "Mes commandes" (Voir tout) + message protection commandes
- [x] 6.8.5 Section "Paiement & Financement" (4 icones : Coupons & Credits, Factures & Recus, Cartes & Comptes, Virement bancaire)
- [x] 6.8.6 Section "Plus de fonctionnalites" (scroll horizontal : Adresse expedition, Infos fiscales, Demandes de renseignement, Abonnement, Demandes de devis, Certificats)
- [x] 6.8.7 Banniere parrainage "Parrainez et gagnez"
- [x] 6.8.8 Banniere "Procurez-vous les articles preferes"
- [x] 6.8.9 Lien "Agent de sourcing par IA"
- [x] 6.8.10 Lien "Commencez a vendre sur EstuaireAchats"
- [x] 6.8.11 Section "Inspire de vos visites" (onglets Des favoris | Categories, feed produits)

### 6.9 Auth

- [x] 6.9.1 Login (email/telephone + mot de passe)
- [x] 6.9.2 Register (acheteur, nom, email/telephone, mot de passe)
- [x] 6.9.3 Mot de passe oublie

### 6.10 Ecrans secondaires

- [x] 6.10.1 Page fournisseur/boutique (banniere, infos, produits, avis)
- [x] 6.10.2 Recherche avec suggestions auto-complete
- [x] 6.10.3 Filtres avances (prix, MOQ, Verified, livraison, pays)
- [x] 6.10.4 Mes commandes (liste, detail, suivi, timeline statut)
- [x] 6.10.5 Mes adresses (CRUD)
- [x] 6.10.6 Mes favoris / wishlist
- [x] 6.10.7 Demande de devis (formulaire multi-etapes)
- [x] 6.10.8 Parametres (langue, notifications, compte, deconnexion)

---

## ETAPE 7 — Finalisation & Deploiement

- [ ] 7.1 Tests unitaires backend (Jest, coverage > 80%)
- [ ] 7.2 Tests e2e (API + Frontend)
- [ ] 7.3 SEO (meta tags, Open Graph, sitemap, robots.txt)
- [ ] 7.4 Performance (lazy loading, code splitting, cache)
- [ ] 7.5 Securite (rate limiting, CORS, XSS, CSRF, SQL injection)
- [ ] 7.6 CI/CD pipeline (GitHub Actions)
- [ ] 7.7 Dockerfiles production
- [ ] 7.8 Deploiement VPS (Nginx, SSL, PM2)
- [ ] 7.9 Monitoring (logs, alertes)
- [ ] 7.10 Documentation API finale

---

## Notes

- Quand une tache est terminee, remplacer `[ ]` par `[x]`
- Si un ecran manque, l'utilisateur enverra les screenshots et on ajoutera les taches
- Les dashboards admin et seller sont des copies identiques du projet Laravel source
- Devise unique : FCFA (XAF), pas de multi-devises
- Toujours demander validation avant de passer a l'etape suivante
