import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

// PATCH — activer / désactiver un abonné
export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    const { actif } = await request.json();

    const { error } = await supabaseAdmin
      .from('newsletter_abonnes')
      .update({ actif: Boolean(actif) })
      .eq('id', id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
