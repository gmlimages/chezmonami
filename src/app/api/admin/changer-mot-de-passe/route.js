import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { requireAdmin } from '@/lib/adminAuth';

export async function POST(request) {
  const admin = await requireAdmin(request);
  if (admin instanceof Response) return admin;
  try {
    const { ancienMdp, nouveauMdp } = await request.json();

    // Vérifier l'ancien mot de passe
    const { data: adminData, error: adminError } = await supabaseAdmin
      .from('admins')
      .select('mot_de_passe')
      .eq('id', admin.id)
      .single();

    if (adminError || !adminData) {
      return NextResponse.json({ error: 'Compte introuvable' }, { status: 404 });
    }

    if (ancienMdp !== adminData.mot_de_passe) {
      return NextResponse.json({ error: 'Mot de passe actuel incorrect' }, { status: 400 });
    }

    // Mettre à jour le mot de passe
    const { error: updateError } = await supabaseAdmin
      .from('admins')
      .update({ mot_de_passe: nouveauMdp, doit_changer_mdp: false })
      .eq('id', admin.id);

    if (updateError) throw updateError;

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
