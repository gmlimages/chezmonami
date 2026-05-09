// Lot H — Vérification du code 2FA reçu par email (entreprise).
// POST { challenge, code } → { success, token, compte }
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { rateLimit } from '@/lib/rateLimit';
import { hashCode, TFA_MAX_TENTATIVES } from '@/lib/tfa';

function generateToken() {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function POST(request) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || request.headers.get('x-real-ip')
      || 'unknown';

    const rl = rateLimit(`tfa-ent:${ip}`, { limit: 20, windowMs: 60_000 });
    if (!rl.allowed) {
      return NextResponse.json(
        { error: `Trop de tentatives. Réessayez dans ${rl.retryAfter} s.` },
        { status: 429 }
      );
    }

    const { challenge, code } = await request.json();
    if (!challenge || !code) {
      return NextResponse.json({ error: 'Challenge et code requis' }, { status: 400 });
    }

    const codeStr = String(code).trim();
    if (!/^\d{6}$/.test(codeStr)) {
      return NextResponse.json({ error: 'Code invalide' }, { status: 400 });
    }

    const { data: tfa } = await supabaseAdmin
      .from('tfa_codes')
      .select('id, compte_id, code_hash, tentatives, expires_at, used_at')
      .eq('challenge', challenge)
      .maybeSingle();

    if (!tfa || !tfa.compte_id) {
      return NextResponse.json({ error: 'Session expirée. Reconnectez-vous.' }, { status: 401 });
    }
    if (tfa.used_at) {
      return NextResponse.json({ error: 'Code déjà utilisé. Reconnectez-vous.' }, { status: 401 });
    }
    if (new Date(tfa.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Code expiré. Reconnectez-vous.' }, { status: 401 });
    }
    if (tfa.tentatives >= TFA_MAX_TENTATIVES) {
      return NextResponse.json({ error: 'Trop de tentatives. Reconnectez-vous.' }, { status: 401 });
    }

    if (hashCode(codeStr) !== tfa.code_hash) {
      await supabaseAdmin
        .from('tfa_codes')
        .update({ tentatives: tfa.tentatives + 1 })
        .eq('id', tfa.id);
      const restantes = Math.max(0, TFA_MAX_TENTATIVES - (tfa.tentatives + 1));
      return NextResponse.json({
        error: restantes > 0
          ? `Code incorrect. ${restantes} tentative(s) restante(s).`
          : 'Trop de tentatives. Reconnectez-vous.',
      }, { status: 401 });
    }

    await supabaseAdmin
      .from('tfa_codes')
      .update({ used_at: new Date().toISOString() })
      .eq('id', tfa.id);

    const { data: compte } = await supabaseAdmin
      .from('comptes_structures')
      .select(`
        id, email, nom_contact, statut, abonnement,
        badge_verifie, structure_id, telephone_contact, email_contact,
        structures (id, nom, categorie_id, verifie)
      `)
      .eq('id', tfa.compte_id)
      .single();

    if (!compte) {
      return NextResponse.json({ error: 'Compte introuvable' }, { status: 404 });
    }

    const token = generateToken();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 8);

    await supabaseAdmin.from('comptes_sessions').insert({
      compte_id: compte.id,
      token,
      expires_at: expiresAt.toISOString(),
    });

    return NextResponse.json({
      success: true,
      token,
      compte: {
        id: compte.id,
        email: compte.email,
        nom_contact: compte.nom_contact,
        statut: compte.statut,
        abonnement: compte.abonnement,
        badge_verifie: compte.badge_verifie,
        structure_id: compte.structure_id,
        telephone_contact: compte.telephone_contact,
        email_contact: compte.email_contact,
        structure: compte.structures,
      },
    });
  } catch (err) {
    console.error('verify-2fa entreprise error:', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
