import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

// POST — demande de mise en relation depuis la page publique d'une structure
export async function POST(request) {
  try {
    const body = await request.json();
    const { structure_id, nom_demandeur, email_demandeur, telephone_demandeur, message_demandeur, compte_demandeur_id } = body;

    if (!structure_id) return NextResponse.json({ error: 'Structure requise' }, { status: 400 });
    if (!nom_demandeur?.trim()) return NextResponse.json({ error: 'Votre nom est requis' }, { status: 400 });
    if (!email_demandeur?.trim()) return NextResponse.json({ error: 'Votre email est requis' }, { status: 400 });

    // Vérifier que la structure existe
    const { data: structure } = await supabaseAdmin
      .from('structures')
      .select('id, nom')
      .eq('id', structure_id)
      .single();

    if (!structure) return NextResponse.json({ error: 'Structure introuvable' }, { status: 404 });

    // Éviter les doublons : même email + même structure + statut en_attente
    const { data: existant } = await supabaseAdmin
      .from('demandes_mise_en_relation')
      .select('id')
      .eq('structure_id', structure_id)
      .eq('email_demandeur', email_demandeur.trim().toLowerCase())
      .eq('statut', 'en_attente')
      .maybeSingle();

    if (existant) {
      return NextResponse.json({ error: 'Une demande est déjà en cours pour cette structure avec cet email' }, { status: 409 });
    }

    const { data: demande, error: insertError } = await supabaseAdmin
      .from('demandes_mise_en_relation')
      .insert({
        structure_id,
        nom_demandeur: nom_demandeur.trim(),
        email_demandeur: email_demandeur.trim().toLowerCase(),
        telephone_demandeur: telephone_demandeur?.trim() || null,
        message_demandeur: message_demandeur?.trim() || null,
        compte_demandeur_id: compte_demandeur_id || null,
        statut: 'en_attente',
      })
      .select('id')
      .single();

    if (insertError) throw insertError;

    // Notifier les admins
    await supabaseAdmin.from('notifications_admin').insert({
      admin_id: null,
      type: 'demande_contact_structure',
      titre: `Demande de contact : ${structure.nom}`,
      contenu: `${nom_demandeur} souhaite entrer en contact avec ${structure.nom}`,
      lien: '/admin/messages',
      reference_type: 'demande_contact_structure',
      reference_id: demande.id,
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error('POST demandes-contact-structure:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
