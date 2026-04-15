import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { requireAdmin } from '@/lib/adminAuth';

// GET — lister toutes les demandes de contact inter-entreprises
export async function GET(request) {
  const admin = await requireAdmin(request);
  if (admin instanceof Response) return admin;
  try {
    const { data, error } = await supabaseAdmin
      .from('demandes_contact')
      .select(`
        *,
        demandeur:demandeur_id(id, nom_contact, email, badge_verifie, structures(id, nom)),
        destinataire:destinataire_id(id, nom_contact, email, badge_verifie, structures(id, nom)),
        conversation:conversations_b2b(id, active)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ demandes: data || [] });
  } catch (error) {
    console.error('GET contacts admin error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
