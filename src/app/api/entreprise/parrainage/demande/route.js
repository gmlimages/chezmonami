// Lot Parrainage — Demande de code par une entreprise
// POST { message?: string } → crée une demande_parrainage en_attente
//
// L'index unique partiel sur (compte_id) WHERE statut='en_attente' empêche
// d'avoir deux demandes en attente simultanées pour le même compte.
import { NextResponse } from 'next/server';
import { supabaseAdmin, getCompteFromToken, isImpersonating } from '@/lib/supabaseAdmin';

function getToken(request) {
  const auth = request.headers.get('authorization') || '';
  return auth.startsWith('Bearer ') ? auth.slice(7) : null;
}

export async function POST(request) {
  const compte = await getCompteFromToken(getToken(request));
  if (!compte) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  if (isImpersonating(compte)) {
    return NextResponse.json({ error: 'Action non autorisée en mode impersonation' }, { status: 403 });
  }

  // Vérifier que le programme est actif
  const { data: params } = await supabaseAdmin
    .from('parametres_parrainage')
    .select('affichage_actif')
    .eq('id', 1)
    .single();
  if (!params?.affichage_actif) {
    return NextResponse.json({ error: 'Le programme de parrainage n\'est pas actif' }, { status: 400 });
  }

  const body = await request.json().catch(() => ({}));
  const message = body.message ? String(body.message).trim().slice(0, 500) : null;

  const { data, error } = await supabaseAdmin
    .from('demandes_parrainage')
    .insert({
      compte_id: compte.id,
      message_demandeur: message,
    })
    .select('*')
    .single();

  if (error) {
    // Probablement violation de l'index unique partiel
    if (error.code === '23505') {
      return NextResponse.json(
        { error: 'Vous avez déjà une demande en cours. Patientez le temps qu\'elle soit traitée.' },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ demande: data }, { status: 201 });
}
