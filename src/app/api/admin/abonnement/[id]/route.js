import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { requireAdmin } from '@/lib/adminAuth';

// Durées en mois selon le type
const DUREES = {
  mensuel: 1,
  trimestriel: 3,
  semestriel: 6,
  annuel: 12,
};

export async function PATCH(request, { params }) {
  const admin = await requireAdmin(request);
  if (admin instanceof Response) return admin;
  try {
    const { id } = await params;
    const body = await request.json();
    const { abonnement, montant_paiement, date_paiement, date_fin_abonnement, notes_abonnement } = body;

    const types_valides = ['gratuit', 'mensuel', 'trimestriel', 'semestriel', 'annuel'];
    if (abonnement && !types_valides.includes(abonnement)) {
      return NextResponse.json({ error: 'Type d\'abonnement invalide' }, { status: 400 });
    }

    const updates = { updated_at: new Date().toISOString() };

    if (abonnement !== undefined) updates.abonnement = abonnement;
    if (notes_abonnement !== undefined) updates.notes_abonnement = notes_abonnement || null;

    // Si type payant : calculer/setter les dates
    if (abonnement && abonnement !== 'gratuit') {
      // Date de paiement : utiliser celle fournie ou aujourd'hui
      const datePaie = date_paiement ? new Date(date_paiement) : new Date();
      updates.date_paiement = datePaie.toISOString();
      updates.montant_paiement = montant_paiement ?? null;

      // Date de fin : utiliser celle fournie OU calculer depuis la durée
      if (date_fin_abonnement) {
        updates.date_fin_abonnement = new Date(date_fin_abonnement).toISOString();
      } else {
        const duree = DUREES[abonnement] ?? 1;
        const fin = new Date(datePaie);
        fin.setMonth(fin.getMonth() + duree);
        updates.date_fin_abonnement = fin.toISOString();
      }
    } else if (abonnement === 'gratuit') {
      // Gratuit : effacer les dates
      updates.date_paiement = null;
      updates.date_fin_abonnement = null;
      updates.montant_paiement = null;
    } else {
      // Mise à jour partielle (montant, dates seulement)
      if (montant_paiement !== undefined) updates.montant_paiement = montant_paiement ?? null;
      if (date_paiement !== undefined) updates.date_paiement = date_paiement ? new Date(date_paiement).toISOString() : null;
      if (date_fin_abonnement !== undefined) updates.date_fin_abonnement = date_fin_abonnement ? new Date(date_fin_abonnement).toISOString() : null;
    }

    const { data, error } = await supabaseAdmin
      .from('comptes_structures')
      .update(updates)
      .eq('id', id)
      .select('id, abonnement, date_paiement, date_fin_abonnement, montant_paiement, notes_abonnement')
      .single();

    if (error) throw error;
    if (!data) return NextResponse.json({ error: 'Compte introuvable' }, { status: 404 });

    return NextResponse.json({ success: true, compte: data });
  } catch (error) {
    console.error('PATCH abonnement error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
