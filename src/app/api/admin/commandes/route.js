import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { requireAdmin } from '@/lib/adminAuth';

export async function GET(request) {
  const admin = await requireAdmin(request);
  if (admin instanceof Response) return admin;
  try {
    const { searchParams } = new URL(request.url);
    const statut = searchParams.get('statut');

    let query = supabaseAdmin
      .from('commandes')
      .select('*')
      .order('created_at', { ascending: false });

    if (statut && statut !== 'tous') {
      query = query.eq('statut', statut);
    }

    const { data, error } = await query;
    if (error) throw error;
    return NextResponse.json({ commandes: data });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
