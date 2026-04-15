import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { requireAdmin } from '@/lib/adminAuth';

// PATCH — valider ou refuser un document (admin)
export async function PATCH(request, { params }) {
  const admin = await requireAdmin(request);
  if (admin instanceof Response) return admin;
  try {
    const { id } = await params;
    const { statut, commentaire_admin, nom_admin } = await request.json();

    if (!['valide', 'refuse', 'en_attente'].includes(statut)) {
      return NextResponse.json({ error: 'Statut invalide' }, { status: 400 });
    }

    // 1. Mettre à jour le document
    const { error: updateError } = await supabaseAdmin
      .from('documents_entreprises')
      .update({
        statut,
        commentaire_admin: commentaire_admin?.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (updateError) throw updateError;

    // 2. Récupérer le document mis à jour
    const { data: doc, error: selectError } = await supabaseAdmin
      .from('documents_entreprises')
      .select('*')
      .eq('id', id)
      .single();

    if (selectError) throw selectError;

    // 3. Récupérer le compte associé séparément
    const { data: compte } = await supabaseAdmin
      .from('comptes_structures')
      .select('id, nom_contact, badge_verifie')
      .eq('id', doc.compte_id)
      .single();

    // 4. Notification en message pour la société
    if (compte && (statut === 'valide' || statut === 'refuse')) {
      const typeLabel = {
        registre_commerce: 'Registre de commerce',
        statuts_societe: 'Statuts de la société',
        identite_dirigeant: 'Pièce d\'identité du dirigeant',
        autre: 'Document',
      }[doc.type_document] || 'Document';

      const sujetMsg = statut === 'valide'
        ? `✅ Document validé : ${typeLabel}`
        : `❌ Document refusé : ${typeLabel}`;

      const contenuMsg = statut === 'valide'
        ? `Votre document "${typeLabel}" a été vérifié et validé par notre équipe.${commentaire_admin ? `\n\nNote : ${commentaire_admin}` : ''}\n\nMerci pour votre confiance.`
        : `Votre document "${typeLabel}" n'a pas pu être validé.${commentaire_admin ? `\n\nMotif : ${commentaire_admin}` : ''}\n\nVeuillez soumettre un nouveau document conforme.`;

      try {
        await supabaseAdmin.from('messages_entreprises').insert({
          compte_id: compte.id,
          sujet: sujetMsg,
          contenu: contenuMsg,
          statut: 'repondu',
          de_admin: true,
          lu_par_entreprise: false,
          traite_par: nom_admin || 'Administration',
        });
      } catch (msgErr) {
        console.warn('Notification message non envoyée:', msgErr?.message);
      }
    }

    // 5. Si tous les documents obligatoires sont validés → activer le badge vérifié
    if (statut === 'valide' && compte) {
      const { data: tousDoc } = await supabaseAdmin
        .from('documents_entreprises')
        .select('type_document, statut')
        .eq('compte_id', compte.id);

      const obligatoires = ['registre_commerce', 'statuts_societe', 'identite_dirigeant'];
      const tousValides = obligatoires.every((t) =>
        (tousDoc || []).some((d) => d.type_document === t && d.statut === 'valide')
      );

      if (tousValides && !compte.badge_verifie) {
        await supabaseAdmin
          .from('comptes_structures')
          .update({ badge_verifie: true })
          .eq('id', compte.id);

        // Notification badge vérifié
        try {
          await supabaseAdmin.from('messages_entreprises').insert({
            compte_id: compte.id,
            sujet: '🏅 Badge vérifié obtenu !',
            contenu: 'Félicitations ! Tous vos documents obligatoires ont été validés. Votre compte affiche désormais le badge "Vérifié" ✅ qui renforce votre crédibilité sur la plateforme.',
            statut: 'repondu',
            de_admin: true,
            lu_par_entreprise: false,
            traite_par: nom_admin || 'Administration',
          });
        } catch (badgeErr) {
          console.warn('Notification badge non envoyée:', badgeErr?.message);
        }
      }
    }

    return NextResponse.json({ success: true, document: doc });
  } catch (error) {
    console.error('PATCH document admin error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
