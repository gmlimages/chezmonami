import { NextResponse } from 'next/server';
import { supabaseAdmin, getCompteFromToken } from '@/lib/supabaseAdmin';
import { sendEmail, baseTemplate, baseText } from '@/lib/email';

// POST — soumettre une réclamation de structure
export async function POST(request) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    const compte = await getCompteFromToken(token);
    if (!compte) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    if (compte.structure_id) {
      return NextResponse.json({ error: 'Votre compte est déjà lié à une structure' }, { status: 400 });
    }

    const { structure_id, message } = await request.json();

    if (!structure_id) {
      return NextResponse.json({ error: 'Structure requise' }, { status: 400 });
    }

    // Vérifier que la structure existe
    const { data: structure } = await supabaseAdmin
      .from('structures')
      .select('id, nom')
      .eq('id', structure_id)
      .single();

    if (!structure) {
      return NextResponse.json({ error: 'Structure introuvable' }, { status: 404 });
    }

    // Vérifier qu'il n'y a pas déjà une réclamation en attente pour cette structure
    const { data: existing } = await supabaseAdmin
      .from('reclamations')
      .select('id, statut')
      .eq('structure_id', structure_id)
      .eq('statut', 'en_attente')
      .maybeSingle();

    if (existing) {
      return NextResponse.json({
        error: 'Une réclamation est déjà en cours pour cette structure'
      }, { status: 409 });
    }

    // Vérifier que cette structure n'est pas déjà liée à un compte
    const { data: dejaLiee } = await supabaseAdmin
      .from('comptes_structures')
      .select('id')
      .eq('structure_id', structure_id)
      .maybeSingle();

    if (dejaLiee) {
      return NextResponse.json({
        error: 'Cette structure est déjà liée à un autre compte'
      }, { status: 409 });
    }

    // Créer la réclamation
    const { data: reclamation, error } = await supabaseAdmin
      .from('reclamations')
      .insert({
        compte_id: compte.id,
        structure_id,
        message: message?.trim() || null,
        statut: 'en_attente',
      })
      .select()
      .single();

    if (error) throw error;

    // Notifier les admins
    await supabaseAdmin.from('notifications_admin').insert({
      admin_id: null,
      type: 'nouvelle_reclamation',
      titre: `Réclamation : ${structure.nom}`,
      contenu: `${compte.nom_contact} réclame la fiche "${structure.nom}"`,
      lien: '/admin/comptes-entreprises',
      reference_type: 'reclamation',
      reference_id: reclamation.id,
    });

    // Email d'accusé de réception au demandeur
    if (compte.email) {
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://chezmonami.ma';
      const titre = 'Réclamation reçue';
      const contenu = `
        <p>Bonjour <strong>${compte.nom_contact}</strong>,</p>
        <p>Nous avons bien reçu votre réclamation concernant la fiche <strong>${structure.nom}</strong>.</p>
        <p>Notre équipe l'examinera et vous tiendra informé(e) sous quelques jours ouvrés.</p>
      `;
      await sendEmail({
        to: compte.email,
        subject: `📄 Votre réclamation sur "${structure.nom}" a été reçue`,
        html: baseTemplate({
          titre,
          emoji: '📄',
          preheader: 'Nous avons bien reçu votre réclamation',
          contenu,
          ctaTexte: 'Voir mon espace',
          ctaLien: `${siteUrl}/entreprise/dashboard`,
        }),
        text: baseText({
          titre,
          contenu: `Nous avons bien reçu votre réclamation concernant ${structure.nom}.`,
        }),
        tag: 'reclamation_accuse',
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Réclamation soumise. L\'administration examinera votre demande.',
      reclamation,
    }, { status: 201 });

  } catch (error) {
    console.error('Erreur réclamation:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// GET — statut de la réclamation en cours
export async function GET(request) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    const compte = await getCompteFromToken(token);
    if (!compte) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    const { data: reclamation } = await supabaseAdmin
      .from('reclamations')
      .select('*, structures(id, nom, categorie_id)')
      .eq('compte_id', compte.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    return NextResponse.json({ reclamation: reclamation || null });
  } catch (error) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
