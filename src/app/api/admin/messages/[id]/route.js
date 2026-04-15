import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { requireAdmin } from '@/lib/adminAuth';

// DELETE — supprimer un message (admin uniquement)
export async function DELETE(request, { params }) {
  const admin = await requireAdmin(request);
  if (admin instanceof Response) return admin;
  try {
    const { id } = await params;

    const { data: msg } = await supabaseAdmin
      .from('messages_entreprises')
      .select('id, fichier_url')
      .eq('id', id)
      .single();

    if (!msg) return NextResponse.json({ error: 'Message introuvable' }, { status: 404 });

    if (msg.fichier_url) {
      await supabaseAdmin.storage.from('messages').remove([msg.fichier_url]).catch(() => {});
    }

    const { error } = await supabaseAdmin.from('messages_entreprises').delete().eq('id', id);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE admin message:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// PATCH — marquer comme lu, répondre, ou mettre à jour traite_par
export async function PATCH(request, { params }) {
  const admin = await requireAdmin(request);
  if (admin instanceof Response) return admin;
  try {
    const { id } = await params;
    if (!id) return NextResponse.json({ error: 'Identifiant requis' }, { status: 400 });

    const body = await request.json();
    const { statut, reponse_admin, traite_par } = body;

    const { data: existing } = await supabaseAdmin
      .from('messages_entreprises')
      .select('id')
      .eq('id', id)
      .single();

    if (!existing) return NextResponse.json({ error: 'Message introuvable' }, { status: 404 });

    const updates = {};

    if (reponse_admin !== undefined && reponse_admin !== null && reponse_admin.trim().length > 0) {
      updates.statut = 'repondu';
      updates.reponse_admin = reponse_admin.trim();
      updates.date_reponse = new Date().toISOString();
      if (traite_par) updates.traite_par = traite_par;
    } else if (statut) {
      updates.statut = statut;
    } else {
      return NextResponse.json({ error: 'Aucune mise à jour fournie' }, { status: 400 });
    }

    const { data: message, error: updateError } = await supabaseAdmin
      .from('messages_entreprises')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (updateError) throw updateError;

    return NextResponse.json({ success: true, message });
  } catch (error) {
    console.error('Erreur PATCH admin message:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
