import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

// GET — liste tous les messages (admin)
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const statut = searchParams.get('statut');

    let query = supabaseAdmin
      .from('messages_entreprises')
      .select('*, comptes_structures(id, nom_contact, email, badge_verifie, photo_profil)')
      .order('created_at', { ascending: false });

    if (statut && statut !== 'tous') {
      query = query.eq('statut', statut);
    }

    const { data: messages, error } = await query;
    if (error) throw error;

    return NextResponse.json({ messages });
  } catch (error) {
    console.error('Erreur GET admin messages:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// POST — admin initie un message vers une société (avec fichier optionnel)
export async function POST(request) {
  try {
    const contentType = request.headers.get('content-type') || '';
    let compte_id, sujet, contenu, traite_par = null;
    let fichierUrl = null, fichierNom = null, fichierTaille = null;

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      compte_id = formData.get('compte_id');
      sujet = formData.get('sujet');
      contenu = formData.get('contenu');
      traite_par = formData.get('traite_par') || null;
      const fichier = formData.get('fichier');

      if (fichier && fichier instanceof File && fichier.size > 0) {
        if (fichier.size > 5 * 1024 * 1024) {
          return NextResponse.json({ error: 'Fichier trop volumineux (max 5 Mo)' }, { status: 400 });
        }
        const ext = fichier.name.split('.').pop();
        const storagePath = `admin/${compte_id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
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
      ({ compte_id, sujet, contenu, traite_par } = body);
    }

    if (!compte_id) return NextResponse.json({ error: 'compte_id requis' }, { status: 400 });
    if (!sujet?.trim()) return NextResponse.json({ error: 'Le sujet est requis' }, { status: 400 });
    if (!contenu?.trim()) return NextResponse.json({ error: 'Le contenu est requis' }, { status: 400 });

    const { data: message, error: insertError } = await supabaseAdmin
      .from('messages_entreprises')
      .insert({
        compte_id,
        sujet: sujet.trim(),
        contenu: contenu.trim(),
        statut: 'repondu',
        de_admin: true,
        traite_par: traite_par || null,
        fichier_url: fichierUrl,
        fichier_nom: fichierNom,
        fichier_taille: fichierTaille,
      })
      .select('*, comptes_structures(id, nom_contact, email, badge_verifie, photo_profil)')
      .single();

    if (insertError) throw insertError;

    return NextResponse.json({ success: true, message }, { status: 201 });
  } catch (error) {
    console.error('POST admin messages:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
