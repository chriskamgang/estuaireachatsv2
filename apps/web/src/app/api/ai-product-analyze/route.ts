import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Recuperer la cle API Gemini depuis les settings ou l'env
async function getGeminiKey(): Promise<string> {
  try {
    const res = await fetch(`${API_URL}/settings/ai/key`, { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      if (data.key) return data.key;
    }
  } catch {}
  return process.env.GEMINI_API_KEY || '';
}

async function getUnsplashKey(): Promise<string> {
  try {
    const res = await fetch(`${API_URL}/settings/ai/unsplash-key`, { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      if (data.key) return data.key;
    }
  } catch {}
  return process.env.UNSPLASH_ACCESS_KEY || '';
}

async function searchUnsplash(query: string, count = 5): Promise<string[]> {
  const unsplashKey = await getUnsplashKey();
  if (!unsplashKey) return [];
  try {
    const res = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=${count}&orientation=squarish`,
      { headers: { Authorization: `Client-ID ${unsplashKey}` } }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return data.results.map((r: { urls: { regular: string } }) => r.urls.regular);
  } catch {
    return [];
  }
}

// Prompt systeme pour l'analyse de produit
const PRODUCT_ANALYZE_PROMPT = `Analyse cette image de produit pour une plateforme e-commerce B2B panafricaine (marche africain, devise FCFA/XAF).

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
- Pas de markdown, pas de commentaires, JUSTE le JSON`;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json(null, { headers: corsHeaders });
}

function jsonCors(data: unknown, status = 200) {
  return NextResponse.json(data, { status, headers: corsHeaders });
}

export async function POST(req: NextRequest) {
  try {
    const apiKey = await getGeminiKey();
    if (!apiKey) {
      return jsonCors(
        { error: 'Cle API Gemini non configuree. Configurez-la dans Admin > Parametres > IA.' },
        500
      );
    }

    const { image, mimeType } = await req.json();

    if (!image) {
      return jsonCors({ error: 'Image requise' }, 400);
    }

    // Appel API Gemini avec image en base64
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: PRODUCT_ANALYZE_PROMPT },
              { inlineData: { mimeType: mimeType || 'image/jpeg', data: image } },
            ],
          }],
        }),
      }
    );

    if (!geminiRes.ok) {
      const errData = await geminiRes.json().catch(() => ({}));
      const errMsg = errData?.error?.message || `Erreur Gemini API (${geminiRes.status})`;
      return jsonCors({ error: errMsg }, 500);
    }

    const geminiData = await geminiRes.json();
    const text = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // Parse JSON from response
    let productData;
    try {
      // Try to extract JSON if wrapped in code blocks
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      productData = JSON.parse(jsonMatch ? jsonMatch[0] : text);
    } catch {
      return jsonCors(
        { error: 'Erreur d\'analyse de la reponse IA', raw: text },
        500
      );
    }

    // Search Unsplash for similar images
    const unsplashImages = await searchUnsplash(
      productData.unsplashQuery || productData.nom,
      5
    );

    return jsonCors({
      ...productData,
      suggestedImages: unsplashImages,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erreur inconnue';
    return jsonCors({ error: message }, 500);
  }
}
