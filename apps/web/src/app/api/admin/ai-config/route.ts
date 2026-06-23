import { NextRequest, NextResponse } from 'next/server';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

const ENV_PATH = join(process.cwd(), '.env.local');

function getEnvVars(): Record<string, string> {
  if (!existsSync(ENV_PATH)) return {};
  const content = readFileSync(ENV_PATH, 'utf-8');
  const vars: Record<string, string> = {};
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx > 0) {
      vars[trimmed.slice(0, eqIdx)] = trimmed.slice(eqIdx + 1);
    }
  }
  return vars;
}

function saveEnvVars(vars: Record<string, string>) {
  const lines = Object.entries(vars).map(([k, v]) => `${k}=${v}`);
  writeFileSync(ENV_PATH, lines.join('\n') + '\n', 'utf-8');
}

function maskKey(key: string, placeholder: string): { has: boolean; masked: string } {
  const has = key.length > 10 && key !== placeholder;
  const masked = has ? key.slice(0, 10) + '...' + key.slice(-4) : '';
  return { has, masked };
}

// GET: return current config (masked keys)
export async function GET() {
  const vars = getEnvVars();

  const anthropic = maskKey(vars['ANTHROPIC_API_KEY'] || '', 'sk-ant-your-key-here');
  const unsplash = maskKey(vars['UNSPLASH_ACCESS_KEY'] || '', 'your-unsplash-access-key-here');

  return NextResponse.json({
    hasKey: anthropic.has,
    maskedKey: anthropic.masked,
    hasUnsplashKey: unsplash.has,
    maskedUnsplashKey: unsplash.masked,
  });
}

// POST: save API keys
export async function POST(req: NextRequest) {
  const { apiKey, unsplashKey } = await req.json();
  const vars = getEnvVars();

  // Save Anthropic key
  if (apiKey) {
    if (typeof apiKey !== 'string' || !apiKey.startsWith('sk-ant-')) {
      return NextResponse.json(
        { error: 'Cle API Anthropic invalide. Elle doit commencer par sk-ant-' },
        { status: 400 }
      );
    }
    vars['ANTHROPIC_API_KEY'] = apiKey;
  }

  // Save Unsplash key
  if (unsplashKey) {
    if (typeof unsplashKey !== 'string' || unsplashKey.length < 10) {
      return NextResponse.json(
        { error: 'Cle Unsplash invalide.' },
        { status: 400 }
      );
    }
    vars['UNSPLASH_ACCESS_KEY'] = unsplashKey;
  }

  if (!apiKey && !unsplashKey) {
    return NextResponse.json({ error: 'Aucune cle fournie.' }, { status: 400 });
  }

  saveEnvVars(vars);
  return NextResponse.json({ success: true, message: 'Configuration sauvegardee. Redemarrez le serveur pour appliquer.' });
}
