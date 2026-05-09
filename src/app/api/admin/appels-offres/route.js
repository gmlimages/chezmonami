import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { requireAdmin } from '@/lib/adminAuth';
import { logAdminAction } from '@/lib/auditLog';

const MAX_FICHIER = 5 * 1024 * 1024; // 5 Mo
const MAX_FICHIERS = 5;

// POST — créer un appel d'offres avec fichiers joints (multipart/form-data)
export async function POST(request) {
  const admin = await requireAdmin(request);
  if (admin instanceof Response) return admin;
  try {
    const contentType = request.headers.get('content-type') || '';
    let payload = {};
    let fichiers = [];

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();

      // Champs texte
      payload = {
        titre: formData.get('titre'),
        description: formData.get('description'),
        description_longue: formData.get('description_longue') || null,
        type: formData.get('type') || 'appel_offres',
        categorie_id: formData.get('categorie_id') || null,
        pays_id: formData.get('pays_id') || null,
        ville_id: formData.get('ville_id') || null,
        international: formData.get('international') === 'true',
        date_limite: formData.get('date_limite'),
        statut: formData.get('statut') || 'actif',
        cree_par: formData.get('cree_par') || null,
      };

      // Fichiers joints
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
        const path = `offres/temp/${safeName}`;

        const buffer = await file.arrayBuffer();
        const { error: uploadErr } = await supabaseAdmin.storage
          .from('images')
          .upload(path, buffer, { contentType: file.type, upsert: false });

        if (uploadErr) throw new Error(`Upload échoué : ${uploadErr.message}`);

        fichiers.push({ nom: file.name, path, taille: file.size });
      }
    } else {
      payload = await request.json();
    }

    if (!payload.titre?.trim() || !payload.description?.trim() || !payload.date_limite) {
      return NextResponse.json({ error: 'Titre, description et date limite sont obligatoires' }, { status: 400 });
    }

    // Insérer en base
    const { data: appel, error } = await supabaseAdmin
      .from('appels_offres')
      .insert([{
        ...payload,
        titre: payload.titre.trim(),
        description: payload.description.trim(),
        description_longue: payload.description_longue?.trim() || null,
        fichiers,
      }])
      .select()
      .single();

    if (error) throw error;

    // Renommer les fichiers avec l'ID réel de l'appel
    if (fichiers.length > 0) {
      const fichiersFinaux = [];
      for (const f of fichiers) {
        const newPath = f.path.replace('offres/temp/', `offres/${appel.id}/`);
        await supabaseAdmin.storage.from('images').move(f.path, newPath).catch(() => {});
        fichiersFinaux.push({ ...f, path: newPath });
      }
      await supabaseAdmin
        .from('appels_offres')
        .update({ fichiers: fichiersFinaux })
        .eq('id', appel.id);
      appel.fichiers = fichiersFinaux;
    }

    await logAdminAction({
      request,
      admin,
      action: 'appel_offre.creer',
      cibleType: 'appel_offre',
      cibleId: appel.id,
      details: { titre: appel.titre, type: appel.type, fichiers: fichiers.length },
    });

    return NextResponse.json({ success: true, appel });
  } catch (err) {
    console.error('POST appels-offres admin error:', err);
    return NextResponse.json({ error: err.message || 'Erreur serveur' }, { status: 500 });
  }
}
