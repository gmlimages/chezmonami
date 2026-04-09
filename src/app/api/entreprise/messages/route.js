import { NextResponse } from 'next/server';
import { supabaseAdmin, getCompteFromToken, hasFullAccess } from '@/lib/supabaseAdmin';

// GET — messages du compte connecté
export async function GET(request) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    const compte = await getCompteFromToken(token);
    if (!compte) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    const { data: messages, error } = await supabaseAdmin
      .from('messages_entreprises')
      .select('*')
      .eq('compte_id', compte.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ messages });
  } catch (error) {
    console.error('Erreur GET messages entreprise:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// POST — envoyer un message (supporte multipart/form-data pour les fichiers)
export async function POST(request) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    const compte = await getCompteFromToken(token);
    if (!compte) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    if (!hasFullAccess(compte)) {
      return NextResponse.json({ error: 'Abonnement requis', code: 'ABONNEMENT_REQUIS' }, { status: 403 });
    }

    const contentType = request.headers.get('content-type') || '';
    let sujet, contenu;
    let fichierUrl = null, fichierNom = null, fichierTaille = null;

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      sujet = formData.get('sujet');
      contenu = formData.get('contenu');
      const fichier = formData.get('fichier');

      if (fichier && fichier instanceof File && fichier.size > 0) {
        if (fichier.size > 5 * 1024 * 1024) {
          return NextResponse.json({ error: 'Fichier trop volumineux (max 5 Mo)' }, { status: 400 });
        }
        const ext = fichier.name.split('.').pop();
        const storagePath = `${compte.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const arrayBuffer = await fichier.arrayBuffer();
        const { error: uploadError } = await supabaseAdmin.storage
          .from('messages')
          .upload(storagePath, Buffer.from(arrayBuffer), { contentType: fichier.type });

        if (!uploadError) {
          fichierUrl = storagePath;
          fichierNom = fichier.name;
          fichierTaille = fichier.size;
        }
      }
    } else {
      const body = await request.json();
      sujet = body.sujet;
      contenu = body.contenu;
    }

    // Validation
    if (!sujet || typeof sujet !== 'string' || sujet.trim().length === 0) {
      return NextResponse.json({ error: 'Le sujet est requis' }, { status: 400 });
    }
    if (sujet.trim().length > 150) {
      return NextResponse.json({ error: 'Le sujet ne peut pas dépasser 150 caractères' }, { status: 400 });
    }
    if (!contenu || typeof contenu !== 'string' || contenu.trim().length === 0) {
      return NextResponse.json({ error: 'Le contenu est requis' }, { status: 400 });
    }
    if (contenu.trim().length > 3000) {
      return NextResponse.json({ error: 'Le contenu ne peut pas dépasser 3000 caractères' }, { status: 400 });
    }

    const { data: message, error: insertError } = await supabaseAdmin
      .from('messages_entreprises')
      .insert({
        compte_id: compte.id,
        sujet: sujet.trim(),
        contenu: contenu.trim(),
        statut: 'nouveau',
        fichier_url: fichierUrl,
        fichier_nom: fichierNom,
        fichier_taille: fichierTaille,
      })
      .select()
      .single();

    if (insertError) throw insertError;

    // Notifier les admins
    await supabaseAdmin.from('notifications_admin').insert({
      admin_id: null,
      type: 'nouveau_message',
      titre: `Message : ${compte.nom_contact}`,
      contenu: `${compte.nom_contact} a envoyé un message : "${sujet.trim()}"`,
      lien: '/admin/messages',
      reference_type: 'message',
      reference_id: message.id,
    });

    return NextResponse.json({ success: true, message }, { status: 201 });
  } catch (error) {
    console.error('Erreur POST message entreprise:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
