// Lot Parrainage — Vérification publique d'un code (pré-inscription)
// POST { code } → { valid, parrain_nom?, expire_le? } | { valid: false, raison }
//
// Permet au formulaire d'inscription d'afficher en temps réel si le code est OK.
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { rateLimit } from '@/lib/rateLimit';

export async function POST(request) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip')
    || 'unknown';
  const rl = rateLimit(`parr-verif:${ip}`, { limit: 30, windowMs: 60_000 });
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Trop de tentatives' }, { status: 429 });
  }

  const body = await request.json().catch(() => ({}));
  const code = String(body.code || '').trim().toUpperCase();
  if (!code) return NextResponse.json({ valid: false, raison: 'Code vide' });

  const { data: c } = await supabaseAdmin
    .from('codes_parrainage')
    .select(`
      id, code, actif, date_expiration, utilise_par_compte_id,
      parrain:comptes_structures!codes_parrainage_parrain_compte_id_fkey (
        id, nom_contact, structures (nom)
      )
    `)
    .eq('code', code)
    .maybeSingle();

  if (!c) return NextResponse.json({ valid: false, raison: 'Code introuvable' });
  if (!c.actif) return NextResponse.json({ valid: false, raison: 'Code révoqué' });
  if (c.utilise_par_compte_id) return NextResponse.json({ valid: false, raison: 'Code déjà utilisé' });
  if (c.date_expiration && new Date(c.date_expiration) < new Date()) {
    return NextResponse.json({ valid: false, raison: 'Code expiré' });
  }

  return NextResponse.json({
    valid: true,
    parrain_nom: c.parrain?.structures?.nom || c.parrain?.nom_contact || 'une entreprise',
    expire_le: c.date_expiration,
  });
}
