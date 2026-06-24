import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Images par theme
const imgs: Record<string, string[]> = {
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
  bijoux: [
    'https://images.unsplash.com/photo-1515562141589-67f0d999b36b?w=600',
    'https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=600',
    'https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=600',
  ],
  chaussures: [
    'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600',
    'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=600',
    'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=600',
  ],
  bebe: [
    'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=600',
    'https://images.unsplash.com/photo-1566004100477-7b3ae26b1a6e?w=600',
    'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=600',
  ],
  sac: [
    'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600',
    'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600',
    'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=600',
  ],
  bureau: [
    'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=600',
    'https://images.unsplash.com/photo-1456735190827-d1262f71b8a3?w=600',
    'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=600',
  ],
  construction: [
    'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600',
    'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=600',
    'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=600',
  ],
  securite: [
    'https://images.unsplash.com/photo-1558002038-1055907df827?w=600',
    'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=600',
    'https://images.unsplash.com/photo-1557597774-9d273605dfa9?w=600',
  ],
  meuble: [
    'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600',
    'https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=600',
    'https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=600',
  ],
  sante: [
    'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600',
    'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=600',
    'https://images.unsplash.com/photo-1585435557343-3b092031a831?w=600',
  ],
};

// Produits supplementaires par boutique et categorie
const moreProducts = [
  // ===================== TECHSTORE DOUALA =====================
  // Smartphones & Telephones
  { shop: 'techstore-douala', cat: 'electronique-grand-public', name: 'iPhone 15 Pro Max 256GB Neuf Sous Blister', price: 850000, moq: 1, origin: 'US', sold: 45, rating: 4.9, reviews: 12, img: 'electronique' },
  { shop: 'techstore-douala', cat: 'electronique-grand-public', name: 'Xiaomi Redmi Note 13 Pro 128GB', price: 95000, moq: 1, origin: 'CN', sold: 380, rating: 4.5, reviews: 78, img: 'electronique' },
  { shop: 'techstore-douala', cat: 'electronique-grand-public', name: 'TECNO Camon 20 Premier 256GB', price: 165000, moq: 1, origin: 'CN', sold: 210, rating: 4.4, reviews: 56, img: 'electronique' },
  { shop: 'techstore-douala', cat: 'electronique-grand-public', name: 'Samsung Galaxy S24 Ultra 512GB', price: 750000, moq: 1, origin: 'KR', sold: 23, rating: 4.9, reviews: 8, img: 'electronique' },
  { shop: 'techstore-douala', cat: 'electronique-grand-public', name: 'Infinix Hot 40 Pro 128GB', price: 72000, moq: 1, origin: 'CN', sold: 560, rating: 4.3, reviews: 134, img: 'electronique' },
  { shop: 'techstore-douala', cat: 'electronique-grand-public', name: 'Ordinateur Portable HP 15 Intel i5 8Go RAM 256SSD', price: 285000, moq: 1, origin: 'CN', sold: 89, rating: 4.6, reviews: 34, img: 'electronique' },
  { shop: 'techstore-douala', cat: 'electronique-grand-public', name: 'MacBook Air M2 256GB Gris Sideral', price: 680000, moq: 1, origin: 'US', sold: 15, rating: 4.9, reviews: 5, img: 'electronique' },
  { shop: 'techstore-douala', cat: 'electronique-grand-public', name: 'Lenovo IdeaPad 3 AMD Ryzen 5 512SSD', price: 320000, moq: 1, origin: 'CN', sold: 67, rating: 4.5, reviews: 23, img: 'electronique' },
  { shop: 'techstore-douala', cat: 'electronique-grand-public', name: 'Montre Connectee Smart Watch Fitness Tracker', price: 15000, moq: 5, origin: 'CN', sold: 890, rating: 4.2, reviews: 167, img: 'electronique' },
  { shop: 'techstore-douala', cat: 'electronique-grand-public', name: 'Apple Watch Series 9 45mm GPS', price: 280000, moq: 1, origin: 'US', sold: 34, rating: 4.8, reviews: 12, img: 'electronique' },
  { shop: 'techstore-douala', cat: 'electronique-grand-public', name: 'Enceinte Bluetooth JBL Charge 5 Etanche', price: 85000, moq: 1, origin: 'CN', sold: 234, rating: 4.7, reviews: 89, img: 'electronique' },
  { shop: 'techstore-douala', cat: 'electronique-grand-public', name: 'AirPods Pro 2eme Generation USB-C', price: 150000, moq: 1, origin: 'US', sold: 120, rating: 4.8, reviews: 45, img: 'electronique' },
  { shop: 'techstore-douala', cat: 'electronique-grand-public', name: 'Cle USB 3.0 128GB Kingston DataTraveler', price: 8500, moq: 10, origin: 'CN', sold: 2300, rating: 4.4, reviews: 345, img: 'electronique' },
  { shop: 'techstore-douala', cat: 'electronique-grand-public', name: 'Disque Dur Externe 1TB USB 3.0 Seagate', price: 35000, moq: 1, origin: 'CN', sold: 450, rating: 4.5, reviews: 89, img: 'electronique' },
  { shop: 'techstore-douala', cat: 'electronique-grand-public', name: 'Imprimante Multifonction HP DeskJet WiFi', price: 65000, moq: 1, origin: 'CN', sold: 120, rating: 4.3, reviews: 45, img: 'electronique' },
  { shop: 'techstore-douala', cat: 'electronique-grand-public', name: 'Clavier Mecanique Gaming RGB USB', price: 25000, moq: 2, origin: 'CN', sold: 340, rating: 4.4, reviews: 67, img: 'electronique' },
  { shop: 'techstore-douala', cat: 'electronique-grand-public', name: 'Souris Sans Fil Ergonomique Rechargeable', price: 8000, moq: 5, origin: 'CN', sold: 780, rating: 4.3, reviews: 123, img: 'electronique' },
  { shop: 'techstore-douala', cat: 'electronique-grand-public', name: 'Webcam Full HD 1080P Microphone Integre', price: 18000, moq: 2, origin: 'CN', sold: 290, rating: 4.4, reviews: 56, img: 'electronique' },
  { shop: 'techstore-douala', cat: 'electronique-grand-public', name: 'Routeur WiFi 6 Dual Band 3000Mbps', price: 45000, moq: 1, origin: 'CN', sold: 180, rating: 4.6, reviews: 45, img: 'electronique' },
  { shop: 'techstore-douala', cat: 'electronique-grand-public', name: 'TV Smart LED 43 Pouces 4K Android TV', price: 195000, moq: 1, origin: 'CN', sold: 67, rating: 4.5, reviews: 23, img: 'electronique' },
  { shop: 'techstore-douala', cat: 'electronique-grand-public', name: 'TV Smart LED 55 Pouces 4K UHD HDR', price: 285000, moq: 1, origin: 'CN', sold: 45, rating: 4.6, reviews: 18, img: 'electronique' },
  { shop: 'techstore-douala', cat: 'electronique-grand-public', name: 'Projecteur LED Full HD 1080P Home Cinema', price: 125000, moq: 1, origin: 'CN', sold: 89, rating: 4.3, reviews: 34, img: 'electronique' },
  { shop: 'techstore-douala', cat: 'electronique-grand-public', name: 'Console de Jeux PS5 Controller DualSense', price: 35000, moq: 1, origin: 'JP', sold: 230, rating: 4.7, reviews: 67, img: 'electronique' },
  { shop: 'techstore-douala', cat: 'electronique-grand-public', name: 'Cable HDMI 2.1 4K 2 Metres Tresse', price: 3500, moq: 20, origin: 'CN', sold: 3400, rating: 4.3, reviews: 234, img: 'electronique' },
  { shop: 'techstore-douala', cat: 'electronique-grand-public', name: 'Batterie Externe 30000mAh Charge Rapide 65W', price: 25000, moq: 3, origin: 'CN', sold: 670, rating: 4.5, reviews: 123, img: 'electronique' },

  // ===================== AFRIKAMODE =====================
  { shop: 'afrikamode', cat: 'vetements-accessoires', name: 'Boubou Grand Modele Homme Broderie Or', price: 35000, moq: 3, origin: 'CM', sold: 450, rating: 4.8, reviews: 89, img: 'mode' },
  { shop: 'afrikamode', cat: 'vetements-accessoires', name: 'Robe de Soiree Wax Longue Fendue', price: 28000, moq: 5, origin: 'CM', sold: 670, rating: 4.7, reviews: 134, img: 'mode' },
  { shop: 'afrikamode', cat: 'vetements-accessoires', name: 'Costume Homme Pagne Africain 3 Pieces', price: 45000, moq: 2, origin: 'CM', sold: 230, rating: 4.9, reviews: 56, img: 'mode' },
  { shop: 'afrikamode', cat: 'vetements-accessoires', name: 'Jupe Crayon Wax Taille Haute Bureau', price: 12000, moq: 10, origin: 'CM', sold: 890, rating: 4.5, reviews: 178, img: 'mode' },
  { shop: 'afrikamode', cat: 'vetements-accessoires', name: 'Tissu Wax Hollandais 6 Yards Premium', price: 15000, moq: 10, origin: 'NL', sold: 2300, rating: 4.8, reviews: 456, img: 'mode' },
  { shop: 'afrikamode', cat: 'vetements-accessoires', name: 'Bazin Riche Brocart Allemand 10 Yards', price: 35000, moq: 5, origin: 'DE', sold: 1200, rating: 4.7, reviews: 234, img: 'mode' },
  { shop: 'afrikamode', cat: 'vetements-accessoires', name: 'Dashiki Homme Manches Courtes Colore', price: 8000, moq: 10, origin: 'CM', sold: 1500, rating: 4.4, reviews: 289, img: 'mode' },
  { shop: 'afrikamode', cat: 'vetements-accessoires', name: 'Ensemble Tailleur Femme Wax Moderne', price: 32000, moq: 3, origin: 'CM', sold: 340, rating: 4.6, reviews: 67, img: 'mode' },
  { shop: 'afrikamode', cat: 'vetements-accessoires', name: 'Chapeau Panama Homme Paille Naturelle', price: 8500, moq: 10, origin: 'CM', sold: 450, rating: 4.3, reviews: 78, img: 'mode' },
  { shop: 'afrikamode', cat: 'vetements-accessoires', name: 'Foulard Soie Imprime Africain Femme', price: 6500, moq: 12, origin: 'CM', sold: 780, rating: 4.5, reviews: 145, img: 'mode' },
  { shop: 'afrikamode', cat: 'vetements-accessoires', name: 'Ceinture Cuir Veritable Artisanale', price: 5000, moq: 10, origin: 'CM', sold: 670, rating: 4.4, reviews: 112, img: 'mode' },
  { shop: 'afrikamode', cat: 'vetements-accessoires', name: 'Sandales Femme Cuir Tresse Artisanales', price: 12000, moq: 5, origin: 'CM', sold: 560, rating: 4.6, reviews: 98, img: 'chaussures' },
  { shop: 'afrikamode', cat: 'vetements-accessoires', name: 'T-Shirt Homme Coton Bio Imprime Afrique', price: 5500, moq: 20, origin: 'CM', sold: 2100, rating: 4.3, reviews: 345, img: 'mode' },
  { shop: 'afrikamode', cat: 'vetements-accessoires', name: 'Combinaison Femme Wax Jumpsuit Chic', price: 22000, moq: 5, origin: 'CM', sold: 340, rating: 4.7, reviews: 67, img: 'mode' },
  { shop: 'afrikamode', cat: 'vetements-accessoires', name: 'Pantalon Cargo Homme Toile Robuste', price: 15000, moq: 5, origin: 'CN', sold: 890, rating: 4.4, reviews: 167, img: 'mode' },
  { shop: 'afrikamode', cat: 'vetements-accessoires', name: 'Polo Homme Coton Premium Col Classique', price: 8000, moq: 10, origin: 'CN', sold: 1200, rating: 4.3, reviews: 234, img: 'mode' },
  { shop: 'afrikamode', cat: 'vetements-accessoires', name: 'Robe Cocktail Femme Dentelle Elegante', price: 25000, moq: 3, origin: 'CM', sold: 290, rating: 4.8, reviews: 56, img: 'mode' },
  { shop: 'afrikamode', cat: 'vetements-accessoires', name: 'Veste Jean Homme Delavee Vintage', price: 18000, moq: 5, origin: 'CN', sold: 450, rating: 4.4, reviews: 89, img: 'mode' },
  { shop: 'afrikamode', cat: 'vetements-accessoires', name: 'Pyjama Femme Satin Ensemble 2 Pieces', price: 9000, moq: 10, origin: 'CN', sold: 670, rating: 4.5, reviews: 123, img: 'mode' },
  { shop: 'afrikamode', cat: 'vetements-accessoires', name: 'Short Homme Sport Coton Respirant', price: 5000, moq: 20, origin: 'CN', sold: 1500, rating: 4.2, reviews: 234, img: 'mode' },

  // ===================== HOMEPLUS CAMEROUN =====================
  { shop: 'homeplus-cameroun', cat: 'maison-jardin', name: 'Rideaux Occultants Thermiques 2 Panneaux', price: 18000, moq: 5, origin: 'CN', sold: 560, rating: 4.4, reviews: 98, img: 'maison' },
  { shop: 'homeplus-cameroun', cat: 'maison-jardin', name: 'Tapis Salon Moderne 160x230cm Geometrique', price: 35000, moq: 1, origin: 'CN', sold: 230, rating: 4.5, reviews: 67, img: 'maison' },
  { shop: 'homeplus-cameroun', cat: 'maison-jardin', name: 'Parure de Lit 4 Pieces Coton 220x240', price: 22000, moq: 3, origin: 'CN', sold: 890, rating: 4.6, reviews: 178, img: 'maison' },
  { shop: 'homeplus-cameroun', cat: 'maison-jardin', name: 'Miroir Mural Decoratif Cadre Dore 80cm', price: 25000, moq: 1, origin: 'CN', sold: 180, rating: 4.4, reviews: 45, img: 'maison' },
  { shop: 'homeplus-cameroun', cat: 'maison-jardin', name: 'Lot 6 Serviettes de Bain Coton Egyptien', price: 15000, moq: 5, origin: 'CN', sold: 670, rating: 4.5, reviews: 134, img: 'maison' },
  { shop: 'homeplus-cameroun', cat: 'electromenager', name: 'Refrigerateur Double Porte 350L No Frost', price: 350000, moq: 1, origin: 'CN', sold: 34, rating: 4.7, reviews: 12, img: 'maison' },
  { shop: 'homeplus-cameroun', cat: 'electromenager', name: 'Machine a Laver Automatique 8kg 1200tr', price: 220000, moq: 1, origin: 'CN', sold: 56, rating: 4.5, reviews: 23, img: 'maison' },
  { shop: 'homeplus-cameroun', cat: 'electromenager', name: 'Micro-Ondes Digital 25L avec Grill', price: 55000, moq: 1, origin: 'CN', sold: 120, rating: 4.4, reviews: 45, img: 'maison' },
  { shop: 'homeplus-cameroun', cat: 'electromenager', name: 'Mixeur Blender Professionnel 2L 1500W', price: 35000, moq: 2, origin: 'CN', sold: 450, rating: 4.6, reviews: 89, img: 'maison' },
  { shop: 'homeplus-cameroun', cat: 'electromenager', name: 'Fer a Repasser Vapeur 2400W Semelle Ceramique', price: 18000, moq: 3, origin: 'CN', sold: 780, rating: 4.3, reviews: 145, img: 'maison' },
  { shop: 'homeplus-cameroun', cat: 'electromenager', name: 'Robot Cuisine Multifonction 5L Petrin', price: 95000, moq: 1, origin: 'CN', sold: 89, rating: 4.7, reviews: 34, img: 'maison' },
  { shop: 'homeplus-cameroun', cat: 'electromenager', name: 'Aspirateur Sans Fil Cyclonique 250W', price: 85000, moq: 1, origin: 'CN', sold: 120, rating: 4.5, reviews: 45, img: 'maison' },
  { shop: 'homeplus-cameroun', cat: 'electromenager', name: 'Bouilloire Electrique Inox 1.7L 2200W', price: 12000, moq: 5, origin: 'CN', sold: 1200, rating: 4.4, reviews: 234, img: 'maison' },
  { shop: 'homeplus-cameroun', cat: 'electromenager', name: 'Friteuse Sans Huile Air Fryer 5.5L Digital', price: 45000, moq: 1, origin: 'CN', sold: 340, rating: 4.7, reviews: 78, img: 'maison' },
  { shop: 'homeplus-cameroun', cat: 'electromenager', name: 'Ventilateur Sur Pied 3 Vitesses Oscillant 16"', price: 18000, moq: 2, origin: 'CN', sold: 890, rating: 4.3, reviews: 167, img: 'maison' },
  { shop: 'homeplus-cameroun', cat: 'meubles', name: 'Table a Manger 6 Places Bois Massif', price: 150000, moq: 1, origin: 'CM', sold: 34, rating: 4.7, reviews: 12, img: 'meuble' },
  { shop: 'homeplus-cameroun', cat: 'meubles', name: 'Armoire 3 Portes Miroir Chambre', price: 185000, moq: 1, origin: 'CM', sold: 23, rating: 4.6, reviews: 8, img: 'meuble' },
  { shop: 'homeplus-cameroun', cat: 'meubles', name: 'Lit Double 160x200 Sommier Matelas Inclus', price: 250000, moq: 1, origin: 'CM', sold: 45, rating: 4.8, reviews: 15, img: 'meuble' },
  { shop: 'homeplus-cameroun', cat: 'meubles', name: 'Bureau Informatique Angle avec Etageres', price: 55000, moq: 1, origin: 'CN', sold: 120, rating: 4.4, reviews: 34, img: 'meuble' },
  { shop: 'homeplus-cameroun', cat: 'meubles', name: 'Meuble TV 160cm LED Design Moderne', price: 85000, moq: 1, origin: 'CN', sold: 89, rating: 4.5, reviews: 28, img: 'meuble' },
  { shop: 'homeplus-cameroun', cat: 'meubles', name: 'Etagere Murale Flottante Lot de 3', price: 15000, moq: 5, origin: 'CN', sold: 450, rating: 4.3, reviews: 89, img: 'meuble' },
  { shop: 'homeplus-cameroun', cat: 'eclairage', name: 'Lustre LED Moderne Salon 3 Anneaux Chrome', price: 75000, moq: 1, origin: 'CN', sold: 89, rating: 4.6, reviews: 23, img: 'maison' },
  { shop: 'homeplus-cameroun', cat: 'eclairage', name: 'Applique Murale LED Interieur Design', price: 12000, moq: 5, origin: 'CN', sold: 340, rating: 4.4, reviews: 67, img: 'maison' },
  { shop: 'homeplus-cameroun', cat: 'eclairage', name: 'Guirlande Lumineuse LED 10m Exterieur', price: 8000, moq: 10, origin: 'CN', sold: 890, rating: 4.3, reviews: 167, img: 'maison' },
  { shop: 'homeplus-cameroun', cat: 'eclairage', name: 'Plafonnier LED 36W Rond Dimmable', price: 22000, moq: 2, origin: 'CN', sold: 230, rating: 4.5, reviews: 56, img: 'maison' },

  // ===================== BEAUTY QUEEN CM =====================
  { shop: 'beauty-queen-cm', cat: 'beaute-soins', name: 'Savon Noir Africain Naturel Karite 200g', price: 2500, moq: 24, origin: 'CM', sold: 3400, rating: 4.7, reviews: 567, img: 'beaute' },
  { shop: 'beauty-queen-cm', cat: 'beaute-soins', name: 'Beurre de Karite Pur Non Raffine 500g', price: 4500, moq: 12, origin: 'CM', sold: 2800, rating: 4.9, reviews: 456, img: 'beaute' },
  { shop: 'beauty-queen-cm', cat: 'beaute-soins', name: 'Huile Essentielle Tea Tree 30ml Bio', price: 5000, moq: 12, origin: 'CM', sold: 1200, rating: 4.6, reviews: 234, img: 'beaute' },
  { shop: 'beauty-queen-cm', cat: 'beaute-soins', name: 'Serum Visage Vitamine C Anti-Age 30ml', price: 8500, moq: 6, origin: 'KR', sold: 890, rating: 4.7, reviews: 178, img: 'beaute' },
  { shop: 'beauty-queen-cm', cat: 'beaute-soins', name: 'Masque Capillaire Reparateur Keratine 500ml', price: 7500, moq: 6, origin: 'CM', sold: 670, rating: 4.5, reviews: 134, img: 'beaute' },
  { shop: 'beauty-queen-cm', cat: 'beaute-soins', name: 'Creme Hydratante Corps Aloe Vera 500ml', price: 4000, moq: 12, origin: 'CM', sold: 1500, rating: 4.6, reviews: 289, img: 'beaute' },
  { shop: 'beauty-queen-cm', cat: 'beaute-soins', name: 'Gel Douche Exfoliant Cafe Gommage 300ml', price: 3500, moq: 12, origin: 'CM', sold: 980, rating: 4.4, reviews: 178, img: 'beaute' },
  { shop: 'beauty-queen-cm', cat: 'beaute-soins', name: 'Parfum Femme Eau de Toilette 100ml Floral', price: 18000, moq: 3, origin: 'FR', sold: 340, rating: 4.7, reviews: 67, img: 'beaute' },
  { shop: 'beauty-queen-cm', cat: 'beaute-soins', name: 'Rouge a Levres Mat Longue Tenue Set de 6', price: 8000, moq: 6, origin: 'CN', sold: 1200, rating: 4.3, reviews: 234, img: 'beaute' },
  { shop: 'beauty-queen-cm', cat: 'beaute-soins', name: 'Fond de Teint Fluide Couvrant SPF30', price: 6500, moq: 6, origin: 'KR', sold: 560, rating: 4.5, reviews: 112, img: 'beaute' },
  { shop: 'beauty-queen-cm', cat: 'beaute-soins', name: 'Extensions Cheveux Naturels Bresiliens 20"', price: 35000, moq: 1, origin: 'BR', sold: 450, rating: 4.8, reviews: 89, img: 'beaute' },
  { shop: 'beauty-queen-cm', cat: 'beaute-soins', name: 'Lisseur Cheveux Ceramique Tourmaline Pro', price: 22000, moq: 1, origin: 'CN', sold: 340, rating: 4.4, reviews: 67, img: 'beaute' },
  { shop: 'beauty-queen-cm', cat: 'beaute-soins', name: 'Seche-Cheveux Professionnel 2200W Ionique', price: 25000, moq: 1, origin: 'CN', sold: 230, rating: 4.5, reviews: 56, img: 'beaute' },
  { shop: 'beauty-queen-cm', cat: 'beaute-soins', name: 'Tondeuse Cheveux Professionnelle Sans Fil', price: 18000, moq: 2, origin: 'CN', sold: 560, rating: 4.6, reviews: 112, img: 'beaute' },
  { shop: 'beauty-queen-cm', cat: 'beaute-soins', name: 'Palette Fards a Paupieres 35 Couleurs Pro', price: 12000, moq: 3, origin: 'CN', sold: 780, rating: 4.4, reviews: 156, img: 'beaute' },
  { shop: 'beauty-queen-cm', cat: 'beaute-soins', name: 'Cils Magnetiques Reutilisables 5 Paires', price: 5500, moq: 10, origin: 'CN', sold: 1200, rating: 4.3, reviews: 234, img: 'beaute' },
  { shop: 'beauty-queen-cm', cat: 'beaute-soins', name: 'Brosse Nettoyante Visage Silicone Electrique', price: 8500, moq: 5, origin: 'CN', sold: 450, rating: 4.5, reviews: 89, img: 'beaute' },
  { shop: 'beauty-queen-cm', cat: 'beaute-soins', name: 'Creme Solaire SPF50 Invisible 100ml', price: 6000, moq: 12, origin: 'FR', sold: 890, rating: 4.6, reviews: 178, img: 'beaute' },
  { shop: 'beauty-queen-cm', cat: 'beaute-soins', name: 'Deodorant Naturel Pierre Alun Spray 100ml', price: 3000, moq: 24, origin: 'CM', sold: 1500, rating: 4.4, reviews: 289, img: 'beaute' },
  { shop: 'beauty-queen-cm', cat: 'beaute-soins', name: 'Vernis a Ongles Gel Semi-Permanent Set 12', price: 12000, moq: 5, origin: 'CN', sold: 670, rating: 4.3, reviews: 134, img: 'beaute' },

  // ===================== AUTOPARTS EXPRESS =====================
  { shop: 'autoparts-express', cat: 'pieces-vehicules', name: 'Filtre a Huile Moteur Universel Toyota Nissan', price: 3500, moq: 20, origin: 'CN', sold: 4500, rating: 4.5, reviews: 678, img: 'auto' },
  { shop: 'autoparts-express', cat: 'pieces-vehicules', name: 'Plaquettes de Frein Avant Ceramique', price: 12000, moq: 5, origin: 'CN', sold: 2300, rating: 4.6, reviews: 345, img: 'auto' },
  { shop: 'autoparts-express', cat: 'pieces-vehicules', name: 'Amortisseur Avant Droit Toyota Corolla', price: 35000, moq: 1, origin: 'CN', sold: 560, rating: 4.4, reviews: 89, img: 'auto' },
  { shop: 'autoparts-express', cat: 'pieces-vehicules', name: 'Courroie de Distribution Kit Complet', price: 28000, moq: 1, origin: 'CN', sold: 340, rating: 4.5, reviews: 67, img: 'auto' },
  { shop: 'autoparts-express', cat: 'pieces-vehicules', name: 'Alternateur 12V 90A Reconditionne Certifie', price: 65000, moq: 1, origin: 'CN', sold: 120, rating: 4.3, reviews: 34, img: 'auto' },
  { shop: 'autoparts-express', cat: 'pieces-vehicules', name: 'Demarreur Moteur Diesel Universal', price: 55000, moq: 1, origin: 'CN', sold: 89, rating: 4.4, reviews: 28, img: 'auto' },
  { shop: 'autoparts-express', cat: 'pieces-vehicules', name: 'Radiateur Eau Aluminium Haute Performance', price: 45000, moq: 1, origin: 'CN', sold: 180, rating: 4.5, reviews: 56, img: 'auto' },
  { shop: 'autoparts-express', cat: 'pieces-vehicules', name: 'Embrayage Kit Complet 3 Pieces', price: 85000, moq: 1, origin: 'DE', sold: 67, rating: 4.7, reviews: 23, img: 'auto' },
  { shop: 'autoparts-express', cat: 'fournitures-auto-outils', name: 'Cric Hydraulique Bouteille 5 Tonnes', price: 15000, moq: 2, origin: 'CN', sold: 890, rating: 4.4, reviews: 167, img: 'auto' },
  { shop: 'autoparts-express', cat: 'fournitures-auto-outils', name: 'Compresseur Air Portatif 12V Gonfleur Pneu', price: 18000, moq: 2, origin: 'CN', sold: 1200, rating: 4.5, reviews: 234, img: 'auto' },
  { shop: 'autoparts-express', cat: 'fournitures-auto-outils', name: 'Caisse a Outils Complete 108 Pieces Chrome', price: 45000, moq: 1, origin: 'CN', sold: 340, rating: 4.6, reviews: 67, img: 'auto' },
  { shop: 'autoparts-express', cat: 'fournitures-auto-outils', name: 'Dashcam Camera Voiture Double Objectif', price: 25000, moq: 2, origin: 'CN', sold: 560, rating: 4.4, reviews: 112, img: 'auto' },
  { shop: 'autoparts-express', cat: 'fournitures-auto-outils', name: 'GPS Tracker Voiture Temps Reel 4G', price: 15000, moq: 3, origin: 'CN', sold: 450, rating: 4.3, reviews: 89, img: 'auto' },
  { shop: 'autoparts-express', cat: 'fournitures-auto-outils', name: 'Tapis Voiture Caoutchouc Universel 4 Pieces', price: 12000, moq: 5, origin: 'CN', sold: 1800, rating: 4.2, reviews: 289, img: 'auto' },
  { shop: 'autoparts-express', cat: 'fournitures-auto-outils', name: 'Housse Siege Auto Cuir Synthetique Universal', price: 35000, moq: 1, origin: 'CN', sold: 670, rating: 4.4, reviews: 134, img: 'auto' },
  { shop: 'autoparts-express', cat: 'fournitures-auto-outils', name: 'Chargeur Batterie Auto Intelligent 12V/24V', price: 22000, moq: 1, origin: 'CN', sold: 340, rating: 4.5, reviews: 67, img: 'auto' },
  { shop: 'autoparts-express', cat: 'fournitures-auto-outils', name: 'Nettoyeur Haute Pression 2000W 150 Bar', price: 95000, moq: 1, origin: 'CN', sold: 89, rating: 4.6, reviews: 28, img: 'auto' },
  { shop: 'autoparts-express', cat: 'fournitures-auto-outils', name: 'Barre de Toit Universelle Aluminium Paire', price: 28000, moq: 1, origin: 'CN', sold: 230, rating: 4.4, reviews: 56, img: 'auto' },

  // ===================== SPORT CM PRO =====================
  { shop: 'sport-cm-pro', cat: 'sports-divertissements', name: 'Maillot Football Cameroun Lions Indomptables', price: 15000, moq: 5, origin: 'CM', sold: 2300, rating: 4.8, reviews: 456, img: 'sport' },
  { shop: 'sport-cm-pro', cat: 'sports-divertissements', name: 'Cage de Foot Pliable Entrainement 180x120', price: 35000, moq: 1, origin: 'CN', sold: 120, rating: 4.5, reviews: 34, img: 'sport' },
  { shop: 'sport-cm-pro', cat: 'sports-divertissements', name: 'Velo VTT 26 Pouces 21 Vitesses Adulte', price: 125000, moq: 1, origin: 'CN', sold: 56, rating: 4.4, reviews: 18, img: 'sport' },
  { shop: 'sport-cm-pro', cat: 'sports-divertissements', name: 'Table de Ping Pong Pliable Competition', price: 185000, moq: 1, origin: 'CN', sold: 23, rating: 4.6, reviews: 8, img: 'sport' },
  { shop: 'sport-cm-pro', cat: 'sports-divertissements', name: 'Raquette Badminton Carbone Pro Set 2', price: 18000, moq: 3, origin: 'CN', sold: 340, rating: 4.4, reviews: 67, img: 'sport' },
  { shop: 'sport-cm-pro', cat: 'sports-divertissements', name: 'Sac de Frappe Boxe 120cm Cuir PU', price: 45000, moq: 1, origin: 'CN', sold: 89, rating: 4.5, reviews: 23, img: 'sport' },
  { shop: 'sport-cm-pro', cat: 'sports-divertissements', name: 'Gants de Boxe 12oz Cuir Veritable', price: 18000, moq: 2, origin: 'CN', sold: 230, rating: 4.6, reviews: 56, img: 'sport' },
  { shop: 'sport-cm-pro', cat: 'sports-divertissements', name: 'Ballon Basketball Taille 7 Indoor/Outdoor', price: 8500, moq: 5, origin: 'CN', sold: 560, rating: 4.4, reviews: 112, img: 'sport' },
  { shop: 'sport-cm-pro', cat: 'sports-divertissements', name: 'Corde a Sauter Speed Roulement a Billes', price: 3500, moq: 20, origin: 'CN', sold: 1800, rating: 4.3, reviews: 345, img: 'sport' },
  { shop: 'sport-cm-pro', cat: 'sports-divertissements', name: 'Bande Elastique Resistance Set de 5 Fitness', price: 5500, moq: 10, origin: 'CN', sold: 1200, rating: 4.5, reviews: 234, img: 'sport' },
  { shop: 'sport-cm-pro', cat: 'sports-divertissements', name: 'Tente Camping 4 Personnes Impermeabl', price: 55000, moq: 1, origin: 'CN', sold: 120, rating: 4.4, reviews: 34, img: 'sport' },
  { shop: 'sport-cm-pro', cat: 'sports-divertissements', name: 'Sac a Dos Randonnee 50L Impermeabl', price: 22000, moq: 2, origin: 'CN', sold: 340, rating: 4.5, reviews: 67, img: 'sac' },
  { shop: 'sport-cm-pro', cat: 'sports-divertissements', name: 'Jumelles 10x42 HD Observation Chasse', price: 25000, moq: 1, origin: 'CN', sold: 180, rating: 4.4, reviews: 45, img: 'sport' },
  { shop: 'sport-cm-pro', cat: 'vetements-sport-plein-air', name: 'Survêtement Complet Homme Sport Polyester', price: 15000, moq: 5, origin: 'CN', sold: 890, rating: 4.3, reviews: 167, img: 'sport' },
  { shop: 'sport-cm-pro', cat: 'vetements-sport-plein-air', name: 'Baskets Running Femme Legeres Respirantes', price: 18000, moq: 3, origin: 'CN', sold: 670, rating: 4.5, reviews: 134, img: 'chaussures' },
  { shop: 'sport-cm-pro', cat: 'vetements-sport-plein-air', name: 'Crampons Football Homme Gazon Synthetique', price: 25000, moq: 2, origin: 'CN', sold: 560, rating: 4.4, reviews: 112, img: 'chaussures' },

  // ===================== SOLAIREPLUS CAMEROUN =====================
  { shop: 'solaireplus-cameroun', cat: 'energie-renouvelable', name: 'Regulateur Charge Solaire MPPT 60A 12V/24V', price: 65000, moq: 1, origin: 'CN', sold: 230, rating: 4.6, reviews: 56, img: 'materiel' },
  { shop: 'solaireplus-cameroun', cat: 'energie-renouvelable', name: 'Onduleur Solaire Hybride 5kW 48V MPPT', price: 450000, moq: 1, origin: 'CN', sold: 45, rating: 4.8, reviews: 15, img: 'materiel' },
  { shop: 'solaireplus-cameroun', cat: 'energie-renouvelable', name: 'Pompe a Eau Solaire Submersible 72V 1HP', price: 185000, moq: 1, origin: 'CN', sold: 89, rating: 4.7, reviews: 28, img: 'materiel' },
  { shop: 'solaireplus-cameroun', cat: 'energie-renouvelable', name: 'Kit Eclairage Solaire 3 Pieces avec Radio', price: 25000, moq: 5, origin: 'CN', sold: 890, rating: 4.4, reviews: 178, img: 'materiel' },
  { shop: 'solaireplus-cameroun', cat: 'energie-renouvelable', name: 'Panneau Solaire Flexible 200W Camping Car', price: 95000, moq: 1, origin: 'CN', sold: 120, rating: 4.5, reviews: 34, img: 'materiel' },
  { shop: 'solaireplus-cameroun', cat: 'energie-renouvelable', name: 'Ventilateur Solaire 12V Portable Rechargeable', price: 15000, moq: 5, origin: 'CN', sold: 1200, rating: 4.3, reviews: 234, img: 'materiel' },
  { shop: 'solaireplus-cameroun', cat: 'energie-renouvelable', name: 'Congelateur Solaire 200L 12V/24V Direct', price: 350000, moq: 1, origin: 'CN', sold: 34, rating: 4.7, reviews: 12, img: 'materiel' },
  { shop: 'solaireplus-cameroun', cat: 'energie-renouvelable', name: 'Cable Solaire 6mm2 Noir/Rouge 50m', price: 35000, moq: 2, origin: 'CN', sold: 450, rating: 4.4, reviews: 89, img: 'materiel' },
  { shop: 'solaireplus-cameroun', cat: 'energie-renouvelable', name: 'Connecteur MC4 Male/Femelle Lot de 10', price: 5000, moq: 20, origin: 'CN', sold: 2300, rating: 4.3, reviews: 345, img: 'materiel' },
  { shop: 'solaireplus-cameroun', cat: 'energie-renouvelable', name: 'Groupe Electrogene Solaire Portable 1000W', price: 280000, moq: 1, origin: 'CN', sold: 67, rating: 4.6, reviews: 23, img: 'materiel' },
  { shop: 'solaireplus-cameroun', cat: 'eclairage', name: 'Ampoule LED Solaire E27 Rechargeable 15W', price: 3500, moq: 20, origin: 'CN', sold: 3400, rating: 4.4, reviews: 567, img: 'materiel' },
  { shop: 'solaireplus-cameroun', cat: 'eclairage', name: 'Borne Solaire Jardin Inox LED Lot de 6', price: 18000, moq: 5, origin: 'CN', sold: 560, rating: 4.5, reviews: 112, img: 'materiel' },
  { shop: 'solaireplus-cameroun', cat: 'eclairage', name: 'Spot Solaire Encastrable Sol LED 4 Pack', price: 12000, moq: 5, origin: 'CN', sold: 670, rating: 4.3, reviews: 134, img: 'materiel' },
  { shop: 'solaireplus-cameroun', cat: 'securite-protection', name: 'Camera Solaire WiFi 4G Sans Fil Exterieur', price: 45000, moq: 1, origin: 'CN', sold: 340, rating: 4.5, reviews: 67, img: 'securite' },
  { shop: 'solaireplus-cameroun', cat: 'securite-protection', name: 'Alarme Solaire Sans Fil Detecteur Mouvement', price: 25000, moq: 2, origin: 'CN', sold: 230, rating: 4.4, reviews: 56, img: 'securite' },

  // ===================== AGRIFOOD CAMEROUN =====================
  { shop: 'agrifood-cameroun', cat: 'agriculture-alimentation', name: 'Plantain Mur Cameroun Export 25kg', price: 12000, moq: 10, origin: 'CM', sold: 2300, rating: 4.5, reviews: 345, img: 'alimentaire' },
  { shop: 'agrifood-cameroun', cat: 'agriculture-alimentation', name: 'Gingembre Frais Cameroun Grade A 10kg', price: 15000, moq: 5, origin: 'CM', sold: 1200, rating: 4.6, reviews: 234, img: 'alimentaire' },
  { shop: 'agrifood-cameroun', cat: 'agriculture-alimentation', name: 'Arachides Decortiquees Grillees 25kg', price: 35000, moq: 2, origin: 'CM', sold: 890, rating: 4.7, reviews: 178, img: 'alimentaire' },
  { shop: 'agrifood-cameroun', cat: 'agriculture-alimentation', name: 'Manioc Sec Cossettes 50kg Export', price: 25000, moq: 5, origin: 'CM', sold: 670, rating: 4.4, reviews: 134, img: 'alimentaire' },
  { shop: 'agrifood-cameroun', cat: 'agriculture-alimentation', name: 'Epices Camerounaises Mix 5 Varietes 5kg', price: 18000, moq: 5, origin: 'CM', sold: 560, rating: 4.8, reviews: 112, img: 'alimentaire' },
  { shop: 'agrifood-cameroun', cat: 'agriculture-alimentation', name: 'Ndole Seche Feuilles Preparees 5kg', price: 12000, moq: 10, origin: 'CM', sold: 1500, rating: 4.6, reviews: 289, img: 'alimentaire' },
  { shop: 'agrifood-cameroun', cat: 'agriculture-alimentation', name: 'Eru Seche (Okok) Cameroun 5kg', price: 15000, moq: 10, origin: 'CM', sold: 1200, rating: 4.7, reviews: 234, img: 'alimentaire' },
  { shop: 'agrifood-cameroun', cat: 'agriculture-alimentation', name: 'Chocolat Artisanal Cameroun 70% Cacao 1kg', price: 12000, moq: 10, origin: 'CM', sold: 450, rating: 4.9, reviews: 89, img: 'alimentaire' },
  { shop: 'agrifood-cameroun', cat: 'agriculture-alimentation', name: 'The Vert Cameroun Feuilles Bio 500g', price: 8000, moq: 12, origin: 'CM', sold: 670, rating: 4.5, reviews: 134, img: 'alimentaire' },
  { shop: 'agrifood-cameroun', cat: 'agriculture-alimentation', name: 'Riz Local Cameroun Premium 50kg', price: 35000, moq: 5, origin: 'CM', sold: 1800, rating: 4.4, reviews: 289, img: 'alimentaire' },
  { shop: 'agrifood-cameroun', cat: 'agriculture-alimentation', name: 'Noix de Cola Fraiche Premium 10kg', price: 25000, moq: 5, origin: 'CM', sold: 890, rating: 4.6, reviews: 178, img: 'alimentaire' },
  { shop: 'agrifood-cameroun', cat: 'agriculture-alimentation', name: 'Moringa Poudre Bio Cameroun 1kg', price: 8000, moq: 12, origin: 'CM', sold: 1200, rating: 4.8, reviews: 234, img: 'alimentaire' },
  { shop: 'agrifood-cameroun', cat: 'agriculture-alimentation', name: 'Hibiscus Seche (Bissap/Foléré) 5kg', price: 15000, moq: 5, origin: 'CM', sold: 890, rating: 4.5, reviews: 167, img: 'alimentaire' },
  { shop: 'agrifood-cameroun', cat: 'agriculture-alimentation', name: 'Safou Frais (Prune Africaine) 10kg', price: 12000, moq: 10, origin: 'CM', sold: 560, rating: 4.7, reviews: 112, img: 'alimentaire' },
  { shop: 'agrifood-cameroun', cat: 'agriculture-alimentation', name: 'Macabo (Taro) Frais 25kg', price: 8000, moq: 10, origin: 'CM', sold: 1500, rating: 4.3, reviews: 234, img: 'alimentaire' },

  // ===================== PRODUITS SUPPLEMENTAIRES CROSS-SHOP =====================
  // Bijoux - AfrikaMode
  { shop: 'afrikamode', cat: 'bijoux-lunettes-montres', name: 'Collier Perles Africain Fait Main', price: 8000, moq: 10, origin: 'CM', sold: 890, rating: 4.7, reviews: 167, img: 'bijoux' },
  { shop: 'afrikamode', cat: 'bijoux-lunettes-montres', name: 'Bracelet Cuir et Perles Homme Afrique', price: 5000, moq: 20, origin: 'CM', sold: 1200, rating: 4.5, reviews: 234, img: 'bijoux' },
  { shop: 'afrikamode', cat: 'bijoux-lunettes-montres', name: 'Boucles Oreilles Wax Tissu Africain', price: 3500, moq: 24, origin: 'CM', sold: 1500, rating: 4.6, reviews: 289, img: 'bijoux' },
  { shop: 'afrikamode', cat: 'bijoux-lunettes-montres', name: 'Lunettes de Soleil Bois Bambou UV400', price: 12000, moq: 5, origin: 'CN', sold: 670, rating: 4.4, reviews: 134, img: 'bijoux' },

  // Chaussures - AfrikaMode
  { shop: 'afrikamode', cat: 'chaussures-accessoires', name: 'Mocassins Homme Cuir Souple Artisanaux', price: 22000, moq: 3, origin: 'CM', sold: 340, rating: 4.6, reviews: 67, img: 'chaussures' },
  { shop: 'afrikamode', cat: 'chaussures-accessoires', name: 'Escarpins Femme Talon 8cm Wax', price: 18000, moq: 5, origin: 'CM', sold: 450, rating: 4.7, reviews: 89, img: 'chaussures' },
  { shop: 'afrikamode', cat: 'chaussures-accessoires', name: 'Babouches Marocaines Cuir Homme', price: 8000, moq: 10, origin: 'MA', sold: 890, rating: 4.4, reviews: 167, img: 'chaussures' },
  { shop: 'afrikamode', cat: 'chaussures-accessoires', name: 'Bottes Femme Cuir Chelsea Elastique', price: 28000, moq: 2, origin: 'CN', sold: 230, rating: 4.5, reviews: 56, img: 'chaussures' },

  // Sacs - AfrikaMode
  { shop: 'afrikamode', cat: 'bagages-sacs', name: 'Sac Bandouliere Homme Cuir Vintage', price: 18000, moq: 3, origin: 'CM', sold: 560, rating: 4.5, reviews: 112, img: 'sac' },
  { shop: 'afrikamode', cat: 'bagages-sacs', name: 'Valise Cabine 4 Roues 55cm Rigide', price: 35000, moq: 1, origin: 'CN', sold: 340, rating: 4.4, reviews: 67, img: 'sac' },
  { shop: 'afrikamode', cat: 'bagages-sacs', name: 'Sac a Dos Laptop 15.6" Antivol USB', price: 15000, moq: 5, origin: 'CN', sold: 890, rating: 4.5, reviews: 178, img: 'sac' },
  { shop: 'afrikamode', cat: 'bagages-sacs', name: 'Pochette Femme Soiree Clutch Wax Dore', price: 8500, moq: 10, origin: 'CM', sold: 670, rating: 4.6, reviews: 134, img: 'sac' },

  // Construction - HomePlus
  { shop: 'homeplus-cameroun', cat: 'construction-immobilier', name: 'Ciment Portland CEM II 42.5 50kg', price: 5500, moq: 50, origin: 'CM', sold: 8900, rating: 4.5, reviews: 567, img: 'construction' },
  { shop: 'homeplus-cameroun', cat: 'construction-immobilier', name: 'Fer a Beton 10mm Tige 12m', price: 3500, moq: 100, origin: 'CM', sold: 5600, rating: 4.4, reviews: 345, img: 'construction' },
  { shop: 'homeplus-cameroun', cat: 'construction-immobilier', name: 'Tole Aluminium Ondulee 3m Toiture', price: 8500, moq: 20, origin: 'CM', sold: 3400, rating: 4.6, reviews: 456, img: 'construction' },
  { shop: 'homeplus-cameroun', cat: 'construction-immobilier', name: 'Peinture Interieur Blanc Mat 20L', price: 25000, moq: 2, origin: 'CM', sold: 1200, rating: 4.5, reviews: 234, img: 'construction' },
  { shop: 'homeplus-cameroun', cat: 'construction-immobilier', name: 'Carrelage Sol 60x60 Gres Cerame m2', price: 8000, moq: 20, origin: 'CN', sold: 2300, rating: 4.4, reviews: 345, img: 'construction' },
  { shop: 'homeplus-cameroun', cat: 'construction-immobilier', name: 'Robinet Mitigeur Cuisine Inox Pivotant', price: 15000, moq: 5, origin: 'CN', sold: 890, rating: 4.5, reviews: 167, img: 'construction' },

  // Securite - TechStore
  { shop: 'techstore-douala', cat: 'securite-protection', name: 'Kit Video Surveillance 4 Cameras PoE', price: 185000, moq: 1, origin: 'CN', sold: 89, rating: 4.6, reviews: 28, img: 'securite' },
  { shop: 'techstore-douala', cat: 'securite-protection', name: 'Serrure Digitale Empreinte + Code + Carte', price: 95000, moq: 1, origin: 'CN', sold: 120, rating: 4.5, reviews: 34, img: 'securite' },
  { shop: 'techstore-douala', cat: 'securite-protection', name: 'Interphone Video WiFi Ecran 7 Pouces', price: 65000, moq: 1, origin: 'CN', sold: 180, rating: 4.4, reviews: 45, img: 'securite' },
  { shop: 'techstore-douala', cat: 'securite-protection', name: 'Detecteur Fumee Alarme Incendie Pack 3', price: 8500, moq: 10, origin: 'CN', sold: 670, rating: 4.3, reviews: 134, img: 'securite' },

  // Sante - Beauty Queen
  { shop: 'beauty-queen-cm', cat: 'sante-medical', name: 'Tensiometre Electronique Bras Automatique', price: 18000, moq: 2, origin: 'CN', sold: 450, rating: 4.5, reviews: 89, img: 'sante' },
  { shop: 'beauty-queen-cm', cat: 'sante-medical', name: 'Thermometre Infrarouge Sans Contact', price: 8000, moq: 5, origin: 'CN', sold: 1200, rating: 4.4, reviews: 234, img: 'sante' },
  { shop: 'beauty-queen-cm', cat: 'sante-medical', name: 'Oxymetre de Pouls Doigt Ecran LED', price: 5500, moq: 10, origin: 'CN', sold: 890, rating: 4.3, reviews: 167, img: 'sante' },
  { shop: 'beauty-queen-cm', cat: 'sante-medical', name: 'Balance Impedancemetre Connectee Bluetooth', price: 15000, moq: 2, origin: 'CN', sold: 560, rating: 4.5, reviews: 112, img: 'sante' },

  // Bebe / Enfants - HomePlus
  { shop: 'homeplus-cameroun', cat: 'parents-enfants-jouets', name: 'Poussette Bebe 3 en 1 Pliable Reversible', price: 85000, moq: 1, origin: 'CN', sold: 120, rating: 4.6, reviews: 34, img: 'bebe' },
  { shop: 'homeplus-cameroun', cat: 'parents-enfants-jouets', name: 'Lit Bebe Berceau avec Moustiquaire', price: 45000, moq: 1, origin: 'CN', sold: 230, rating: 4.5, reviews: 56, img: 'bebe' },
  { shop: 'homeplus-cameroun', cat: 'parents-enfants-jouets', name: 'Siege Auto Bebe 0-36kg Isofix Pivotant', price: 95000, moq: 1, origin: 'CN', sold: 67, rating: 4.7, reviews: 23, img: 'bebe' },
  { shop: 'homeplus-cameroun', cat: 'parents-enfants-jouets', name: 'Couches Bebe Premium Taille 3 Pack 100', price: 12000, moq: 5, origin: 'CN', sold: 3400, rating: 4.4, reviews: 567, img: 'bebe' },
  { shop: 'homeplus-cameroun', cat: 'parents-enfants-jouets', name: 'Jouet Educatif Montessori Bois 2-5 Ans', price: 8000, moq: 10, origin: 'CN', sold: 890, rating: 4.5, reviews: 167, img: 'bebe' },
  { shop: 'homeplus-cameroun', cat: 'parents-enfants-jouets', name: 'Trottinette Enfant 3 Roues LED Pliable', price: 18000, moq: 3, origin: 'CN', sold: 560, rating: 4.4, reviews: 112, img: 'bebe' },

  // Outillage - AutoParts
  { shop: 'autoparts-express', cat: 'outillage-quincaillerie', name: 'Perceuse Visseuse Sans Fil 21V 2 Batteries', price: 28000, moq: 1, origin: 'CN', sold: 890, rating: 4.5, reviews: 178, img: 'materiel' },
  { shop: 'autoparts-express', cat: 'outillage-quincaillerie', name: 'Scie Circulaire 185mm 1500W Pro', price: 45000, moq: 1, origin: 'CN', sold: 230, rating: 4.6, reviews: 56, img: 'materiel' },
  { shop: 'autoparts-express', cat: 'outillage-quincaillerie', name: 'Poste a Souder Inverter MMA 200A', price: 65000, moq: 1, origin: 'CN', sold: 180, rating: 4.4, reviews: 45, img: 'materiel' },
  { shop: 'autoparts-express', cat: 'outillage-quincaillerie', name: 'Meuleuse Angle 125mm 900W Disque Inclus', price: 22000, moq: 1, origin: 'CN', sold: 560, rating: 4.5, reviews: 112, img: 'materiel' },
  { shop: 'autoparts-express', cat: 'outillage-quincaillerie', name: 'Groupe Electrogene Essence 3500W Silencieux', price: 250000, moq: 1, origin: 'CN', sold: 67, rating: 4.7, reviews: 23, img: 'materiel' },
  { shop: 'autoparts-express', cat: 'outillage-quincaillerie', name: 'Echelle Telescopique Aluminium 3.8m', price: 45000, moq: 1, origin: 'CN', sold: 340, rating: 4.4, reviews: 67, img: 'materiel' },

  // Fournitures bureau - TechStore
  { shop: 'techstore-douala', cat: 'fournitures-scolaires-bureau', name: 'Lot 12 Cahiers 200 Pages Grand Format', price: 5500, moq: 10, origin: 'CM', sold: 3400, rating: 4.3, reviews: 456, img: 'bureau' },
  { shop: 'techstore-douala', cat: 'fournitures-scolaires-bureau', name: 'Calculatrice Scientifique 240 Fonctions', price: 8000, moq: 5, origin: 'CN', sold: 1200, rating: 4.4, reviews: 234, img: 'bureau' },
  { shop: 'techstore-douala', cat: 'fournitures-scolaires-bureau', name: 'Lot Stylos Bille 50 Pieces Bleu/Noir/Rouge', price: 3500, moq: 20, origin: 'CN', sold: 5600, rating: 4.2, reviews: 678, img: 'bureau' },
  { shop: 'techstore-douala', cat: 'fournitures-scolaires-bureau', name: 'Tableau Blanc Magnetique 90x60cm', price: 18000, moq: 1, origin: 'CN', sold: 340, rating: 4.5, reviews: 67, img: 'bureau' },
  { shop: 'techstore-douala', cat: 'fournitures-scolaires-bureau', name: 'Chaise Bureau Ergonomique Roulettes', price: 55000, moq: 1, origin: 'CN', sold: 120, rating: 4.6, reviews: 34, img: 'bureau' },

  // Machines industrielles
  { shop: 'autoparts-express', cat: 'machines-industrielles', name: 'Compresseur Air 100L 3HP Industriel', price: 350000, moq: 1, origin: 'CN', sold: 34, rating: 4.6, reviews: 12, img: 'materiel' },
  { shop: 'autoparts-express', cat: 'machines-industrielles', name: 'Betonniere 350L Electrique Chantier', price: 450000, moq: 1, origin: 'CN', sold: 23, rating: 4.5, reviews: 8, img: 'materiel' },

  // Equipements commerciaux
  { shop: 'homeplus-cameroun', cat: 'equipements-commerciaux', name: 'Vitrine Refrigeree Boulangerie 1.2m', price: 650000, moq: 1, origin: 'CN', sold: 23, rating: 4.7, reviews: 8, img: 'materiel' },
  { shop: 'homeplus-cameroun', cat: 'equipements-commerciaux', name: 'Caisse Enregistreuse Tactile 15" POS', price: 185000, moq: 1, origin: 'CN', sold: 67, rating: 4.5, reviews: 23, img: 'electronique' },
  { shop: 'homeplus-cameroun', cat: 'equipements-commerciaux', name: 'Balance Electronique Commerce 40kg/2g', price: 25000, moq: 2, origin: 'CN', sold: 890, rating: 4.4, reviews: 178, img: 'materiel' },

  // Composants electroniques
  { shop: 'techstore-douala', cat: 'composants-electroniques', name: 'Arduino Uno R3 Kit Demarrage Complet', price: 15000, moq: 2, origin: 'CN', sold: 340, rating: 4.5, reviews: 67, img: 'electronique' },
  { shop: 'techstore-douala', cat: 'composants-electroniques', name: 'Raspberry Pi 4 Model B 4GB RAM', price: 45000, moq: 1, origin: 'UK', sold: 120, rating: 4.7, reviews: 34, img: 'electronique' },
  { shop: 'techstore-douala', cat: 'composants-electroniques', name: 'Module ESP32 WiFi Bluetooth Dev Board', price: 5000, moq: 10, origin: 'CN', sold: 890, rating: 4.4, reviews: 167, img: 'electronique' },

  // Animaux de compagnie
  { shop: 'homeplus-cameroun', cat: 'animaux-compagnie', name: 'Croquettes Chien Adulte Premium 15kg', price: 25000, moq: 2, origin: 'FR', sold: 340, rating: 4.5, reviews: 67, img: 'alimentaire' },
  { shop: 'homeplus-cameroun', cat: 'animaux-compagnie', name: 'Litiere Chat Agglomerante 10kg', price: 8000, moq: 5, origin: 'CN', sold: 890, rating: 4.3, reviews: 167, img: 'maison' },
  { shop: 'homeplus-cameroun', cat: 'animaux-compagnie', name: 'Cage Transport Chat/Petit Chien Avion', price: 18000, moq: 2, origin: 'CN', sold: 230, rating: 4.4, reviews: 56, img: 'maison' },

  // Matieres premieres - AgriFood
  { shop: 'agrifood-cameroun', cat: 'matieres-premieres', name: 'Beurre de Cacao Brut 25kg Export', price: 125000, moq: 2, origin: 'CM', sold: 120, rating: 4.8, reviews: 34, img: 'alimentaire' },
  { shop: 'agrifood-cameroun', cat: 'matieres-premieres', name: 'Latex Naturel Hevea 200L Fût', price: 350000, moq: 1, origin: 'CM', sold: 45, rating: 4.6, reviews: 15, img: 'alimentaire' },
  { shop: 'agrifood-cameroun', cat: 'matieres-premieres', name: 'Charbon de Bois Premium 50kg', price: 8000, moq: 20, origin: 'CM', sold: 2300, rating: 4.3, reviews: 345, img: 'alimentaire' },
];

async function main() {
  console.log(`\nAjout de ${moreProducts.length} produits supplementaires...\n`);

  // Fetch shops and categories from DB
  const shops = await prisma.shop.findMany({ select: { id: true, slug: true } });
  const categories = await prisma.category.findMany({ select: { id: true, slug: true } });

  const shopMap: Record<string, string> = {};
  for (const s of shops) shopMap[s.slug] = s.id;

  const catMap: Record<string, string> = {};
  for (const c of categories) catMap[c.slug] = c.id;

  let created = 0;
  let skipped = 0;

  for (const p of moreProducts) {
    const slug = p.name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/-$/, '')
      .substring(0, 80);

    const shopId = shopMap[p.shop];
    const categoryId = catMap[p.cat];

    if (!shopId) {
      console.log(`  [SKIP] Shop introuvable: ${p.shop}`);
      skipped++;
      continue;
    }

    const existing = await prisma.product.findFirst({ where: { slug } });
    if (existing) {
      skipped++;
      continue;
    }

    const product = await prisma.product.create({
      data: {
        shopId,
        categoryId: categoryId || null,
        name: p.name,
        slug,
        description: `${p.name}. Produit de qualite disponible sur EstuaireAchats. Livraison rapide partout au Cameroun. Commande min: ${p.moq} pieces.`,
        price: p.price,
        priceMin: p.moq > 1 ? Math.round(p.price * 0.7) : p.price,
        priceMax: p.price,
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

    // Add price tiers seulement pour les produits en gros (moq > 1)
    if (p.moq > 1) {
      const tier1Price = p.price;
      const tier2Price = Math.round(p.price * 0.85);
      const tier3Price = Math.round(p.price * 0.7);
      await prisma.priceTier.createMany({
        data: [
          { productId: product.id, minQty: 1, maxQty: p.moq - 1, price: tier1Price },
          { productId: product.id, minQty: p.moq, maxQty: p.moq * 5 - 1, price: tier2Price },
          { productId: product.id, minQty: p.moq * 5, maxQty: null, price: tier3Price },
        ],
      });
    }

    const images = imgs[p.img] || imgs.electronique;
    for (let i = 0; i < images.length; i++) {
      await prisma.productImage.create({
        data: {
          productId: product.id,
          url: images[i],
          isMain: i === 0,
          order: i,
        },
      });
    }

    created++;
    if (created % 20 === 0) {
      console.log(`  ... ${created} produits crees`);
    }
  }

  console.log(`\nTermine! ${created} nouveaux produits crees, ${skipped} ignores.`);

  const total = await prisma.product.count();
  console.log(`Total produits en base: ${total}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
