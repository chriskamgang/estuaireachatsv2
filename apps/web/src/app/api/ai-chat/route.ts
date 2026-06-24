import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

async function getAnthropicKey(): Promise<string> {
  try {
    const res = await fetch(`${API_URL}/settings/ai/key`, { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      if (data.key) return data.key;
    }
  } catch {}
  return process.env.ANTHROPIC_API_KEY || '';
}

const SYSTEM_PROMPT = `Tu es l'assistant IA de sourcing d'EstuaireAchats, une plateforme e-commerce B2B panafricaine (clone d'Alibaba).

REGLES :
- Reponds dans la langue du client (francais si le client ecrit en francais, anglais si en anglais)
- Tu es specialise dans le sourcing de produits, la mise en relation acheteurs-fournisseurs, et le commerce en Afrique (surtout Cameroun)
- Devise : FCFA (XAF) uniquement
- Sois concis, professionnel et utile
- Tu peux recommander des produits, analyser des tendances, comparer des fournisseurs, conseiller sur les MOQ, les prix, la logistique
- Si le client cherche un produit, utilise les donnees produits disponibles pour recommander
- Formate tes reponses avec du markdown quand c'est utile (listes, gras, tableaux)

PRODUITS DISPONIBLES SUR LA PLATEFORME :
1. Plaquettes de frein ceramique Toyota (8 500-14 252 FCFA, MOQ: 2) - GuangZhou Auto Parts Co. - Chine
2. Ampoule LED H7 12000LM (3 200-5 800 FCFA, MOQ: 10) - ShenZhen Light Tech - Chine
3. Filtre a huile MANN-FILTER (1 800-2 500 FCFA, MOQ: 20) - Euro Parts Cameroun
4. Smartphone Android 13 6.7" (45 000-78 000 FCFA, MOQ: 5) - ShenZhen Mobile Tech - Chine
5. Ecouteurs Bluetooth TWS 5.3 (5 500-12 000 FCFA, MOQ: 10) - DongGuan Audio Co. - Chine
6. Generateur diesel 5kW (350 000-520 000 FCFA, MOQ: 1) - Weifang Power Machinery - Chine
7. T-shirt coton personnalise (1 200-3 500 FCFA, MOQ: 50) - FoShan Textile Group - Chine
8. Ciment Portland 42.5N 50kg (4 500-5 200 FCFA, MOQ: 100) - Cimencam Distribution - Cameroun
9. Panneau solaire 400W mono (85 000-125 000 FCFA, MOQ: 2) - JinKo Solar - Chine
10. Huile moteur 5W-30 5L (12 000-18 500 FCFA, MOQ: 6) - LubeMax Industries - Turquie
11. Machine a coudre industrielle (185 000-275 000 FCFA, MOQ: 1) - Zhejiang Sewing Tech - Chine
12. Chaussures securite S3 (8 500-15 000 FCFA, MOQ: 10) - FuJian Safety Gear - Chine
13. Camera surveillance WiFi 4MP (15 000-28 000 FCFA, MOQ: 5) - ShenZhen Security Tech - Chine
14. Peinture latex 20L (22 000-35 000 FCFA, MOQ: 5) - Sika Cameroun SARL - Cameroun
15. Batterie auto 12V 75Ah (35 000-55 000 FCFA, MOQ: 4) - Camel Battery Group - Chine
16. Robinet cuisine inox 304 (12 000-25 000 FCFA, MOQ: 10) - KaiPing Sanitary Ware - Chine
17. Onduleur solaire 5KVA (250 000-380 000 FCFA, MOQ: 1) - Growatt New Energy - Chine
18. Tissu wax africain 6 yards (3 500-8 000 FCFA, MOQ: 20) - Lagos Textiles Int. - Nigeria

CATEGORIES : Pieces Automobiles, Electronique, Machines Industrielles, Vetements & Textiles, Materiaux de Construction, Beaute & Sante, Maison & Jardin, Sports & Loisirs`;

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();

    const apiKey = await getAnthropicKey();
    if (!apiKey || apiKey === 'sk-ant-your-key-here') {
      return NextResponse.json(
        { error: 'Cle API Anthropic non configuree. Configurez-la dans Admin > Parametres > IA.' },
        { status: 500 }
      );
    }

    const client = new Anthropic({ apiKey });

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: messages.map((m: { role: string; content: string }) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    });

    const text = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map((block) => block.text)
      .join('');

    return NextResponse.json({ response: text });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erreur inconnue';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
