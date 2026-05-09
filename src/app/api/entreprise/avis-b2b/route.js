// Lot F — Avis B2B : un compte_structure laisse un avis sur une autre structure.
// POST /api/entreprise/avis-b2b   — créer/mettre à jour son avis sur une structure cible
// GET  /api/entreprise/avis-b2b   — lister mes avis émis (auteur)
import { NextResponse } from 'next/server';
import { supabaseAdmin, getCompteFromToken } from '@/lib/supabaseAdmin';

const NOTE_MIN = 1;
const NOTE_MAX = 5;
const COMMENTAIRE_MAX = 2000;

export async function GET(request) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    const compte = await getCompteFromToken(token);
    if (!compte) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    const { data, error } = await supabaseAdmin
      .from('avis_b2b')
      .select('id, structure_id, note, commentaire, statut, motif_rejet, created_at, updated_at, structures(id, nom)')
      .eq('auteur_compte_id', compte.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json({ avis: data || [] });
  } catch (err) {
    console.error('GET avis-b2b error:', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    const compte = await getCompteFromToken(token);
    if (!compte) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    if (compte.statut !== 'actif') {
      return NextResponse.json({ error: 'Compte inactif — impossible de laisser un avis' }, { status: 403 });
    }

    const body = await request.json();
    const { structure_id, note, commentaire } = body || {};

    if (!structure_id) {
      return NextResponse.json({ error: 'structure_id requis' }, { status: 400 });
    }
    const noteInt = Number(note);
    if (!Number.isInteger(noteInt) || noteInt < NOTE_MIN || noteInt > NOTE_MAX) {
      return NextResponse.json({ error: `Note invalide (${NOTE_MIN}-${NOTE_MAX})` }, { status: 400 });
    }
    const txt = (commentaire || '').trim();
    if (txt.length > COMMENTAIRE_MAX) {
      return NextResponse.json({ error: `Commentaire trop long (max ${COMMENTAIRE_MAX})` }, { status: 400 });
    }

    // Empêcher l'auto-avis sur sa propre structure
    if (compte.structure_id && compte.structure_id === structure_id) {
      return NextResponse.json({ error: 'Vous ne pouvez pas laisser un avis sur votre propre fiche' }, { status: 400 });
    }

    // Vérifier que la structure cible existe
    const { data: cible } = await supabaseAdmin
      .from('structures')
      .select('id')
      .eq('id', structure_id)
      .maybeSingle();
    if (!cible) {
      return NextResponse.json({ error: 'Structure introuvable' }, { status: 404 });
    }

    // Upsert (un avis par auteur/structure ; tout changement repasse en "en_attente")
    const { data, error } = await supabaseAdmin
      .from('avis_b2b')
      .upsert(
        {
          structure_id,
          auteur_compte_id: compte.id,
          note: noteInt,
          commentaire: txt || null,
          statut: 'en_attente',
          motif_rejet: null,
          modere_par: null,
          modere_at: null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'structure_id,auteur_compte_id' }
      )
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, avis: data });
  } catch (err) {
    console.error('POST avis-b2b error:', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
