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
| Paiements | MTN MoMo, Orange Money, PayPal |
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

- [ ] 1.1 Init monorepo Turborepo + pnpm workspace
- [ ] 1.2 Config TypeScript de base (tsconfig.base.json)
- [ ] 1.3 Package @ea/shared (types, constantes, enums)
- [ ] 1.4 Docker-compose (PostgreSQL, Redis, Elasticsearch)
- [ ] 1.5 Fichier .env.example complet
- [ ] 1.6 Git init + .gitignore

---

## ETAPE 2 — Backend API (NestJS + Prisma)

### 2.1 Schema Prisma (base de donnees)

- [ ] 2.1.1 User (roles: BUYER, SELLER, ADMIN, STAFF)
- [ ] 2.1.2 Shop (boutique vendeur, verification, stats)
- [ ] 2.1.3 Category (hierarchie parent/enfant, featured, traductions)
- [ ] 2.1.4 Brand (marques)
- [ ] 2.1.5 Product (slug, status, wholesale, digital, auction)
- [ ] 2.1.6 ProductStock (variantes, SKU, prix, stock)
- [ ] 2.1.7 ProductImage
- [ ] 2.1.8 PriceTier (prix degressifs par quantite)
- [ ] 2.1.9 Cart (par vendeur, avec coupons, shipping)
- [ ] 2.1.10 Order + CombinedOrder (groupement par client)
- [ ] 2.1.11 OrderDetail (ligne commande)
- [ ] 2.1.12 Payment (MTN MoMo, Orange Money, PayPal, COD, Wallet)
- [ ] 2.1.13 Address (livraison, avec Country/State/City)
- [ ] 2.1.14 Review (avis produits)
- [ ] 2.1.15 Wishlist
- [ ] 2.1.16 Coupon + CouponUsage (cart_base, product_base)
- [ ] 2.1.17 Wallet (portefeuille, transactions)
- [ ] 2.1.18 RefundRequest (remboursements)
- [ ] 2.1.19 Conversation + Message (chat acheteur-vendeur)
- [ ] 2.1.20 Notification
- [ ] 2.1.21 Upload (fichiers/images)
- [ ] 2.1.22 RFQ (demandes de devis)
- [ ] 2.1.23 DeliveryBoy
- [ ] 2.1.24 ClubPoint (points fidelite)
- [ ] 2.1.25 Affiliate (programme affilie)
- [ ] 2.1.26 SellerPackage + SellerPackagePayment
- [ ] 2.1.27 BusinessSetting (config cle-valeur)
- [ ] 2.1.28 Carrier + PickupPoint (livraison)

### 2.2 Modules API

- [ ] 2.2.1 Auth (login, signup email/phone, social login, OTP, reset password, refresh token)
- [ ] 2.2.2 Users (profil, update, avatar, delete account, admin listing)
- [ ] 2.2.3 Products (CRUD, variantes, prix paliers, wholesale, featured, search, filtre)
- [ ] 2.2.4 Categories (CRUD, hierarchie, featured, traductions)
- [ ] 2.2.5 Brands (CRUD)
- [ ] 2.2.6 Shop (CRUD boutique, verification, stats, profil public)
- [ ] 2.2.7 Cart (add, remove, change qty, summary, par vendeur)
- [ ] 2.2.8 Orders (checkout/store, historique, detail, cancel, statuts)
- [ ] 2.2.9 Payments (MTN MoMo, Orange Money, PayPal, COD, Wallet)
- [ ] 2.2.10 Addresses (CRUD, villes/pays, adresse par defaut)
- [ ] 2.2.11 Reviews (submit, list par produit, moderation)
- [ ] 2.2.12 Wishlist (add, remove, list)
- [ ] 2.2.13 Coupons (apply, remove, CRUD vendeur, validation dates/montants)
- [ ] 2.2.14 Wallet (balance, recharge, historique, paiement)
- [ ] 2.2.15 Refunds (demande, approbation vendeur, rejet)
- [ ] 2.2.16 Chat/Messages (conversations, envoyer, marquer lu)
- [ ] 2.2.17 Notifications (list, marquer lu, delete)
- [ ] 2.2.18 Upload (images produits, avatars, fichiers)
- [ ] 2.2.19 RFQ (demande devis, reponse vendeur)
- [ ] 2.2.20 Shipping (calcul frais, carriers, pickup points)
- [ ] 2.2.21 DeliveryBoy (assignation, suivi, historique)
- [ ] 2.2.22 ClubPoints (gagner, convertir en credit)
- [ ] 2.2.23 Affiliate (programme, commissions, logs)
- [ ] 2.2.24 SellerPackages (plans vendeur, souscription)
- [ ] 2.2.25 BusinessSettings (config admin, cle-valeur)
- [ ] 2.2.26 FlashDeals (offres du jour, limitees dans le temps)
- [ ] 2.2.27 Swagger docs (/api/docs)

### 2.3 API Seller (endpoints specifiques vendeur)

- [ ] 2.3.1 Dashboard stats (ventes, revenus, top produits)
- [ ] 2.3.2 Products CRUD (ajouter, modifier, supprimer, SKU combinations)
- [ ] 2.3.3 Orders (liste, detail, update delivery/payment status)
- [ ] 2.3.4 Coupons vendeur (CRUD)
- [ ] 2.3.5 Payment history + commissions
- [ ] 2.3.6 Refunds (approuver, rejeter)
- [ ] 2.3.7 Withdraw requests (demandes de retrait)
- [ ] 2.3.8 Shop profile (update)

---

## ETAPE 3 — Site Web Public (Next.js — clone Alibaba)

> Ref images : `references/web/`

### 3.1 Layout & Navigation

- [ ] 3.1.1 TopBar (langue, devise, livraison, aide)
- [ ] 3.1.2 Header (logo, recherche avec suggestions, recherche par image, panier, favoris, profil)
- [ ] 3.1.3 SecondaryNav (Toutes categories, Fabricants Verified, Protection commandes, Accio Work, etc.)
- [ ] 3.1.4 Footer (liens, paiements, apps, reseaux sociaux)
- [ ] 3.1.5 Sidebar flottante (messagerie, Accio Work, Alibaba Lens, haut de page)
- [ ] 3.1.6 MegaMenu categories

### 3.2 Pages principales

- [ ] 3.2.1 Homepage — onglet Produits (historique, explorez, recommande, feed produits infini)
- [ ] 3.2.2 Homepage — onglet AI Mode
- [ ] 3.2.3 Homepage — onglet Fabricants
- [ ] 3.2.4 Homepage — onglet Mondial
- [ ] 3.2.5 Recherche / listing produits (grille, MOQ, prix range, Verified, vendus, filtres)
- [ ] 3.2.6 Detail produit (galerie, prix par palier, variantes, couleur, taille, fournisseur)
- [ ] 3.2.7 Detail produit — infos fournisseur (note, reponse, certifications)
- [ ] 3.2.8 Detail produit — envoyer une demande / RFQ
- [ ] 3.2.9 Detail produit — produits similaires
- [ ] 3.2.10 Panier (groupe par vendeur, totaux, protection commande)
- [ ] 3.2.11 Checkout (adresse, mode livraison, paiement)
- [ ] 3.2.12 Confirmation commande
- [ ] 3.2.13 Categories (sidebar + grille produits)
- [ ] 3.2.14 Page fournisseur/boutique (vitrine, produits, avis, infos)
- [ ] 3.2.15 Demande de devis (formulaire multi-etapes)
- [ ] 3.2.16 Top classement
- [ ] 3.2.17 Flash deals / offres du jour

### 3.3 Auth & Profil client

- [ ] 3.3.1 Login (email/phone + password)
- [ ] 3.3.2 Register (acheteur/vendeur)
- [ ] 3.3.3 Reset password
- [ ] 3.3.4 Profil client (infos, avatar)
- [ ] 3.3.5 Mes commandes (historique, detail, suivi, annulation)
- [ ] 3.3.6 Wishlist / favoris
- [ ] 3.3.7 Adresses de livraison (CRUD)
- [ ] 3.3.8 Messagerie (conversations avec vendeurs)
- [ ] 3.3.9 Coupons & credits
- [ ] 3.3.10 Wallet / portefeuille

### 3.4 Portail vendeur (page publique)

- [ ] 3.4.1 Landing page "Vendre sur EstuaireAchats" (hero, avantages, tarification, inscription)

### 3.5 Connexion Frontend <-> API

- [ ] 3.5.1 State management (Zustand) : auth, cart, user, wishlist
- [ ] 3.5.2 Client API centralise (fetch wrapper, interceptors, tokens)
- [ ] 3.5.3 Connecter toutes les pages aux endpoints API reels
- [ ] 3.5.4 Loading states, error handling, toasts

---

## ETAPE 4 — Admin Dashboard (Next.js)

> **REFERENCE** : Reproduit a l'identique du projet Laravel
> **Source** : `/Users/chrisdev/Documents/esturaireachats/resources/views/backend/`
> **Routes source** : `/Users/chrisdev/Documents/esturaireachats/routes/admin.php`

### 4.1 Layout

- [ ] 4.1.1 Sidebar navigation (menus admin)
- [ ] 4.1.2 Top navbar (recherche, notifications, profil)
- [ ] 4.1.3 Layout responsive

### 4.2 Pages Admin

- [ ] 4.2.1 Dashboard (stats globales: revenus, commandes, users, produits)
- [ ] 4.2.2 Gestion categories (CRUD, hierarchie, featured, icones)
- [ ] 4.2.3 Gestion marques (CRUD)
- [ ] 4.2.4 Gestion produits admin (liste, moderation, approbation)
- [ ] 4.2.5 Gestion produits vendeur (liste par vendeur, approbation)
- [ ] 4.2.6 Gestion commandes (liste, detail, update statut)
- [ ] 4.2.7 Gestion clients (liste, ban/unban, detail)
- [ ] 4.2.8 Gestion vendeurs (liste, verification, approbation, suspension)
- [ ] 4.2.9 Gestion boutiques (moderation)
- [ ] 4.2.10 Gestion coupons (CRUD)
- [ ] 4.2.11 Gestion flash deals (CRUD)
- [ ] 4.2.12 Gestion remboursements (approbation, rejet)
- [ ] 4.2.13 Gestion livreurs (liste, assignation, paiements)
- [ ] 4.2.14 Gestion avis (moderation)
- [ ] 4.2.15 Gestion paiements (historique, rapports)
- [ ] 4.2.16 Gestion packages vendeur (CRUD plans)
- [ ] 4.2.17 Gestion programme affilie
- [ ] 4.2.18 Gestion club points
- [ ] 4.2.19 Parametres generaux (business settings, logo, couleurs, etc.)
- [ ] 4.2.20 Gestion langues / traductions
- [ ] 4.2.21 Gestion devises
- [ ] 4.2.22 Gestion frais de livraison / transporteurs
- [ ] 4.2.23 Gestion points de retrait
- [ ] 4.2.24 Rapports & analytics
- [ ] 4.2.25 Gestion staff (roles, permissions)
- [ ] 4.2.26 Gestion pages (CGU, politique confidentialite, etc.)
- [ ] 4.2.27 Gestion newsletter / notifications push

---

## ETAPE 5 — Seller Dashboard (Next.js)

> **REFERENCE** : Reproduit a l'identique du projet Laravel
> **Source** : `/Users/chrisdev/Documents/esturaireachats/resources/views/seller/`
> **Routes source** : `/Users/chrisdev/Documents/esturaireachats/routes/seller.php`
> **API source** : `/Users/chrisdev/Documents/esturaireachats/routes/api_seller.php`

### 5.1 Layout

- [ ] 5.1.1 Sidebar navigation vendeur (ref: `seller/inc/seller_sidenav.blade.php`)
- [ ] 5.1.2 Top navbar vendeur (ref: `seller/inc/seller_nav.blade.php`)
- [ ] 5.1.3 Layout responsive

### 5.2 Pages Seller

- [ ] 5.2.1 Dashboard (stats ventes, revenus, top 12 produits, graphiques)
- [ ] 5.2.2 Produits — liste (tous, actifs, inactifs, en attente)
- [ ] 5.2.3 Produits — ajouter (formulaire complet: infos, images, variantes, prix, stock)
- [ ] 5.2.4 Produits — modifier
- [ ] 5.2.5 Produits — SKU combinations (variantes dynamiques)
- [ ] 5.2.6 Produits digitaux (si applicable)
- [ ] 5.2.7 Commandes — liste (filtres par statut)
- [ ] 5.2.8 Commandes — detail (update delivery/payment status)
- [ ] 5.2.9 Coupons — liste + CRUD
- [ ] 5.2.10 Ma boutique (modifier profil: nom, logo, description, adresse)
- [ ] 5.2.11 Historique paiements
- [ ] 5.2.12 Historique commissions
- [ ] 5.2.13 Demandes de retrait (creer, historique)
- [ ] 5.2.14 Demandes de remboursement (approuver, rejeter)
- [ ] 5.2.15 Conversations / messages clients
- [ ] 5.2.16 Notifications
- [ ] 5.2.17 Package vendeur (plan actuel, upgrade)
- [ ] 5.2.18 Upload en masse (bulk product upload)

---

## ETAPE 6 — App Mobile (Flutter)

> Ref images : `references/mobile/`

### 6.1 Navigation (5 onglets comme Alibaba)

- [ ] 6.1.1 Tab Accueil
- [ ] 6.1.2 Tab Categories
- [ ] 6.1.3 Tab Messagerie
- [ ] 6.1.4 Tab Panier
- [ ] 6.1.5 Tab Mon Compte

### 6.2 Ecrans

- [ ] 6.2.1 Accueil (recherche, raccourcis, produits feed, onglets Produits/Fabricants/Mondial)
- [ ] 6.2.2 Categories (sidebar gauche + grille droite, recommandations)
- [ ] 6.2.3 Recherche / listing produits
- [ ] 6.2.4 Detail produit
- [ ] 6.2.5 Panier (vide + recommandations, protection commande)
- [ ] 6.2.6 Checkout / paiement
- [ ] 6.2.7 Messagerie (conversations, commandes, notifications)
- [ ] 6.2.8 Profil (commandes, favoris, coupons, paiement & financement, adresses, devis)
- [ ] 6.2.9 Login / Register
- [ ] 6.2.10 Page fournisseur

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
