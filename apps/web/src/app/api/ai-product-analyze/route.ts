import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY || '';

async function searchUnsplash(query: string, count = 5): Promise<string[]> {
  if (!UNSPLASH_ACCESS_KEY) return [];
  try {
    const res = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=${count}&orientation=squarish`,
      { headers: { Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}` } }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return data.results.map((r: { urls: { regular: string } }) => r.urls.regular);
  } catch {
    return [];
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY === 'sk-ant-your-key-here') {
      return NextResponse.json(
        { error: 'Cle API Anthropic non configuree' },
        { status: 500 }
      );
    }

    const { image, mimeType } = await req.json();

    if (!image) {
      return NextResponse.json({ error: 'Image requise' }, { status: 400 });
    }

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mimeType || 'image/jpeg',
                data: image,
              },
            },
            {
              type: 'text',
              text: `Analyse cette image de produit pour une plateforme e-commerce B2B panafricaine (marche africain, devise FCFA/XAF).

Reponds UNIQUEMENT en JSON valide avec cette structure exacte :
{
  "nom": "Nom commercial du produit (concis, professionnel)",
  "description": "Description detaillee du produit en 3-5 phrases. Inclus les caracteristiques techniques, materiaux, usages, avantages. Adapte au marche africain.",
  "categorie": "une parmi: materiaux|textiles|electronique|auto|equipement|alimentaire|beaute|mode-femme|mode-homme|accessoires|chaussures|maison",
  "marque": "Marque suggeree ou 'Generique'",
  "tags": "tag1, tag2, tag3, tag4, tag5",
  "unite": "une parmi: piece|carton|sac|palette|lot|metre|kg|tonne",
  "moq": 10,
  "prixMin": 1000,
  "prixMax": 5000,
  "poids": "0.5",
  "seoTitle": "Titre SEO optimise (max 70 caracteres)",
  "seoDesc": "Meta description SEO (max 160 caracteres)",
  "seoSlug": "slug-url-du-produit",
  "unsplashQuery": "mots-cles en anglais pour chercher des images similaires sur Unsplash",
  "paliers": [
    { "minQty": 10, "maxQty": 49, "prix": 5000 },
    { "minQty": 50, "maxQty": 99, "prix": 4500 },
    { "minQty": 100, "maxQty": 499, "prix": 4000 }
  ],
  "variantes": [
    { "type": "taille", "valeur": "M" },
    { "type": "taille", "valeur": "L" }
  ]
}

REGLES POUR LES VARIANTES:
- Telephone/smartphone: type="memoire", valeurs comme "64 Go", "128 Go", "256 Go", "512 Go"
- Vetement/chaussure/mode: type="taille", valeurs comme "S", "M", "L", "XL", "XXL" ou "38", "39", "40", "41", "42"
- Ordinateur/laptop: type="config", valeurs comme "8Go RAM / 256Go SSD", "16Go RAM / 512Go SSD", "32Go RAM / 1To SSD"
- Si le produit a des couleurs visibles: type="couleur", valeurs comme "Noir", "Blanc", "Rouge"
- TV/ecran: type="taille_ecran", valeurs comme "32 pouces", "43 pouces", "55 pouces"
- NE PAS mettre de prix dans les variantes, le vendeur les saisira manuellement
- Si aucune variante n'est pertinente, mettre un tableau vide []
- Tu peux combiner plusieurs types de variantes (ex: memoire + couleur pour un telephone)

IMPORTANT:
- Les prix sont en FCFA (XAF), adaptes au marche africain
- Le MOQ doit etre realiste pour du B2B
- Les paliers de prix doivent etre degressifs
- Pas de markdown, pas de commentaires, JUSTE le JSON`
            },
          ],
        },
      ],
    });

    const text = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map((block) => block.text)
      .join('');

    // Parse JSON from response
    let productData;
    try {
      // Try to extract JSON if wrapped in code blocks
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      productData = JSON.parse(jsonMatch ? jsonMatch[0] : text);
    } catch {
      return NextResponse.json(
        { error: 'Erreur d\'analyse de la reponse IA', raw: text },
        { status: 500 }
      );
    }

    // Search Unsplash for similar images
    const unsplashImages = await searchUnsplash(
      productData.unsplashQuery || productData.nom,
      5
    );

    return NextResponse.json({
      ...productData,
      suggestedImages: unsplashImages,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erreur inconnue';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
