// Lot Partenaires — Changement de mot de passe (par le partenaire connecté)
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { supabaseAdmin, getPartenaireFromToken } from '@/lib/supabaseAdmin';

function getToken(request) {
  const auth = request.headers.get('authorization') || '';
  return auth.startsWith('Bearer ') ? auth.slice(7) : null;
}

export async function PATCH(request) {
  const partenaire = await getPartenaireFromToken(getToken(request));
  if (!partenaire) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  try {
    const { ancien_mdp, nouveau_mdp } = await request.json();
    if (!ancien_mdp || !nouveau_mdp) {
      return NextResponse.json({ error: 'Champs manquants' }, { status: 400 });
    }
    if (nouveau_mdp.length < 8) {
      return NextResponse.json({ error: 'Mot de passe minimum 8 caractères' }, { status: 400 });
    }
    const { data: full } = await supabaseAdmin
      .from('comptes_partenaires')
      .select('mot_de_passe_hash')
      .eq('id', partenaire.id)
      .single();
    const ok = await bcrypt.compare(ancien_mdp, full.mot_de_passe_hash);
    if (!ok) return NextResponse.json({ error: 'Ancien mot de passe incorrect' }, { status: 400 });
    const hash = await bcrypt.hash(nouveau_mdp, 12);
    await supabaseAdmin.from('comptes_partenaires').update({ mot_de_passe_hash: hash }).eq('id', partenaire.id);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
