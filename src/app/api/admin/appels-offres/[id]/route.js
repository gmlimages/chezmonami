import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { requireAdmin } from '@/lib/adminAuth';
import { logAdminAction } from '@/lib/auditLog';

// DELETE /api/admin/appels-offres/[id]
// Supprime un appel d'offres + tous ses fichiers (appel ET réponses) du storage
export async function DELETE(request, { params }) {
  const admin = await requireAdmin(request);
  if (admin instanceof Response) return admin;
  try {
    const { id } = await params;

    // 1. Récupérer les fichiers de l'appel
    const { data: appel } = await supabaseAdmin
      .from('appels_offres')
      .select('id, fichiers')
      .eq('id', id)
      .single();

    // 2. Récupérer les fichiers de toutes les réponses
    const { data: reponses } = await supabaseAdmin
      .from('reponses_appels_offres')
      .select('fichiers')
      .eq('appel_offre_id', id);

    // 3. Collecter tous les paths storage
    const paths = [];
    (appel?.fichiers || []).forEach(f => { if (f?.path) paths.push(f.path); });
    (reponses || []).forEach(r =>
      (r.fichiers || []).forEach(f => { if (f?.path) paths.push(f.path); })
    );

    // 4. Supprimer les fichiers du storage
    if (paths.length > 0) {
      await supabaseAdmin.storage.from('images').remove(paths).catch(() => {});
    }

    // 5. Supprimer les réponses (si pas de cascade FK)
    await supabaseAdmin
      .from('reponses_appels_offres')
      .delete()
      .eq('appel_offre_id', id)
      .catch(() => {});

    // 6. Supprimer l'appel
    const { error } = await supabaseAdmin
      .from('appels_offres')
      .delete()
      .eq('id', id);

    if (error) throw error;

    await logAdminAction({
      request,
      admin,
      action: 'appel_offre.supprimer',
      cibleType: 'appel_offre',
      cibleId: id,
      details: { fichiers_supprimes: paths.length },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('DELETE appel offres error:', err);
    return NextResponse.json({ error: err.message || 'Erreur serveur' }, { status: 500 });
  }
}
