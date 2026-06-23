import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// ─── Images produits (libres de droits, thematiques e-commerce) ───
const productImages: Record<string, string[]> = {
  electronique: [
    'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600',
    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600',
    'https://images.unsplash.com/photo-1526738549149-8e07eca6c147?w=600',
  ],
  mode: [
    'https://images.unsplash.com/photo-1558171813-01eda9b5304f?w=600',
    'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=600',
    'https://images.unsplash.com/photo-1590735213920-68192a487bc2?w=600',
  ],
  maison: [
    'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600',
    'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600',
    'https://images.unsplash.com/photo-1538688525198-9b88f6f53126?w=600',
  ],
  beaute: [
    'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=600',
    'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=600',
    'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=600',
  ],
  auto: [
    'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=600',
    'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=600',
    'https://images.unsplash.com/photo-1549317661-bd32c8ce0afa?w=600',
  ],
  sport: [
    'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=600',
    'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=600',
    'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=600',
  ],
  alimentaire: [
    'https://images.unsplash.com/photo-1606787366850-de6330128bfc?w=600',
    'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600',
    'https://images.unsplash.com/photo-1490818387583-1baba5e638af?w=600',
  ],
  materiel: [
    'https://images.unsplash.com/photo-1581244277943-fe4a9c777189?w=600',
    'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=600',
    'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=600',
  ],
};

// ─── Categories Alibaba completes (FR + EN) ───
const categoriesData: {
  name: string;
  nameEn: string;
  slug: string;
  icon: string;
  featured?: boolean;
  children: { name: string; nameEn: string }[];
}[] = [
  // 1
  {
    name: 'Vetements & Accessoires', nameEn: 'Apparel & Accessories', slug: 'vetements-accessoires', icon: 'checkroom', featured: true,
    children: [
      { name: 'Vetements femme', nameEn: 'Women\'s Clothing' },
      { name: 'Vetements homme', nameEn: 'Men\'s Clothing' },
      { name: 'Vetements enfant', nameEn: 'Kids\' Clothing' },
      { name: 'Sous-vetements & Pyjamas', nameEn: 'Underwear & Sleepwear' },
      { name: 'Robes', nameEn: 'Dresses' },
      { name: 'T-shirts & Polos', nameEn: 'T-shirts & Polos' },
      { name: 'Vestes & Manteaux', nameEn: 'Jackets & Coats' },
      { name: 'Vetements de travail', nameEn: 'Work Clothing' },
      { name: 'Vetements traditionnels africains', nameEn: 'African Traditional Clothing' },
      { name: 'Tissus & Textiles', nameEn: 'Fabrics & Textiles' },
    ],
  },
  // 2
  {
    name: 'Electronique grand public', nameEn: 'Consumer Electronics', slug: 'electronique-grand-public', icon: 'smartphone', featured: true,
    children: [
      { name: 'Smartphones & Telephones', nameEn: 'Smartphones & Phones' },
      { name: 'Ordinateurs portables', nameEn: 'Laptops' },
      { name: 'Tablettes', nameEn: 'Tablets' },
      { name: 'Ecouteurs & Casques', nameEn: 'Headphones & Earphones' },
      { name: 'Montres connectees', nameEn: 'Smart Watches' },
      { name: 'Cameras & Accessoires photo', nameEn: 'Cameras & Photo Accessories' },
      { name: 'Enceintes & Audio', nameEn: 'Speakers & Audio' },
      { name: 'Accessoires telephone', nameEn: 'Phone Accessories' },
      { name: 'Stockage & Memoire', nameEn: 'Storage & Memory' },
      { name: 'Cables & Chargeurs', nameEn: 'Cables & Chargers' },
    ],
  },
  // 3
  {
    name: 'Sports & Divertissements', nameEn: 'Sports & Entertainment', slug: 'sports-divertissements', icon: 'sports_soccer', featured: true,
    children: [
      { name: 'Football', nameEn: 'Football / Soccer' },
      { name: 'Fitness & Musculation', nameEn: 'Fitness & Bodybuilding' },
      { name: 'Course a pied', nameEn: 'Running' },
      { name: 'Basketball', nameEn: 'Basketball' },
      { name: 'Camping & Randonnee', nameEn: 'Camping & Hiking' },
      { name: 'Natation & Sports nautiques', nameEn: 'Swimming & Water Sports' },
      { name: 'Velos & Accessoires', nameEn: 'Bicycles & Accessories' },
      { name: 'Jeux de societe & Puzzles', nameEn: 'Board Games & Puzzles' },
      { name: 'Instruments de musique', nameEn: 'Musical Instruments' },
      { name: 'Equipements de gym', nameEn: 'Gym Equipment' },
    ],
  },
  // 4
  {
    name: 'Beaute & Soins personnels', nameEn: 'Beauty & Personal Care', slug: 'beaute-soins', icon: 'face_retouching_natural', featured: true,
    children: [
      { name: 'Soins du visage', nameEn: 'Face Care' },
      { name: 'Soins du corps', nameEn: 'Body Care' },
      { name: 'Maquillage', nameEn: 'Makeup' },
      { name: 'Parfums', nameEn: 'Perfumes & Fragrances' },
      { name: 'Soins des cheveux', nameEn: 'Hair Care' },
      { name: 'Extensions & Perruques', nameEn: 'Hair Extensions & Wigs' },
      { name: 'Soins des ongles', nameEn: 'Nail Care' },
      { name: 'Rasage & Epilation', nameEn: 'Shaving & Hair Removal' },
      { name: 'Produits bio & naturels', nameEn: 'Organic & Natural Products' },
      { name: 'Outils & Appareils beaute', nameEn: 'Beauty Tools & Devices' },
    ],
  },
  // 5
  {
    name: 'Bijoux, Lunettes & Montres', nameEn: 'Jewelry, Eyewear & Watches', slug: 'bijoux-lunettes-montres', icon: 'diamond',
    children: [
      { name: 'Bijoux fantaisie', nameEn: 'Fashion Jewelry' },
      { name: 'Bijoux en or', nameEn: 'Gold Jewelry' },
      { name: 'Bijoux en argent', nameEn: 'Silver Jewelry' },
      { name: 'Montres', nameEn: 'Watches' },
      { name: 'Lunettes de soleil', nameEn: 'Sunglasses' },
      { name: 'Lunettes de vue', nameEn: 'Eyeglasses' },
      { name: 'Colliers & Pendentifs', nameEn: 'Necklaces & Pendants' },
      { name: 'Bracelets', nameEn: 'Bracelets' },
      { name: 'Boucles d\'oreilles', nameEn: 'Earrings' },
      { name: 'Bagues', nameEn: 'Rings' },
    ],
  },
  // 6
  {
    name: 'Maison & Jardin', nameEn: 'Home & Garden', slug: 'maison-jardin', icon: 'home', featured: true,
    children: [
      { name: 'Meubles', nameEn: 'Furniture' },
      { name: 'Decoration interieure', nameEn: 'Home Decor' },
      { name: 'Ustensiles de cuisine', nameEn: 'Kitchen Utensils' },
      { name: 'Literie', nameEn: 'Bedding' },
      { name: 'Rangement & Organisation', nameEn: 'Storage & Organization' },
      { name: 'Salle de bain', nameEn: 'Bathroom' },
      { name: 'Jardinage', nameEn: 'Gardening' },
      { name: 'Art de la table', nameEn: 'Tableware' },
      { name: 'Tapis & Moquettes', nameEn: 'Rugs & Carpets' },
      { name: 'Rideaux & Stores', nameEn: 'Curtains & Blinds' },
    ],
  },
  // 7
  {
    name: 'Vetements de sport & Plein air', nameEn: 'Sportswear & Outdoor Apparel', slug: 'vetements-sport-plein-air', icon: 'directions_run',
    children: [
      { name: 'Maillots de sport', nameEn: 'Sports Jerseys' },
      { name: 'Survetements', nameEn: 'Tracksuits' },
      { name: 'Chaussures de sport', nameEn: 'Sports Shoes' },
      { name: 'Leggings & Shorts sport', nameEn: 'Leggings & Sports Shorts' },
      { name: 'Vetements de yoga', nameEn: 'Yoga Clothing' },
      { name: 'Maillots de bain', nameEn: 'Swimwear' },
      { name: 'Vetements de randonnee', nameEn: 'Hiking Clothing' },
      { name: 'Casquettes & Chapeaux sport', nameEn: 'Sports Caps & Hats' },
    ],
  },
  // 8
  {
    name: 'Chaussures & Accessoires', nameEn: 'Shoes & Accessories', slug: 'chaussures-accessoires', icon: 'hiking', featured: true,
    children: [
      { name: 'Chaussures homme', nameEn: 'Men\'s Shoes' },
      { name: 'Chaussures femme', nameEn: 'Women\'s Shoes' },
      { name: 'Chaussures enfant', nameEn: 'Kids\' Shoes' },
      { name: 'Sandales & Tongs', nameEn: 'Sandals & Flip-Flops' },
      { name: 'Bottes', nameEn: 'Boots' },
      { name: 'Chaussures de securite', nameEn: 'Safety Shoes' },
      { name: 'Sacs a main', nameEn: 'Handbags' },
      { name: 'Ceintures', nameEn: 'Belts' },
      { name: 'Chapeaux & Casquettes', nameEn: 'Hats & Caps' },
      { name: 'Echarpes & Foulards', nameEn: 'Scarves' },
    ],
  },
  // 9
  {
    name: 'Bagages & Sacs', nameEn: 'Luggage, Bags & Cases', slug: 'bagages-sacs', icon: 'luggage',
    children: [
      { name: 'Valises & Trolleys', nameEn: 'Suitcases & Trolleys' },
      { name: 'Sacs a dos', nameEn: 'Backpacks' },
      { name: 'Sacs de voyage', nameEn: 'Travel Bags' },
      { name: 'Sacs pour ordinateur', nameEn: 'Laptop Bags' },
      { name: 'Sacs scolaires', nameEn: 'School Bags' },
      { name: 'Portefeuilles', nameEn: 'Wallets' },
      { name: 'Etuis & Housses', nameEn: 'Cases & Covers' },
    ],
  },
  // 10
  {
    name: 'Emballage & Impression', nameEn: 'Packaging & Printing', slug: 'emballage-impression', icon: 'inventory_2',
    children: [
      { name: 'Emballages alimentaires', nameEn: 'Food Packaging' },
      { name: 'Sacs & Sachets', nameEn: 'Bags & Pouches' },
      { name: 'Boites & Cartons', nameEn: 'Boxes & Cartons' },
      { name: 'Etiquettes & Tags', nameEn: 'Labels & Tags' },
      { name: 'Emballage cadeau', nameEn: 'Gift Wrapping' },
      { name: 'Machines d\'impression', nameEn: 'Printing Machines' },
      { name: 'Papier & Carton', nameEn: 'Paper & Cardboard' },
    ],
  },
  // 11
  {
    name: 'Parents, Enfants & Jouets', nameEn: 'Parents, Kids & Toys', slug: 'parents-enfants-jouets', icon: 'child_friendly', featured: true,
    children: [
      { name: 'Jouets educatifs', nameEn: 'Educational Toys' },
      { name: 'Peluches', nameEn: 'Stuffed Toys' },
      { name: 'Jouets telecommandes', nameEn: 'Remote Control Toys' },
      { name: 'Puericulture', nameEn: 'Baby Care' },
      { name: 'Poussettes & Sieges auto', nameEn: 'Strollers & Car Seats' },
      { name: 'Couches & Hygiene bebe', nameEn: 'Diapers & Baby Hygiene' },
      { name: 'Vetements bebe', nameEn: 'Baby Clothing' },
      { name: 'Jeux de plein air', nameEn: 'Outdoor Play' },
      { name: 'Figurines & Poupees', nameEn: 'Figurines & Dolls' },
      { name: 'Jeux video & Consoles', nameEn: 'Video Games & Consoles' },
    ],
  },
  // 12
  {
    name: 'Entretien maison & Soins personnels', nameEn: 'Personal Care & Home Care', slug: 'entretien-soins', icon: 'cleaning_services',
    children: [
      { name: 'Produits de nettoyage', nameEn: 'Cleaning Products' },
      { name: 'Lessive & Detergents', nameEn: 'Laundry & Detergents' },
      { name: 'Desodorisants', nameEn: 'Air Fresheners' },
      { name: 'Hygiene dentaire', nameEn: 'Dental Hygiene' },
      { name: 'Papier hygienique & Mouchoirs', nameEn: 'Toilet Paper & Tissues' },
      { name: 'Insecticides & Anti-nuisibles', nameEn: 'Insecticides & Pest Control' },
    ],
  },
  // 13
  {
    name: 'Sante & Medical', nameEn: 'Health & Medical', slug: 'sante-medical', icon: 'local_hospital',
    children: [
      { name: 'Equipements medicaux', nameEn: 'Medical Equipment' },
      { name: 'Instruments chirurgicaux', nameEn: 'Surgical Instruments' },
      { name: 'Produits pharmaceutiques', nameEn: 'Pharmaceuticals' },
      { name: 'Complements alimentaires', nameEn: 'Dietary Supplements' },
      { name: 'Masques & Protection', nameEn: 'Masks & Protection' },
      { name: 'Thermometres & Diagnostic', nameEn: 'Thermometers & Diagnostics' },
      { name: 'Fauteuils roulants & Mobilite', nameEn: 'Wheelchairs & Mobility' },
      { name: 'Materiel dentaire', nameEn: 'Dental Equipment' },
    ],
  },
  // 14
  {
    name: 'Cadeaux & Artisanat', nameEn: 'Gifts & Crafts', slug: 'cadeaux-artisanat', icon: 'card_giftcard',
    children: [
      { name: 'Artisanat africain', nameEn: 'African Crafts' },
      { name: 'Objets decoratifs', nameEn: 'Decorative Objects' },
      { name: 'Bougies & Encens', nameEn: 'Candles & Incense' },
      { name: 'Fleurs artificielles', nameEn: 'Artificial Flowers' },
      { name: 'Cadres & Tableaux', nameEn: 'Frames & Paintings' },
      { name: 'Sculptures & Statues', nameEn: 'Sculptures & Statues' },
      { name: 'Cadeaux promotionnels', nameEn: 'Promotional Gifts' },
    ],
  },
  // 15
  {
    name: 'Animaux de compagnie', nameEn: 'Pet Supplies', slug: 'animaux-compagnie', icon: 'pets',
    children: [
      { name: 'Alimentation animale', nameEn: 'Pet Food' },
      { name: 'Accessoires chien', nameEn: 'Dog Accessories' },
      { name: 'Accessoires chat', nameEn: 'Cat Accessories' },
      { name: 'Aquariums & Poissons', nameEn: 'Aquariums & Fish' },
      { name: 'Cages & Volières', nameEn: 'Cages & Aviaries' },
      { name: 'Toilettage animal', nameEn: 'Pet Grooming' },
    ],
  },
  // 16
  {
    name: 'Fournitures scolaires & Bureau', nameEn: 'School & Office Supplies', slug: 'fournitures-bureau', icon: 'menu_book',
    children: [
      { name: 'Cahiers & Carnets', nameEn: 'Notebooks' },
      { name: 'Stylos & Crayons', nameEn: 'Pens & Pencils' },
      { name: 'Sacs scolaires', nameEn: 'School Bags' },
      { name: 'Materiel de bureau', nameEn: 'Office Equipment' },
      { name: 'Imprimantes & Scanners', nameEn: 'Printers & Scanners' },
      { name: 'Papeterie', nameEn: 'Stationery' },
      { name: 'Classeurs & Rangement', nameEn: 'Binders & Filing' },
      { name: 'Calculatrices', nameEn: 'Calculators' },
    ],
  },
  // 17
  {
    name: 'Machines industrielles', nameEn: 'Industrial Machinery', slug: 'machines-industrielles', icon: 'factory',
    children: [
      { name: 'Machines agricoles', nameEn: 'Agricultural Machinery' },
      { name: 'Machines d\'emballage', nameEn: 'Packaging Machinery' },
      { name: 'Machines alimentaires', nameEn: 'Food Processing Machinery' },
      { name: 'Machines textiles', nameEn: 'Textile Machinery' },
      { name: 'Machines a bois', nameEn: 'Woodworking Machinery' },
      { name: 'Compresseurs', nameEn: 'Compressors' },
      { name: 'Generateurs', nameEn: 'Generators' },
      { name: 'Pompes industrielles', nameEn: 'Industrial Pumps' },
    ],
  },
  // 18
  {
    name: 'Equipements commerciaux', nameEn: 'Commercial Equipment & Machinery', slug: 'equipements-commerciaux', icon: 'storefront',
    children: [
      { name: 'Equipements de restauration', nameEn: 'Catering Equipment' },
      { name: 'Refrigerateurs commerciaux', nameEn: 'Commercial Refrigerators' },
      { name: 'Fours & Boulangerie', nameEn: 'Ovens & Bakery' },
      { name: 'Machines a cafe', nameEn: 'Coffee Machines' },
      { name: 'Vitrines & Presentoirs', nameEn: 'Display Cases' },
      { name: 'Caisses enregistreuses', nameEn: 'Cash Registers' },
      { name: 'Equipements de supermarche', nameEn: 'Supermarket Equipment' },
    ],
  },
  // 19
  {
    name: 'Engins de construction', nameEn: 'Construction & Building Machinery', slug: 'engins-construction', icon: 'construction',
    children: [
      { name: 'Excavatrices', nameEn: 'Excavators' },
      { name: 'Chargeuses', nameEn: 'Loaders' },
      { name: 'Betonnieres', nameEn: 'Concrete Mixers' },
      { name: 'Grues', nameEn: 'Cranes' },
      { name: 'Bulldozers', nameEn: 'Bulldozers' },
      { name: 'Compacteurs', nameEn: 'Compactors' },
    ],
  },
  // 20
  {
    name: 'Construction & Immobilier', nameEn: 'Construction & Real Estate', slug: 'construction-immobilier', icon: 'domain', featured: true,
    children: [
      { name: 'Ciment & Beton', nameEn: 'Cement & Concrete' },
      { name: 'Fer & Acier', nameEn: 'Iron & Steel' },
      { name: 'Peinture & Revetements', nameEn: 'Paint & Coatings' },
      { name: 'Plomberie', nameEn: 'Plumbing' },
      { name: 'Carrelage & Ceramique', nameEn: 'Tiles & Ceramics' },
      { name: 'Portes & Fenetres', nameEn: 'Doors & Windows' },
      { name: 'Toiture', nameEn: 'Roofing' },
      { name: 'Electricite batiment', nameEn: 'Building Electrical' },
      { name: 'Isolation', nameEn: 'Insulation' },
      { name: 'Sanitaires', nameEn: 'Sanitary Ware' },
    ],
  },
  // 21
  {
    name: 'Meubles', nameEn: 'Furniture', slug: 'meubles', icon: 'chair',
    children: [
      { name: 'Canapes & Fauteuils', nameEn: 'Sofas & Armchairs' },
      { name: 'Lits & Matelas', nameEn: 'Beds & Mattresses' },
      { name: 'Tables & Chaises', nameEn: 'Tables & Chairs' },
      { name: 'Armoires & Commodes', nameEn: 'Wardrobes & Dressers' },
      { name: 'Meubles de bureau', nameEn: 'Office Furniture' },
      { name: 'Meubles de jardin', nameEn: 'Garden Furniture' },
      { name: 'Etageres & Bibliotheques', nameEn: 'Shelves & Bookcases' },
      { name: 'Meubles de salle de bain', nameEn: 'Bathroom Furniture' },
    ],
  },
  // 22
  {
    name: 'Eclairage', nameEn: 'Lights & Lighting', slug: 'eclairage', icon: 'lightbulb',
    children: [
      { name: 'Ampoules LED', nameEn: 'LED Bulbs' },
      { name: 'Lustres & Plafonniers', nameEn: 'Chandeliers & Ceiling Lights' },
      { name: 'Lampes de table', nameEn: 'Table Lamps' },
      { name: 'Eclairage exterieur', nameEn: 'Outdoor Lighting' },
      { name: 'Eclairage solaire', nameEn: 'Solar Lighting' },
      { name: 'Spots & Projecteurs', nameEn: 'Spotlights & Floodlights' },
      { name: 'Guirlandes lumineuses', nameEn: 'String Lights' },
      { name: 'Eclairage industriel', nameEn: 'Industrial Lighting' },
    ],
  },
  // 23
  {
    name: 'Electromenager', nameEn: 'Home Appliances', slug: 'electromenager', icon: 'kitchen', featured: true,
    children: [
      { name: 'Climatiseurs & Ventilateurs', nameEn: 'Air Conditioners & Fans' },
      { name: 'Refrigerateurs & Congelateurs', nameEn: 'Refrigerators & Freezers' },
      { name: 'Machines a laver', nameEn: 'Washing Machines' },
      { name: 'Cuisinieres & Fours', nameEn: 'Stoves & Ovens' },
      { name: 'Micro-ondes', nameEn: 'Microwaves' },
      { name: 'Mixeurs & Blenders', nameEn: 'Mixers & Blenders' },
      { name: 'Fers a repasser', nameEn: 'Irons' },
      { name: 'Aspirateurs', nameEn: 'Vacuum Cleaners' },
      { name: 'Purificateurs d\'eau', nameEn: 'Water Purifiers' },
      { name: 'Chauffe-eau', nameEn: 'Water Heaters' },
    ],
  },
  // 24
  {
    name: 'Fournitures auto & Outils', nameEn: 'Automotive Supplies & Tools', slug: 'fournitures-auto-outils', icon: 'build',
    children: [
      { name: 'Outils de reparation', nameEn: 'Repair Tools' },
      { name: 'Huiles & Lubrifiants', nameEn: 'Oils & Lubricants' },
      { name: 'Batteries auto', nameEn: 'Car Batteries' },
      { name: 'Nettoyage & Entretien auto', nameEn: 'Car Cleaning & Care' },
      { name: 'GPS & Electronique auto', nameEn: 'GPS & Car Electronics' },
      { name: 'Alarmes & Securite auto', nameEn: 'Car Alarms & Security' },
      { name: 'Accessoires interieur auto', nameEn: 'Car Interior Accessories' },
      { name: 'Eclairage auto', nameEn: 'Car Lighting' },
    ],
  },
  // 25
  {
    name: 'Pieces & Accessoires vehicules', nameEn: 'Vehicle Parts & Accessories', slug: 'pieces-vehicules', icon: '🚗', featured: true,
    children: [
      { name: 'Pieces moteur', nameEn: 'Engine Parts' },
      { name: 'Systeme de freinage', nameEn: 'Brake System' },
      { name: 'Suspension & Direction', nameEn: 'Suspension & Steering' },
      { name: 'Pneus & Jantes', nameEn: 'Tires & Rims' },
      { name: 'Filtres', nameEn: 'Filters' },
      { name: 'Pieces carrosserie', nameEn: 'Body Parts' },
      { name: 'Systeme electrique auto', nameEn: 'Car Electrical System' },
      { name: 'Pieces moto', nameEn: 'Motorcycle Parts' },
      { name: 'Echappement', nameEn: 'Exhaust System' },
    ],
  },
  // 26
  {
    name: 'Outillage & Quincaillerie', nameEn: 'Tools & Hardware', slug: 'outillage-quincaillerie', icon: 'hardware',
    children: [
      { name: 'Outils a main', nameEn: 'Hand Tools' },
      { name: 'Outils electriques', nameEn: 'Power Tools' },
      { name: 'Perceuses & Visseuses', nameEn: 'Drills & Screwdrivers' },
      { name: 'Scies', nameEn: 'Saws' },
      { name: 'Outils de mesure', nameEn: 'Measuring Tools' },
      { name: 'Serrurerie', nameEn: 'Locksmithing' },
      { name: 'Fixation & Visserie', nameEn: 'Fasteners & Screws' },
      { name: 'Soudage', nameEn: 'Welding' },
    ],
  },
  // 27
  {
    name: 'Energie renouvelable', nameEn: 'Renewable Energy', slug: 'energie-renouvelable', icon: 'solar_power', featured: true,
    children: [
      { name: 'Panneaux solaires', nameEn: 'Solar Panels' },
      { name: 'Batteries solaires', nameEn: 'Solar Batteries' },
      { name: 'Onduleurs', nameEn: 'Inverters' },
      { name: 'Lampadaires solaires', nameEn: 'Solar Street Lights' },
      { name: 'Kits solaires complets', nameEn: 'Complete Solar Kits' },
      { name: 'Pompes solaires', nameEn: 'Solar Pumps' },
      { name: 'Regulateurs de charge', nameEn: 'Charge Controllers' },
      { name: 'Eoliennes', nameEn: 'Wind Turbines' },
    ],
  },
  // 28
  {
    name: 'Equipements electriques', nameEn: 'Electrical Equipment & Supplies', slug: 'equipements-electriques', icon: 'electrical_services',
    children: [
      { name: 'Cables & Fils electriques', nameEn: 'Electrical Cables & Wires' },
      { name: 'Disjoncteurs & Fusibles', nameEn: 'Circuit Breakers & Fuses' },
      { name: 'Prises & Interrupteurs', nameEn: 'Sockets & Switches' },
      { name: 'Transformateurs', nameEn: 'Transformers' },
      { name: 'Groupes electrogenes', nameEn: 'Power Generators' },
      { name: 'Stabilisateurs de tension', nameEn: 'Voltage Stabilizers' },
      { name: 'Tableaux electriques', nameEn: 'Electrical Panels' },
    ],
  },
  // 29
  {
    name: 'Securite & Protection', nameEn: 'Safety & Security', slug: 'securite-protection', icon: 'security',
    children: [
      { name: 'Cameras de surveillance', nameEn: 'Security Cameras' },
      { name: 'Alarmes', nameEn: 'Alarms' },
      { name: 'Controle d\'acces', nameEn: 'Access Control' },
      { name: 'Detecteurs & Capteurs', nameEn: 'Detectors & Sensors' },
      { name: 'Coffres-forts', nameEn: 'Safes' },
      { name: 'Equipements de protection individuelle', nameEn: 'Personal Protective Equipment' },
      { name: 'Extincteurs', nameEn: 'Fire Extinguishers' },
      { name: 'Serrures intelligentes', nameEn: 'Smart Locks' },
    ],
  },
  // 30
  {
    name: 'Manutention', nameEn: 'Material Handling', slug: 'manutention', icon: 'forklift',
    children: [
      { name: 'Chariots & Diables', nameEn: 'Trolleys & Hand Trucks' },
      { name: 'Palettes', nameEn: 'Pallets' },
      { name: 'Transpalettes', nameEn: 'Pallet Jacks' },
      { name: 'Etageres industrielles', nameEn: 'Industrial Shelving' },
      { name: 'Bacs & Conteneurs', nameEn: 'Bins & Containers' },
      { name: 'Sangles & Arrimage', nameEn: 'Straps & Tie-Downs' },
    ],
  },
  // 31
  {
    name: 'Instruments de test & Mesure', nameEn: 'Testing Instrument & Equipment', slug: 'instruments-test-mesure', icon: 'science',
    children: [
      { name: 'Multimetres', nameEn: 'Multimeters' },
      { name: 'Oscilloscopes', nameEn: 'Oscilloscopes' },
      { name: 'Balances de precision', nameEn: 'Precision Scales' },
      { name: 'Microscopes', nameEn: 'Microscopes' },
      { name: 'Testeurs de cables', nameEn: 'Cable Testers' },
      { name: 'Equipements de laboratoire', nameEn: 'Laboratory Equipment' },
    ],
  },
  // 32
  {
    name: 'Transmission de puissance', nameEn: 'Power Transmission', slug: 'transmission-puissance', icon: 'settings',
    children: [
      { name: 'Moteurs electriques', nameEn: 'Electric Motors' },
      { name: 'Roulements', nameEn: 'Bearings' },
      { name: 'Courroies & Poulies', nameEn: 'Belts & Pulleys' },
      { name: 'Engrenages', nameEn: 'Gears' },
      { name: 'Chaines industrielles', nameEn: 'Industrial Chains' },
      { name: 'Reducteurs', nameEn: 'Gearboxes' },
    ],
  },
  // 33
  {
    name: 'Composants electroniques', nameEn: 'Electronic Components', slug: 'composants-electroniques', icon: 'memory',
    children: [
      { name: 'Circuits integres', nameEn: 'Integrated Circuits' },
      { name: 'Resistances & Condensateurs', nameEn: 'Resistors & Capacitors' },
      { name: 'Connecteurs', nameEn: 'Connectors' },
      { name: 'Cartes electroniques', nameEn: 'Circuit Boards' },
      { name: 'Semiconducteurs', nameEn: 'Semiconductors' },
      { name: 'LED & Diodes', nameEn: 'LEDs & Diodes' },
      { name: 'Relais', nameEn: 'Relays' },
    ],
  },
  // 34
  {
    name: 'Vehicules & Transport', nameEn: 'Vehicles & Transportation', slug: 'vehicules-transport', icon: 'local_shipping',
    children: [
      { name: 'Motos & Scooters', nameEn: 'Motorcycles & Scooters' },
      { name: 'Tricycles & Quadricycles', nameEn: 'Tricycles & Quadricycles' },
      { name: 'Velos electriques', nameEn: 'Electric Bikes' },
      { name: 'Camions & Utilitaires', nameEn: 'Trucks & Utility Vehicles' },
      { name: 'Remorques', nameEn: 'Trailers' },
      { name: 'Trottinettes electriques', nameEn: 'Electric Scooters' },
      { name: 'Bateaux & Marine', nameEn: 'Boats & Marine' },
    ],
  },
  // 35
  {
    name: 'Agriculture, Alimentation & Boissons', nameEn: 'Agriculture, Food & Beverage', slug: 'agriculture-alimentation', icon: 'agriculture', featured: true,
    children: [
      { name: 'Cereales & Grains', nameEn: 'Cereals & Grains' },
      { name: 'Fruits & Legumes', nameEn: 'Fruits & Vegetables' },
      { name: 'Boissons', nameEn: 'Beverages' },
      { name: 'Huiles alimentaires', nameEn: 'Cooking Oils' },
      { name: 'Epices & Condiments', nameEn: 'Spices & Condiments' },
      { name: 'Conserves & Surgelés', nameEn: 'Canned & Frozen Food' },
      { name: 'Cacao & Cafe', nameEn: 'Cocoa & Coffee' },
      { name: 'Semences & Plants', nameEn: 'Seeds & Plants' },
      { name: 'Engrais & Pesticides', nameEn: 'Fertilizers & Pesticides' },
      { name: 'Materiel agricole', nameEn: 'Agricultural Equipment' },
    ],
  },
  // 36
  {
    name: 'Matieres premieres', nameEn: 'Raw Materials', slug: 'matieres-premieres', icon: 'category',
    children: [
      { name: 'Plastiques & Caoutchouc', nameEn: 'Plastics & Rubber' },
      { name: 'Metaux & Alliages', nameEn: 'Metals & Alloys' },
      { name: 'Produits chimiques', nameEn: 'Chemicals' },
      { name: 'Bois & Derives', nameEn: 'Wood & Wood Products' },
      { name: 'Mineraux & Minerais', nameEn: 'Minerals & Ores' },
      { name: 'Fibre & Textiles bruts', nameEn: 'Raw Fiber & Textiles' },
    ],
  },
  // 37
  {
    name: 'Services de fabrication', nameEn: 'Fabrication Services', slug: 'services-fabrication', icon: 'precision_manufacturing',
    children: [
      { name: 'Usinage CNC', nameEn: 'CNC Machining' },
      { name: 'Impression 3D', nameEn: '3D Printing' },
      { name: 'Moulage & Injection', nameEn: 'Molding & Injection' },
      { name: 'Soudage & Assemblage', nameEn: 'Welding & Assembly' },
      { name: 'Decoupe laser', nameEn: 'Laser Cutting' },
      { name: 'Traitement de surface', nameEn: 'Surface Treatment' },
    ],
  },
  // 38
  {
    name: 'Services', nameEn: 'Services', slug: 'services', icon: 'handshake',
    children: [
      { name: 'Inspection & Controle qualite', nameEn: 'Inspection & Quality Control' },
      { name: 'Logistique & Expedition', nameEn: 'Logistics & Shipping' },
      { name: 'Personnalisation & Design', nameEn: 'Customization & Design' },
      { name: 'Certification & Tests', nameEn: 'Certification & Testing' },
      { name: 'Assurance commerciale', nameEn: 'Trade Assurance' },
      { name: 'Formation & Conseil', nameEn: 'Training & Consulting' },
    ],
  },
];

async function main() {
  console.log('Seeding EstuaireAchats...');

  // ─── Seller Packages ───
  await prisma.sellerPackage.upsert({
    where: { id: 'pkg-free' },
    update: {},
    create: {
      id: 'pkg-free',
      name: 'Pack Gratuit',
      price: 0,
      productLimit: 10,
      duration: 365,
      isActive: true,
    },
  });

  const pkg = await prisma.sellerPackage.upsert({
    where: { id: 'pkg-basic' },
    update: {},
    create: {
      id: 'pkg-basic',
      name: 'Pack Starter',
      price: 5000,
      productLimit: 50,
      duration: 365,
      isActive: true,
    },
  });

  // ─── Admin ───
  const adminPassword = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@estuaireachats.com' },
    update: {},
    create: {
      email: 'admin@estuaireachats.com',
      firstName: 'Admin',
      lastName: 'EstuaireAchats',
      passwordHash: adminPassword,
      role: 'ADMIN',
      status: 'ACTIVE',
      emailVerified: true,
    },
  });

  // ─── Buyer ───
  const buyerPassword = await bcrypt.hash('buyer123', 12);
  const buyer = await prisma.user.upsert({
    where: { email: 'acheteur@estuaireachats.com' },
    update: {},
    create: {
      email: 'acheteur@estuaireachats.com',
      firstName: 'Paul',
      lastName: 'Mbarga',
      phone: '+237690123456',
      passwordHash: buyerPassword,
      role: 'BUYER',
      status: 'ACTIVE',
      emailVerified: true,
    },
  });

  // ─── Address for buyer ───
  await prisma.address.upsert({
    where: { id: 'addr-buyer-1' },
    update: {},
    create: {
      id: 'addr-buyer-1',
      userId: buyer.id,
      fullName: 'Paul Mbarga',
      phone: '+237690123456',
      address: 'Rue 1234, Quartier Bonapriso',
      city: 'Douala',
      region: 'Littoral',
      isDefault: true,
    },
  });

  // ─── Categories (38 categories Alibaba + sous-categories + traductions FR/EN) ───
  console.log('\nCreation des categories...');

  const categoryMap: Record<string, string> = {};
  const subCategoryMap: Record<string, string> = {};

  for (let ci = 0; ci < categoriesData.length; ci++) {
    const cat = categoriesData[ci];

    const parent = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name, icon: cat.icon, featured: cat.featured ?? false, order: ci },
      create: {
        name: cat.name,
        slug: cat.slug,
        icon: cat.icon,
        featured: cat.featured ?? false,
        isActive: true,
        order: ci,
      },
    });
    categoryMap[cat.slug] = parent.id;

    // Traductions de la categorie parent
    await prisma.categoryTranslation.upsert({
      where: { categoryId_lang: { categoryId: parent.id, lang: 'fr' } },
      update: { name: cat.name },
      create: { categoryId: parent.id, lang: 'fr', name: cat.name },
    });
    await prisma.categoryTranslation.upsert({
      where: { categoryId_lang: { categoryId: parent.id, lang: 'en' } },
      update: { name: cat.nameEn },
      create: { categoryId: parent.id, lang: 'en', name: cat.nameEn },
    });

    for (let i = 0; i < cat.children.length; i++) {
      const child = cat.children[i];
      const childSlug = `${cat.slug}-${child.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/-$/, '')}`;

      const sub = await prisma.category.upsert({
        where: { slug: childSlug },
        update: { name: child.name },
        create: {
          name: child.name,
          slug: childSlug,
          parentId: parent.id,
          order: i,
          isActive: true,
        },
      });
      subCategoryMap[childSlug] = sub.id;

      // Traductions sous-categorie
      await prisma.categoryTranslation.upsert({
        where: { categoryId_lang: { categoryId: sub.id, lang: 'fr' } },
        update: { name: child.name },
        create: { categoryId: sub.id, lang: 'fr', name: child.name },
      });
      await prisma.categoryTranslation.upsert({
        where: { categoryId_lang: { categoryId: sub.id, lang: 'en' } },
        update: { name: child.nameEn },
        create: { categoryId: sub.id, lang: 'en', name: child.nameEn },
      });
    }

    console.log(`  [OK] ${cat.name} (${cat.children.length} sous-categories)`);
  }

  console.log(`\nTotal: ${categoriesData.length} categories principales, ${categoriesData.reduce((a, c) => a + c.children.length, 0)} sous-categories`);

  // ─── Sellers + Shops ───
  const sellersData = [
    {
      email: 'vendeur@estuaireachats.com', firstName: 'Jean', lastName: 'Nkoulou',
      shopName: 'TechStore Douala', shopSlug: 'techstore-douala',
      description: 'Specialiste en electronique et gadgets high-tech au Cameroun.',
      city: 'Douala', country: 'CM', verified: true, yearsActive: 5, rating: 4.8,
      staffCount: '15+ employes', factoryArea: '500+ m2', annualRevenue: '50M+ FCFA',
      capabilities: ['Livraison rapide', 'SAV 12 mois', 'Produits certifies'],
    },
    {
      email: 'afrikamode@estuaireachats.com', firstName: 'Marie', lastName: 'Fotso',
      shopName: 'AfrikaMode', shopSlug: 'afrikamode',
      description: 'Creations africaines modernes : pagne wax, bogolan, tissus.',
      city: 'Yaounde', country: 'CM', verified: true, yearsActive: 8, rating: 4.7,
      staffCount: '30+ employes', factoryArea: '800+ m2', annualRevenue: '80M+ FCFA',
      capabilities: ['Personnalisation sur mesure', 'Production locale', 'Export Afrique'],
    },
    {
      email: 'homeplus@estuaireachats.com', firstName: 'Pierre', lastName: 'Tchoumba',
      shopName: 'HomePlus Cameroun', shopSlug: 'homeplus-cameroun',
      description: 'Tout pour votre maison : meubles, deco, electromenager.',
      city: 'Douala', country: 'CM', verified: true, yearsActive: 3, rating: 4.5,
      staffCount: '20+ employes', factoryArea: '2000+ m2', annualRevenue: '120M+ FCFA',
      capabilities: ['Livraison et montage', 'Garantie 2 ans', 'Service apres-vente'],
    },
    {
      email: 'beautyqueen@estuaireachats.com', firstName: 'Aissatou', lastName: 'Bello',
      shopName: 'Beauty Queen CM', shopSlug: 'beauty-queen-cm',
      description: 'Cosmetiques, soins naturels et produits de beaute africains.',
      city: 'Douala', country: 'CM', verified: true, yearsActive: 4, rating: 4.9,
      staffCount: '10+ employes', factoryArea: '200+ m2', annualRevenue: '25M+ FCFA',
      capabilities: ['Produits bio', 'Ingredients naturels', 'Fabrication locale'],
    },
    {
      email: 'autoparts@estuaireachats.com', firstName: 'Emmanuel', lastName: 'Nguema',
      shopName: 'AutoParts Express', shopSlug: 'autoparts-express',
      description: 'Pieces detachees automobiles neuves et d\'occasion. Import Chine et Europe.',
      city: 'Douala', country: 'CM', verified: true, yearsActive: 12, rating: 4.6,
      staffCount: '40+ employes', factoryArea: '3000+ m2', annualRevenue: '200M+ FCFA',
      capabilities: ['Import direct usine', 'Stock permanent', 'Livraison nationale'],
    },
    {
      email: 'sportcm@estuaireachats.com', firstName: 'Samuel', lastName: 'Eto\'o',
      shopName: 'Sport CM Pro', shopSlug: 'sport-cm-pro',
      description: 'Equipements sportifs, fitness et loisirs pour tous.',
      city: 'Yaounde', country: 'CM', verified: false, yearsActive: 2, rating: 4.3,
      staffCount: '8+ employes', factoryArea: '300+ m2', annualRevenue: '15M+ FCFA',
      capabilities: ['Equipement pro', 'Conseils personnalises'],
    },
    {
      email: 'solaire@estuaireachats.com', firstName: 'David', lastName: 'Kamga',
      shopName: 'SolairePlus Cameroun', shopSlug: 'solaireplus-cameroun',
      description: 'Solutions d\'energie solaire pour particuliers et entreprises au Cameroun.',
      city: 'Douala', country: 'CM', verified: true, yearsActive: 6, rating: 4.7,
      staffCount: '25+ employes', factoryArea: '1500+ m2', annualRevenue: '150M+ FCFA',
      capabilities: ['Installation complete', 'Garantie 5 ans', 'Maintenance incluse'],
    },
    {
      email: 'agrifood@estuaireachats.com', firstName: 'Claudine', lastName: 'Mbah',
      shopName: 'AgriFood Cameroun', shopSlug: 'agrifood-cameroun',
      description: 'Produits agricoles frais et transformes du Cameroun. Export cacao, cafe, poivre.',
      city: 'Bafoussam', country: 'CM', verified: true, yearsActive: 10, rating: 4.8,
      staffCount: '50+ employes', factoryArea: '5000+ m2', annualRevenue: '300M+ FCFA',
      capabilities: ['Certification bio', 'Export international', 'Tracabilite complete'],
    },
  ];

  const shopMap: Record<string, string> = {};
  const password = await bcrypt.hash('seller123', 12);

  for (const s of sellersData) {
    const user = await prisma.user.upsert({
      where: { email: s.email },
      update: {},
      create: {
        email: s.email,
        firstName: s.firstName,
        lastName: s.lastName,
        passwordHash: password,
        role: 'SELLER',
        status: 'ACTIVE',
        emailVerified: true,
      },
    });

    const shop = await prisma.shop.upsert({
      where: { userId: user.id },
      update: {
        name: s.shopName,
        slug: s.shopSlug,
        description: s.description,
        city: s.city,
        country: s.country,
        verified: s.verified,
        yearsActive: s.yearsActive,
        rating: s.rating,
        totalReviews: Math.floor(Math.random() * 200) + 10,
        staffCount: s.staffCount,
        factoryArea: s.factoryArea,
        annualRevenue: s.annualRevenue,
        capabilities: s.capabilities,
        sellerPackageId: pkg.id,
        status: 'ACTIVE',
      },
      create: {
        userId: user.id,
        name: s.shopName,
        slug: s.shopSlug,
        description: s.description,
        city: s.city,
        country: s.country,
        verified: s.verified,
        yearsActive: s.yearsActive,
        rating: s.rating,
        totalReviews: Math.floor(Math.random() * 200) + 10,
        staffCount: s.staffCount,
        factoryArea: s.factoryArea,
        annualRevenue: s.annualRevenue,
        capabilities: s.capabilities,
        sellerPackageId: pkg.id,
        status: 'ACTIVE',
      },
    });
    shopMap[s.shopSlug] = shop.id;
  }

  // ─── Products ───
  const productsData = [
    // TechStore Douala - Electronique grand public
    { shop: 'techstore-douala', cat: 'electronique-grand-public', name: 'Samsung Galaxy A54 256GB Smartphone Android', price: 135000, moq: 1, origin: 'CN', sold: 245, rating: 4.6, reviews: 89, imgs: 'electronique' },
    { shop: 'techstore-douala', cat: 'electronique-grand-public', name: 'Ecouteurs Bluetooth TWS Casque Sans Fil', price: 8500, moq: 10, origin: 'CN', sold: 1200, rating: 4.4, reviews: 234, imgs: 'electronique' },
    { shop: 'techstore-douala', cat: 'electronique-grand-public', name: 'Chargeur Solaire Portable 20000mAh Power Bank', price: 15000, moq: 5, origin: 'CN', sold: 380, rating: 4.5, reviews: 67, imgs: 'electronique' },
    { shop: 'techstore-douala', cat: 'electronique-grand-public', name: 'Camera de Surveillance WiFi HD 1080P', price: 25000, moq: 1, origin: 'CN', sold: 156, rating: 4.3, reviews: 45, imgs: 'electronique' },
    { shop: 'techstore-douala', cat: 'electronique-grand-public', name: 'Tablette Android 10 pouces 64GB', price: 65000, moq: 1, origin: 'CN', sold: 89, rating: 4.2, reviews: 32, imgs: 'electronique' },
    // AfrikaMode - Vetements
    { shop: 'afrikamode', cat: 'vetements-accessoires', name: 'Robe Africaine Wax Femme Pagne Traditionnelle', price: 18000, moq: 5, origin: 'CM', sold: 890, rating: 4.7, reviews: 167, imgs: 'mode' },
    { shop: 'afrikamode', cat: 'vetements-accessoires', name: 'Chemise Homme Bogolan Tissu Africain', price: 12000, moq: 10, origin: 'CM', sold: 560, rating: 4.5, reviews: 98, imgs: 'mode' },
    { shop: 'afrikamode', cat: 'vetements-accessoires', name: 'Sac a Main Femme Cuir Africain Artisanal', price: 22000, moq: 3, origin: 'CM', sold: 340, rating: 4.8, reviews: 78, imgs: 'mode' },
    { shop: 'afrikamode', cat: 'vetements-accessoires', name: 'Ensemble Enfant Wax Coton Premium', price: 8000, moq: 10, origin: 'CM', sold: 420, rating: 4.6, reviews: 56, imgs: 'mode' },
    // HomePlus - Maison & Jardin + Electromenager
    { shop: 'homeplus-cameroun', cat: 'maison-jardin', name: 'Ventilateur Plafond LED Telecommande Silencieux', price: 45000, moq: 1, origin: 'CN', sold: 230, rating: 4.4, reviews: 67, imgs: 'maison' },
    { shop: 'homeplus-cameroun', cat: 'maison-jardin', name: 'Canape 3 Places Tissu Moderne', price: 185000, moq: 1, origin: 'CM', sold: 45, rating: 4.7, reviews: 23, imgs: 'maison' },
    { shop: 'homeplus-cameroun', cat: 'eclairage', name: 'Lampe Solaire Jardin LED Exterieur Pack de 4', price: 12000, moq: 5, origin: 'CN', sold: 670, rating: 4.3, reviews: 123, imgs: 'maison' },
    { shop: 'homeplus-cameroun', cat: 'electromenager', name: 'Cuisiniere a Gaz 4 Feux avec Four', price: 95000, moq: 1, origin: 'CN', sold: 78, rating: 4.5, reviews: 34, imgs: 'maison' },
    { shop: 'homeplus-cameroun', cat: 'electromenager', name: 'Climatiseur Split 12000 BTU Inverter', price: 250000, moq: 1, origin: 'CN', sold: 120, rating: 4.6, reviews: 56, imgs: 'maison' },
    // Beauty Queen - Beaute
    { shop: 'beauty-queen-cm', cat: 'beaute-soins', name: 'Creme Eclaircissante Naturelle Karite Bio', price: 5500, moq: 12, origin: 'CM', sold: 2300, rating: 4.8, reviews: 345, imgs: 'beaute' },
    { shop: 'beauty-queen-cm', cat: 'beaute-soins', name: 'Huile de Coco Vierge Pressee a Froid 500ml', price: 3500, moq: 20, origin: 'CM', sold: 1800, rating: 4.9, reviews: 267, imgs: 'beaute' },
    { shop: 'beauty-queen-cm', cat: 'beaute-soins', name: 'Kit Maquillage Complet 24 Pieces Professionnel', price: 28000, moq: 1, origin: 'CN', sold: 156, rating: 4.4, reviews: 56, imgs: 'beaute' },
    { shop: 'beauty-queen-cm', cat: 'beaute-soins', name: 'Perruque Bresilienne Lace Front Naturelle', price: 45000, moq: 1, origin: 'CN', sold: 890, rating: 4.7, reviews: 178, imgs: 'beaute' },
    // AutoParts Express - Pieces vehicules
    { shop: 'autoparts-express', cat: 'pieces-vehicules', name: 'Batterie Auto 12V 75Ah Demarrage Rapide', price: 45000, moq: 1, origin: 'CN', sold: 890, rating: 4.6, reviews: 145, imgs: 'auto' },
    { shop: 'autoparts-express', cat: 'pieces-vehicules', name: 'Pneu 205/55 R16 Toutes Saisons', price: 35000, moq: 4, origin: 'CN', sold: 1200, rating: 4.5, reviews: 189, imgs: 'auto' },
    { shop: 'autoparts-express', cat: 'fournitures-auto-outils', name: 'Kit Ampoules LED H7 Phares Voiture 6000K', price: 8000, moq: 10, origin: 'CN', sold: 2100, rating: 4.3, reviews: 312, imgs: 'auto' },
    { shop: 'autoparts-express', cat: 'fournitures-auto-outils', name: 'Huile Moteur 5W-30 Synthetique 5L', price: 18000, moq: 1, origin: 'FR', sold: 670, rating: 4.7, reviews: 98, imgs: 'auto' },
    // Sport CM Pro
    { shop: 'sport-cm-pro', cat: 'sports-divertissements', name: 'Ballon de Football Taille 5 Match Officiel', price: 8000, moq: 10, origin: 'CN', sold: 560, rating: 4.4, reviews: 78, imgs: 'sport' },
    { shop: 'sport-cm-pro', cat: 'sports-divertissements', name: 'Tapis de Yoga Antiderapant 6mm', price: 6000, moq: 5, origin: 'CN', sold: 340, rating: 4.5, reviews: 56, imgs: 'sport' },
    { shop: 'sport-cm-pro', cat: 'sports-divertissements', name: 'Halteres Reglables 20kg Paire Musculation', price: 35000, moq: 1, origin: 'CN', sold: 120, rating: 4.6, reviews: 34, imgs: 'sport' },
    { shop: 'sport-cm-pro', cat: 'vetements-sport-plein-air', name: 'Chaussures Sport Homme Running Respirantes', price: 22000, moq: 2, origin: 'CN', sold: 780, rating: 4.3, reviews: 145, imgs: 'sport' },
    // SolairePlus Cameroun - Energie renouvelable
    { shop: 'solaireplus-cameroun', cat: 'energie-renouvelable', name: 'Kit Solaire Complet 3kW Maison Autonome', price: 850000, moq: 1, origin: 'CN', sold: 67, rating: 4.8, reviews: 23, imgs: 'materiel' },
    { shop: 'solaireplus-cameroun', cat: 'energie-renouvelable', name: 'Panneau Solaire Monocristallin 400W', price: 120000, moq: 1, origin: 'CN', sold: 340, rating: 4.7, reviews: 89, imgs: 'materiel' },
    { shop: 'solaireplus-cameroun', cat: 'energie-renouvelable', name: 'Batterie Lithium LiFePO4 12V 200Ah', price: 350000, moq: 1, origin: 'CN', sold: 156, rating: 4.6, reviews: 45, imgs: 'materiel' },
    { shop: 'solaireplus-cameroun', cat: 'energie-renouvelable', name: 'Lampadaire Solaire LED 100W Rue Exterieur', price: 85000, moq: 2, origin: 'CN', sold: 230, rating: 4.5, reviews: 67, imgs: 'materiel' },
    { shop: 'solaireplus-cameroun', cat: 'eclairage', name: 'Projecteur Solaire LED 200W avec Detecteur', price: 35000, moq: 5, origin: 'CN', sold: 450, rating: 4.4, reviews: 112, imgs: 'materiel' },
    // AgriFoodCameroun - Agriculture
    { shop: 'agrifood-cameroun', cat: 'agriculture-alimentation', name: 'Cacao en Feves Premium Grade A 50kg', price: 175000, moq: 1, origin: 'CM', sold: 560, rating: 4.9, reviews: 89, imgs: 'alimentaire' },
    { shop: 'agrifood-cameroun', cat: 'agriculture-alimentation', name: 'Cafe Arabica Torrefie Cameroun 25kg', price: 95000, moq: 1, origin: 'CM', sold: 340, rating: 4.8, reviews: 67, imgs: 'alimentaire' },
    { shop: 'agrifood-cameroun', cat: 'agriculture-alimentation', name: 'Poivre Blanc de Penja 5kg AOC', price: 85000, moq: 1, origin: 'CM', sold: 890, rating: 4.9, reviews: 234, imgs: 'alimentaire' },
    { shop: 'agrifood-cameroun', cat: 'agriculture-alimentation', name: 'Huile de Palme Rouge Artisanale 20L', price: 25000, moq: 5, origin: 'CM', sold: 1200, rating: 4.6, reviews: 178, imgs: 'alimentaire' },
    { shop: 'agrifood-cameroun', cat: 'agriculture-alimentation', name: 'Miel Naturel Oku 10kg', price: 45000, moq: 2, origin: 'CM', sold: 670, rating: 4.8, reviews: 145, imgs: 'alimentaire' },
  ];

  for (const p of productsData) {
    const slug = p.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/-$/, '').substring(0, 80);
    const shopId = shopMap[p.shop];
    const categoryId = categoryMap[p.cat];
    if (!shopId) continue;

    const existing = await prisma.product.findFirst({ where: { slug } });
    if (existing) {
      console.log(`  -> Produit existant: ${p.name}`);
      continue;
    }

    const product = await prisma.product.create({
      data: {
        shopId,
        categoryId,
        name: p.name,
        slug,
        description: `${p.name}. Produit de qualite superieure disponible sur EstuaireAchats. Livraison rapide au Cameroun.`,
        price: p.price,
        minOrderQty: p.moq,
        origin: p.origin,
        totalSold: p.sold,
        rating: p.rating,
        totalReviews: p.reviews,
        isFeatured: p.sold > 500,
        isPublished: true,
        isApproved: true,
        status: 'ACTIVE',
        unit: 'piece',
      },
    });

    // Add images
    const imgs = productImages[p.imgs] || productImages.electronique;
    for (let i = 0; i < imgs.length; i++) {
      await prisma.productImage.create({
        data: {
          productId: product.id,
          url: imgs[i],
          isMain: i === 0,
          order: i,
        },
      });
    }

    console.log(`  [OK] ${p.name} (${p.price} FCFA)`);
  }

  console.log('\n--- Identifiants ---');
  console.log('Admin:    admin@estuaireachats.com / admin123');
  console.log('Acheteur: acheteur@estuaireachats.com / buyer123');
  console.log('Vendeurs: vendeur@estuaireachats.com / seller123');
  console.log('          afrikamode@estuaireachats.com / seller123');
  console.log('          homeplus@estuaireachats.com / seller123');
  console.log('          beautyqueen@estuaireachats.com / seller123');
  console.log('          autoparts@estuaireachats.com / seller123');
  console.log('          sportcm@estuaireachats.com / seller123');
  console.log('          solaire@estuaireachats.com / seller123');
  console.log('          agrifood@estuaireachats.com / seller123');
  console.log('\nSeed termine!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
