// Lot H — Vérification du code 2FA reçu par email.
// POST { challenge, code } → { success, token, admin }
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

    // Rate limit dédié — 20/min par IP
    const rl = rateLimit(`tfa:${ip}`, { limit: 20, windowMs: 60_000 });
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

    // Récupérer le challenge
    const { data: tfa } = await supabaseAdmin
      .from('tfa_codes')
      .select('id, admin_id, code_hash, tentatives, expires_at, used_at')
      .eq('challenge', challenge)
      .maybeSingle();

    if (!tfa) {
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

    // Comparaison du hash
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

    // Code valide — marquer comme utilisé
    await supabaseAdmin
      .from('tfa_codes')
      .update({ used_at: new Date().toISOString() })
      .eq('id', tfa.id);

    // Récupérer l'admin
    const { data: admin } = await supabaseAdmin
      .from('admins')
      .select('id, nom, email, role, doit_changer_mdp')
      .eq('id', tfa.admin_id)
      .single();

    if (!admin) {
      return NextResponse.json({ error: 'Admin introuvable' }, { status: 404 });
    }

    // Créer la session admin (8h)
    const token = generateToken();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 8);
    await supabaseAdmin.from('admin_sessions').insert({
      admin_id: admin.id,
      token,
      expires_at: expiresAt.toISOString(),
    });

    // Marquer la connexion réussie
    await supabaseAdmin
      .from('admins')
      .update({ derniere_connexion: new Date().toISOString() })
      .eq('id', admin.id);

    return NextResponse.json({
      success: true,
      token,
      admin: {
        id: admin.id,
        nom: admin.nom,
        email: admin.email,
        role: admin.role,
        doit_changer_mdp: admin.doit_changer_mdp || false,
      },
    });
  } catch (err) {
    console.error('verify-2fa error:', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
