import { NextResponse } from 'next/server';
import { supabaseAdmin, getCompteFromToken, hasFullAccess } from '@/lib/supabaseAdmin';

// GET — lister les demandes de contact (envoyées et reçues)
export async function GET(request) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    const compte = await getCompteFromToken(token);
    if (!compte) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    // Demandes envoyées
    const { data: envoyees } = await supabaseAdmin
      .from('demandes_contact')
      .select(`
        *,
        destinataire:destinataire_id(id, nom_contact, structures(id, nom, categorie_id)),
        conversation:conversations_b2b(id)
      `)
      .eq('demandeur_id', compte.id)
      .order('created_at', { ascending: false });

    // Demandes reçues
    const { data: recues } = await supabaseAdmin
      .from('demandes_contact')
      .select(`
        *,
        demandeur:demandeur_id(id, nom_contact, structures(id, nom, categorie_id)),
        conversation:conversations_b2b(id)
      `)
      .eq('destinataire_id', compte.id)
      .order('created_at', { ascending: false });

    return NextResponse.json({ envoyees: envoyees || [], recues: recues || [] });
  } catch (error) {
    console.error('GET contacts error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// POST — envoyer une demande de contact à une autre société
export async function POST(request) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    const compte = await getCompteFromToken(token);
    if (!compte) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    // Nécessite un abonnement actif
    if (!hasFullAccess(compte)) {
      return NextResponse.json(
        { error: 'Abonnement requis pour contacter d\'autres entreprises', code: 'ABONNEMENT_REQUIS' },
        { status: 403 }
      );
    }

    const { destinataire_id, message_demande } = await request.json();

    if (!destinataire_id) {
      return NextResponse.json({ error: 'Destinataire requis' }, { status: 400 });
    }
    if (destinataire_id === compte.id) {
      return NextResponse.json({ error: 'Vous ne pouvez pas vous contacter vous-même' }, { status: 400 });
    }

    // Vérifier que le destinataire existe et est actif
    const { data: destinataire } = await supabaseAdmin
      .from('comptes_structures')
      .select('id, nom_contact, statut')
      .eq('id', destinataire_id)
      .eq('statut', 'actif')
      .single();

    if (!destinataire) {
      return NextResponse.json({ error: 'Entreprise introuvable ou inactive' }, { status: 404 });
    }

    // Vérifier qu'il n'existe pas déjà une demande entre ces deux sociétés
    const { data: existante } = await supabaseAdmin
      .from('demandes_contact')
      .select('id, statut')
      .or(
        `and(demandeur_id.eq.${compte.id},destinataire_id.eq.${destinataire_id}),and(demandeur_id.eq.${destinataire_id},destinataire_id.eq.${compte.id})`
      )
      .not('statut', 'eq', 'refusee')
      .maybeSingle();

    if (existante) {
      const msgMap = {
        en_attente: 'Une demande est déjà en cours de traitement',
        approuvee: 'Vous êtes déjà en contact avec cette entreprise',
      };
      return NextResponse.json(
        { error: msgMap[existante.statut] || 'Demande déjà existante' },
        { status: 409 }
      );
    }

    // Créer la demande
    const { data: demande, error } = await supabaseAdmin
      .from('demandes_contact')
      .insert({
        demandeur_id: compte.id,
        destinataire_id,
        message_demande: message_demande?.trim() || null,
        statut: 'en_attente',
      })
      .select()
      .single();

    if (error) throw error;

    // Notifier l'admin
    await supabaseAdmin.from('notifications_admin').insert({
      admin_id: null,
      type: 'demande_contact',
      titre: `Demande de contact inter-entreprises`,
      contenu: `${compte.nom_contact} souhaite contacter ${destinataire.nom_contact}`,
      lien: '/admin/contacts-entreprises',
      reference_type: 'demande_contact',
      reference_id: demande.id,
    }).catch(() => {});

    return NextResponse.json({ success: true, demande }, { status: 201 });
  } catch (error) {
    console.error('POST contacts error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
