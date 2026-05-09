import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { requireAdmin } from '@/lib/adminAuth';

// DELETE /api/admin/appels-offres/reponses/[id]
// Supprime une réponse + ses fichiers du storage
export async function DELETE(request, { params }) {
  const admin = await requireAdmin(request);
  if (admin instanceof Response) return admin;
  try {
    const { id } = await params;

    // 1. Récupérer les fichiers de la réponse
    const { data: reponse } = await supabaseAdmin
      .from('reponses_appels_offres')
      .select('fichiers')
      .eq('id', id)
      .single();

    // 2. Supprimer les fichiers du storage
    const paths = (reponse?.fichiers || [])
      .filter(f => f?.path)
      .map(f => f.path);

    if (paths.length > 0) {
      await supabaseAdmin.storage.from('images').remove(paths).catch(() => {});
    }

    // 3. Supprimer la réponse
    const { error } = await supabaseAdmin
      .from('reponses_appels_offres')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('DELETE reponse appel offres error:', err);
    return NextResponse.json({ error: err.message || 'Erreur serveur' }, { status: 500 });
  }
}
