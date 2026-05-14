// Lot Partenaires — Vérification publique d'un code partenaire (inscription)
import { NextResponse } from 'next/server';
import { verifierCodePartenaire } from '@/lib/partenaires';
import { rateLimit } from '@/lib/rateLimit';

export async function POST(request) {
  const rl = rateLimit({ key: `verifier-code-part:${request.headers.get('x-forwarded-for') || 'anon'}`, max: 30, windowMs: 60_000 });
  if (!rl.allowed) return NextResponse.json({ valid: false, raison: 'rate_limit' }, { status: 429 });
  try {
    const { code } = await request.json();
    const r = await verifierCodePartenaire(code);
    return NextResponse.json(r);
  } catch (err) {
    return NextResponse.json({ valid: false, raison: 'erreur_serveur' }, { status: 500 });
  }
}
