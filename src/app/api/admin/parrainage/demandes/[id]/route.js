// Lot Parrainage — Approuver / refuser une demande (admin)
// PATCH { action: 'approuver', validite_jours?: number } | { action: 'refuser', motif?: string }
//
// Approuver crée un code_parrainage. validite_jours = 0 ou null → illimité.
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { requireAdmin } from '@/lib/adminAuth';
import { logAdminAction } from '@/lib/auditLog';
import { sendEmail, baseTemplate, baseText } from '@/lib/email';
import { generateCodeParrainage, calculerExpiration } from '@/lib/parrainage';

async function genererCodeUnique() {
  for (let i = 0; i < 10; i++) {
    const code = generateCodeParrainage(8);
    const { data } = await supabaseAdmin
      .from('codes_parrainage')
      .select('id')
      .eq('code', code)
      .maybeSingle();
    if (!data) return code;
  }
  throw new Error('Impossible de générer un code unique');
}

export async function PATCH(request, { params }) {
  const admin = await requireAdmin(request);
  if (admin instanceof Response) return admin;
  try {
    const { id } = await params;
    const body = await request.json();
    const action = body.action;

    const { data: demande } = await supabaseAdmin
      .from('demandes_parrainage')
      .select(`
        id, compte_id, statut,
        comptes_structures!demandes_parrainage_compte_id_fkey (
          id, email, nom_contact,
          structures (nom)
        )
      `)
      .eq('id', id)
      .single();

    if (!demande) {
      return NextResponse.json({ error: 'Demande introuvable' }, { status: 404 });
    }
    if (demande.statut !== 'en_attente') {
      return NextResponse.json({ error: 'Demande déjà traitée' }, { status: 400 });
    }

    const compte = demande.comptes_structures;
    const nomSociete = compte?.structures?.nom || compte?.nom_contact || '';

    if (action === 'approuver') {
      const validiteJours = body.validite_jours ? parseInt(body.validite_jours, 10) : 0;
      if (!Number.isFinite(validiteJours) || validiteJours < 0 || validiteJours > 730) {
        return NextResponse.json({ error: 'Validité invalide (0-730 jours)' }, { status: 400 });
      }
      const code = await genererCodeUnique();
      const expiration = calculerExpiration({ days: validiteJours });

      const { data: codeRow, error: errC } = await supabaseAdmin
        .from('codes_parrainage')
        .insert({
          code,
          parrain_compte_id: demande.compte_id,
          demande_id: demande.id,
          cree_par: admin.id,
          date_expiration: expiration,
        })
        .select('*')
        .single();
      if (errC) throw errC;

      await supabaseAdmin
        .from('demandes_parrainage')
        .update({
          statut: 'approuvee',
          traite_par: admin.id,
          traite_at: new Date().toISOString(),
        })
        .eq('id', id);

      await logAdminAction({
        request, admin,
        action: 'parrainage.demande_approuver',
        cibleType: 'demande_parrainage',
        cibleId: id,
        details: { code, expiration, parrain_compte_id: demande.compte_id },
      });

      // Email au parrain
      if (compte?.email) {
        const expTxt = expiration
          ? `valable jusqu'au ${new Date(expiration).toLocaleDateString('fr-FR')}`
          : 'sans date d\'expiration';
        sendEmail({
          to: compte.email,
          subject: '🎉 Votre code de parrainage est prêt',
          html: baseTemplate({
            titre: 'Votre code de parrainage',
            emoji: '🎁',
            preheader: `Code : ${code}`,
            contenu: `
              <p>Bonjour <strong>${compte.nom_contact || ''}</strong>,</p>
              <p>Votre demande de code de parrainage pour <strong>${nomSociete}</strong> a été approuvée.</p>
              <p>Partagez ce code avec une entreprise que vous voulez parrainer. Lorsqu'elle s'inscrira et paiera son premier abonnement, vous gagnerez <strong>2 mois</strong> et elle bénéficiera <strong>+1 mois offert</strong>.</p>
              <p style="font-size:13px;color:#666;">Ce code est ${expTxt} et utilisable par <strong>un seul filleul</strong>.</p>
            `,
            highlight: `
              <div style="text-align:center; font-family: 'Courier New', monospace; font-size: 32px; letter-spacing: 4px; font-weight: bold; color: #2e7d32;">
                ${code}
              </div>
            `,
          }),
          text: baseText({
            titre: 'Votre code de parrainage',
            contenu: `Votre code : ${code}\n${expTxt}\nÀ partager avec un seul filleul.`,
          }),
          tag: 'parrainage_code_emis',
        }).catch(() => {});
      }

      return NextResponse.json({ code: codeRow });
    }

    if (action === 'refuser') {
      const motif = body.motif ? String(body.motif).trim().slice(0, 500) : null;
      await supabaseAdmin
        .from('demandes_parrainage')
        .update({
          statut: 'refusee',
          motif_refus: motif,
          traite_par: admin.id,
          traite_at: new Date().toISOString(),
        })
        .eq('id', id);

      await logAdminAction({
        request, admin,
        action: 'parrainage.demande_refuser',
        cibleType: 'demande_parrainage',
        cibleId: id,
        details: { motif },
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Action invalide' }, { status: 400 });
  } catch (err) {
    console.error('PATCH demande parrainage:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
