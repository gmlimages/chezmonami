import { NextResponse } from 'next/server';
import { supabaseAdmin, getCompteFromToken, hasFullAccess } from '@/lib/supabaseAdmin';

const MAX_FICHIER = 5 * 1024 * 1024; // 5 Mo
const MAX_FICHIERS = 5;

export async function POST(request, { params }) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    const compte = await getCompteFromToken(token);

    if (!compte) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    if (!hasFullAccess(compte)) {
      return NextResponse.json({ error: 'Abonnement requis', code: 'ABONNEMENT_REQUIS' }, { status: 403 });
    }

    if (compte.statut !== 'actif') {
      return NextResponse.json({
        error: 'Votre compte doit être validé par l\'administration avant de pouvoir répondre.',
      }, { status: 403 });
    }

    const { id: appelId } = await params;

    // Vérifier l'appel d'offres
    const { data: appel } = await supabaseAdmin
      .from('appels_offres')
      .select('id, titre, statut, date_limite')
      .eq('id', appelId)
      .single();

    if (!appel || appel.statut !== 'actif') {
      return NextResponse.json({ error: "Appel d'offres introuvable ou fermé" }, { status: 404 });
    }

    if (new Date(appel.date_limite) < new Date()) {
      return NextResponse.json({ error: 'La date limite est dépassée' }, { status: 400 });
    }

    let contenu = '';
    let fichiers = [];

    const contentType = request.headers.get('content-type') || '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      contenu = formData.get('contenu') || '';

      const fichierEntries = formData.getAll('fichiers');
      const fichiersValides = fichierEntries.filter(f => f instanceof File && f.size > 0);

      if (fichiersValides.length > MAX_FICHIERS) {
        return NextResponse.json({ error: `Maximum ${MAX_FICHIERS} fichiers autorisés` }, { status: 400 });
      }

      for (const file of fichiersValides) {
        if (file.size > MAX_FICHIER) {
          return NextResponse.json({ error: `Le fichier "${file.name}" dépasse 5 Mo` }, { status: 400 });
        }
        const ext = file.name.split('.').pop();
        const safeName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const path = `offres/reponses/${compte.id}/${appelId}/${safeName}`;
        const buffer = await file.arrayBuffer();
        const { error: uploadErr } = await supabaseAdmin.storage
          .from('images')
          .upload(path, buffer, { contentType: file.type, upsert: false });
        if (uploadErr) throw new Error(`Upload échoué : ${uploadErr.message}`);
        fichiers.push({ nom: file.name, path, taille: file.size });
      }
    } else {
      const body = await request.json();
      contenu = body.contenu || '';
    }

    if (!contenu.trim()) {
      return NextResponse.json({ error: 'Le contenu de la réponse est obligatoire' }, { status: 400 });
    }

    // Si une réponse existe déjà, conserver ses anciens fichiers + ajouter les nouveaux
    const { data: existante } = await supabaseAdmin
      .from('reponses_appels_offres')
      .select('id, fichiers')
      .eq('appel_offre_id', appelId)
      .eq('compte_id', compte.id)
      .maybeSingle();

    const fichiersMerges = [
      ...(existante?.fichiers || []),
      ...fichiers,
    ];

    // Upsert la réponse (une seule par société)
    const { data: reponse, error } = await supabaseAdmin
      .from('reponses_appels_offres')
      .upsert({
        appel_offre_id: appelId,
        compte_id: compte.id,
        contenu: contenu.trim(),
        fichiers: fichiersMerges,
        statut: 'soumise',
        updated_at: new Date().toISOString(),
      }, { onConflict: 'appel_offre_id,compte_id' })
      .select()
      .single();

    if (error) throw error;

    // Notification aux admins
    await supabaseAdmin.from('notifications_admin').insert({
      admin_id: null,
      type: 'nouveau_message',
      titre: `Nouvelle réponse : ${appel.titre}`,
      contenu: `${compte.nom_contact} a soumis une réponse à "${appel.titre}"`,
      lien: '/admin/appels-offres',
      reference_type: 'reponse',
      reference_id: reponse.id,
    });

    return NextResponse.json({ success: true, reponse });

  } catch (error) {
    console.error('Erreur soumission réponse:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function GET(request, { params }) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    const compte = await getCompteFromToken(token);
    if (!compte) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    const { id: appelId } = await params;

    const { data: reponse } = await supabaseAdmin
      .from('reponses_appels_offres')
      .select('*')
      .eq('appel_offre_id', appelId)
      .eq('compte_id', compte.id)
      .maybeSingle();

    return NextResponse.json({ reponse: reponse || null });
  } catch {
    return NextResponse.json({ reponse: null });
  }
}
