import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

async function callClaude(systemPrompt: string, imageBase64: string, mimeType: string): Promise<{ text?: string; error?: string }> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return { error: null as any }; // fallback to Gemini

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1500,
        messages: [{
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: mimeType, data: imageBase64 } },
            { type: 'text', text: systemPrompt },
          ],
        }],
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.error('Claude API error:', err);
      return { error: null as any }; // fallback to Gemini
    }

    const data = await res.json();
    const text = data?.content?.[0]?.text || '';
    return { text };
  } catch {
    return { error: null as any }; // fallback to Gemini
  }
}

function getGeminiKeys(): string[] {
  const keys: string[] = [];
  const multiKeys = process.env.GEMINI_API_KEYS;
  if (multiKeys) {
    keys.push(...multiKeys.split(',').map(k => k.trim()).filter(Boolean));
  }
  const singleKey = process.env.GEMINI_API_KEY;
  if (singleKey && !keys.includes(singleKey)) {
    keys.push(singleKey);
  }
  return keys;
}

async function callGeminiWithRotation(body: object): Promise<{ data?: any; error?: string }> {
  const keys = getGeminiKeys();
  if (keys.length === 0) {
    return { error: 'Aucune cle API IA configuree (ni Claude ni Gemini).' };
  }

  for (const key of keys) {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }
    );

    if (res.ok) {
      const data = await res.json();
      return { data };
    }

    if (res.status === 429) {
      console.log(`Gemini key ...${key.slice(-6)} quota exceeded, trying next key`);
      continue;
    }

    const errData = await res.json().catch(() => ({}));
    return { error: errData?.error?.message || `Erreur Gemini API (${res.status})` };
  }

  return { error: 'Toutes les cles API ont atteint leur quota.' };
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

const PRODUCT_ANALYZE_PROMPT = `Analyse cette image de produit pour une plateforme e-commerce B2B panafricaine (marche africain, devise FCFA/XAF).

Reponds UNIQUEMENT en JSON valide avec cette structure exacte :
{
  "nom": "Nom commercial du produit (concis, professionnel)",
  "descriptionCourte": "Resume en 1 phrase (max 150 caracteres) pour les listes produits.",
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

export async function POST(req: NextRequest) {
  try {
    const { image, mimeType } = await req.json();

    if (!image) {
      return NextResponse.json({ error: 'Image requise' }, { status: 400 });
    }

    let text = '';

    // 1. Essayer Gemini d'abord (gratuit)
    const geminiResult = await callGeminiWithRotation({
      contents: [{
        parts: [
          { text: PRODUCT_ANALYZE_PROMPT },
          { inlineData: { mimeType: mimeType || 'image/jpeg', data: image } },
        ],
      }],
    });

    if (!geminiResult.error && geminiResult.data) {
      text = geminiResult.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    } else {
      // 2. Fallback Claude quand Gemini est epuise
      console.log('Gemini indisponible, basculement vers Claude:', geminiResult.error);
      const claudeResult = await callClaude(PRODUCT_ANALYZE_PROMPT, image, mimeType || 'image/jpeg');
      if (claudeResult.text) {
        text = claudeResult.text;
      } else {
        return NextResponse.json({ error: geminiResult.error || 'Aucune IA disponible' }, { status: 500 });
      }
    }

    let productData;
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      productData = JSON.parse(jsonMatch ? jsonMatch[0] : text);
    } catch {
      return NextResponse.json(
        { error: 'Erreur d\'analyse de la reponse IA', raw: text },
        { status: 500 }
      );
    }

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
