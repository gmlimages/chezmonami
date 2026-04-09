import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

// GET — compter les messages non traités pour le badge admin
export async function GET() {
  try {
    const { count, error } = await supabaseAdmin
      .from('messages_entreprises')
      .select('id', { count: 'exact', head: true })
      .eq('statut', 'nouveau')
      .eq('de_admin', false);

    if (error) throw error;

    return NextResponse.json({ nb_messages: count || 0 });
  } catch (error) {
    console.error('GET admin notifications:', error);
    return NextResponse.json({ nb_messages: 0 });
  }
}
