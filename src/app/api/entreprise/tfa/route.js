// Lot H — Activer / désactiver la 2FA pour le compte entreprise courant.
// GET   → { tfa_active }
// PATCH { active: true|false } → met à jour
import { NextResponse } from 'next/server';
import { supabaseAdmin, getCompteFromToken, isImpersonating } from '@/lib/supabaseAdmin';

function getToken(request) {
  const auth = request.headers.get('authorization') || '';
  return auth.startsWith('Bearer ') ? auth.slice(7) : null;
}

export async function GET(request) {
  const token = getToken(request);
  const compte = await getCompteFromToken(token);
  if (!compte) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  const { data } = await supabaseAdmin
    .from('comptes_structures')
    .select('tfa_active')
    .eq('id', compte.id)
    .single();
  return NextResponse.json({ tfa_active: !!data?.tfa_active });
}

export async function PATCH(request) {
  const token = getToken(request);
  const compte = await getCompteFromToken(token);
  if (!compte) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  if (isImpersonating(compte)) {
    return NextResponse.json({ error: 'Action non autorisée en mode impersonation' }, { status: 403 });
  }
  try {
    const { active } = await request.json();
    const tfa_active = !!active;
    const { error } = await supabaseAdmin
      .from('comptes_structures')
      .update({ tfa_active })
      .eq('id', compte.id);
    if (error) throw error;
    return NextResponse.json({ success: true, tfa_active });
  } catch (err) {
    console.error('PATCH entreprise/tfa error:', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
