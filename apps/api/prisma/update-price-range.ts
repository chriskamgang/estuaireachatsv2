import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const products = await prisma.product.findMany({
    where: { price: { not: null } },
    select: { id: true, price: true, minOrderQty: true },
  });

  console.log(`${products.length} produits trouves...`);

  let updated = 0;
  for (const p of products) {
    if (!p.price) continue;

    const isWholesale = p.minOrderQty > 1;

    // priceMin = prix le plus bas (gros volume), priceMax = prix unitaire
    // Si produit au detail (moq=1), priceMin = priceMax = price
    const priceMin = isWholesale ? Math.round(p.price * 0.7) : p.price;
    const priceMax = p.price;

    await prisma.product.update({
      where: { id: p.id },
      data: { priceMin, priceMax },
    });

    // Creer les priceTiers seulement pour les produits en gros
    if (isWholesale) {
      const existingTiers = await prisma.priceTier.count({ where: { productId: p.id } });
      if (existingTiers === 0) {
        const tier1Price = p.price;
        const tier2Price = Math.round(p.price * 0.85);
        const tier3Price = Math.round(p.price * 0.7);
        await prisma.priceTier.createMany({
          data: [
            { productId: p.id, minQty: 1, maxQty: p.minOrderQty - 1, price: tier1Price },
            { productId: p.id, minQty: p.minOrderQty, maxQty: p.minOrderQty * 5 - 1, price: tier2Price },
            { productId: p.id, minQty: p.minOrderQty * 5, maxQty: null, price: tier3Price },
          ],
        });
        console.log(`  [GROS] ${p.id}: ${tier3Price} - ${tier1Price} FCFA (3 paliers)`);
      }
    } else {
      console.log(`  [DETAIL] ${p.id}: ${p.price} FCFA (prix unique)`);
    }

    updated++;
  }

  console.log(`\n${updated} produits mis a jour.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
