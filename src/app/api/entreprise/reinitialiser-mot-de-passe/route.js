import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import bcrypt from 'bcryptjs';
import { rateLimit } from '@/lib/rateLimit';

// POST /api/entreprise/reinitialiser-mot-de-passe  { token, mot_de_passe }
export async function POST(request) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || request.headers.get('x-real-ip')
      || 'unknown';
    const rl = rateLimit(`reset-set:${ip}`, { limit: 10, windowMs: 60 * 60_000 });
    if (!rl.allowed) {
      return NextResponse.json({ error: 'Trop de tentatives' }, { status: 429 });
    }

    const { token, mot_de_passe } = await request.json();
    if (!token || !mot_de_passe) {
      return NextResponse.json({ error: 'Token et mot de passe requis' }, { status: 400 });
    }
    if (mot_de_passe.length < 8) {
      return NextResponse.json(
        { error: 'Le mot de passe doit contenir au moins 8 caractères' },
        { status: 400 }
      );
    }

    const { data: compte } = await supabaseAdmin
      .from('comptes_structures')
      .select('id, reset_token_expire')
      .eq('reset_token', token)
      .maybeSingle();

    if (!compte) {
      return NextResponse.json(
        { error: 'Lien invalide ou déjà utilisé' },
        { status: 400 }
      );
    }
    if (!compte.reset_token_expire || new Date(compte.reset_token_expire) < new Date()) {
      return NextResponse.json(
        { error: 'Lien expiré. Veuillez recommencer.' },
        { status: 400 }
      );
    }

    const hash = await bcrypt.hash(mot_de_passe, 12);
    const { error: updErr } = await supabaseAdmin
      .from('comptes_structures')
      .update({
        mot_de_passe: hash,
        reset_token: null,
        reset_token_expire: null,
      })
      .eq('id', compte.id);

    if (updErr) throw updErr;

    return NextResponse.json({
      success: true,
      message: 'Mot de passe réinitialisé. Vous pouvez maintenant vous connecter.',
    });
  } catch (error) {
    console.error('reinitialiser-mot-de-passe:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
