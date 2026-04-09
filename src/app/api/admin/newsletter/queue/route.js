// /api/admin/newsletter/queue/route.js
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

// GET — file d'attente newsletter
export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('newsletter_queue')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;
    return NextResponse.json({ queue: data || [] });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE — suppression d'un ou plusieurs éléments
export async function DELETE(request) {
  try {
    const { ids } = await request.json();
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'IDs manquants' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('newsletter_queue')
      .delete()
      .in('id', ids);

    if (error) throw error;
    return NextResponse.json({ success: true, deleted: ids.length });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}