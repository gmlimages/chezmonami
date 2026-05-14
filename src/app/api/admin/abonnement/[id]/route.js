import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { requireAdmin } from '@/lib/adminAuth';
import { logAdminAction } from '@/lib/auditLog';
import { appliquerRecompenses, estAbonnementPayant } from '@/lib/parrainage';
import { creerCommissionSiEligible } from '@/lib/partenaires';
import { sendEmail, baseTemplate, baseText } from '@/lib/email';

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

    // ── Parrainage : si ce compte est filleul d'un parrainage en_attente
    //    et que son abonnement vient de devenir payant → on applique les récompenses.
    let parrainage_applique = null;
    if (estAbonnementPayant(data.abonnement)) {
      const { data: parr } = await supabaseAdmin
        .from('parrainages')
        .select('id')
        .eq('filleul_compte_id', id)
        .eq('statut', 'en_attente')
        .maybeSingle();

      if (parr) {
        const r = await appliquerRecompenses(parr.id);
        if (r.applied) {
          parrainage_applique = r;

          // Audit log
          await logAdminAction({
            request, admin,
            action: 'parrainage.recompenses_appliquer',
            cibleType: 'parrainage',
            cibleId: parr.id,
            details: {
              parrain_compte_id: r.parrain.id,
              filleul_compte_id: r.filleul.id,
              parrain_new_fin: r.parrain_new_fin,
              filleul_new_fin: r.filleul_new_fin,
            },
          });

          // Emails parrain + filleul (best-effort)
          if (r.parrain?.email) {
            const finFmt = new Date(r.parrain_new_fin).toLocaleDateString('fr-FR');
            sendEmail({
              to: r.parrain.email,
              subject: '🎉 Vos 2 mois de parrainage sont crédités',
              html: baseTemplate({
                titre: 'Récompense de parrainage',
                emoji: '🎁',
                preheader: '+2 mois ajoutés à votre abonnement',
                contenu: `
                  <p>Bonjour <strong>${r.parrain.nom_contact || ''}</strong>,</p>
                  <p>Bonne nouvelle : votre filleul <strong>${r.filleul.nom_contact || r.filleul.email}</strong> vient de payer son abonnement.</p>
                  <p>En guise de remerciement, <strong>2 mois</strong> viennent d'être ajoutés à votre abonnement ChezMonAmi.</p>
                  <p style="font-size:14px;color:#444;">Nouvelle date de fin d'abonnement : <strong>${finFmt}</strong></p>
                `,
              }),
              text: baseText({
                titre: 'Récompense de parrainage',
                contenu: `+2 mois ajoutés à votre abonnement.\nNouvelle date de fin : ${finFmt}.`,
              }),
              tag: 'parrainage_recompense_parrain',
            }).catch(() => {});
          }
          if (r.filleul?.email) {
            const finFmt = new Date(r.filleul_new_fin).toLocaleDateString('fr-FR');
            sendEmail({
              to: r.filleul.email,
              subject: '🎁 Votre mois offert de parrainage est crédité',
              html: baseTemplate({
                titre: '+1 mois offert',
                emoji: '🎁',
                preheader: '+1 mois ajouté à votre abonnement',
                contenu: `
                  <p>Bonjour <strong>${r.filleul.nom_contact || ''}</strong>,</p>
                  <p>Merci pour votre confiance. Comme vous avez utilisé un code de parrainage, <strong>1 mois supplémentaire</strong> vient d'être ajouté à votre abonnement.</p>
                  <p style="font-size:14px;color:#444;">Nouvelle date de fin d'abonnement : <strong>${finFmt}</strong></p>
                `,
              }),
              text: baseText({
                titre: '+1 mois offert',
                contenu: `+1 mois ajouté.\nNouvelle date de fin : ${finFmt}.`,
              }),
              tag: 'parrainage_recompense_filleul',
            }).catch(() => {});
          }
        }
      }
    }

    // ── Partenaires : bonus filleul (1ère fois) + commission auto ──────────────
    let commission_creee = null;
    let bonus_partenaire_applique = false;
    if (estAbonnementPayant(data.abonnement)) {
      // 1) Bonus filleul (mois offerts) — appliqué une seule fois au premier paiement
      const { data: filleulPart } = await supabaseAdmin
        .from('comptes_structures')
        .select('id, partenaire_id, code_partenaire_id, bonus_filleul_partenaire_at, date_fin_abonnement')
        .eq('id', id)
        .single();

      if (filleulPart?.partenaire_id && filleulPart.code_partenaire_id && !filleulPart.bonus_filleul_partenaire_at) {
        const { data: codeP } = await supabaseAdmin
          .from('codes_partenaires')
          .select('mois_filleul')
          .eq('id', filleulPart.code_partenaire_id)
          .single();
        const moisBonus = Number(codeP?.mois_filleul) || 0;
        if (moisBonus > 0 && filleulPart.date_fin_abonnement) {
          const nouvelleFin = new Date(filleulPart.date_fin_abonnement);
          nouvelleFin.setMonth(nouvelleFin.getMonth() + moisBonus);
          await supabaseAdmin
            .from('comptes_structures')
            .update({
              date_fin_abonnement: nouvelleFin.toISOString(),
              bonus_filleul_partenaire_at: new Date().toISOString(),
            })
            .eq('id', id);
          data.date_fin_abonnement = nouvelleFin.toISOString();
          bonus_partenaire_applique = true;
        } else if (moisBonus === 0) {
          // Pas de bonus mais on marque pour ne pas re-vérifier à chaque paiement
          await supabaseAdmin
            .from('comptes_structures')
            .update({ bonus_filleul_partenaire_at: new Date().toISOString() })
            .eq('id', id);
        }
      }

      // 2) Création de la commission (idempotente sur date_paiement_filleul)
      if (data.montant_paiement && data.date_paiement) {
        try {
          const r = await creerCommissionSiEligible({
            filleul_compte_id: id,
            montant_mad: Number(data.montant_paiement) || 0,
            abonnement_type: data.abonnement,
            date_paiement: data.date_paiement,
          });
          if (r.created) {
            commission_creee = r.commission;
            await logAdminAction({
              request, admin,
              action: 'partenaire.commission_creee_auto',
              cibleType: 'commission',
              cibleId: r.commission.id,
              details: { filleul_compte_id: id, montant: r.commission.montant_commission_mad },
            });
            // Notifie le partenaire
            const { data: part } = await supabaseAdmin
              .from('comptes_partenaires')
              .select('email, nom_complet')
              .eq('id', r.commission.partenaire_id)
              .single();
            if (part?.email) {
              sendEmail({
                to: part.email,
                subject: '💰 Nouvelle commission générée',
                tag: 'commission_creee',
                html: baseTemplate({
                  titre: 'Nouvelle commission',
                  contenu: `
                    <p>Bonjour ${part.nom_complet},</p>
                    <p>Une nouvelle commission de <strong>${Number(r.commission.montant_commission_mad).toFixed(2)} MAD</strong> a été générée suite au paiement d'un filleul.</p>
                  `,
                  ctaTexte: 'Voir mes commissions',
                  ctaLien: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://chezmonami.ma'}/partenaire/dashboard/commissions`,
                }),
              }).catch(() => {});
            }
          }
        } catch (e) {
          console.error('commission auto error:', e);
        }
      }
    }

    return NextResponse.json({
      success: true,
      compte: data,
      parrainage_applique: !!parrainage_applique,
      commission_creee: !!commission_creee,
      bonus_partenaire_applique,
    });
  } catch (error) {
    console.error('PATCH abonnement error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
