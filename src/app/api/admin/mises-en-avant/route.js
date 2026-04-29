import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { requireAdmin } from '@/lib/adminAuth';

export async function GET(request) {
  const admin = await requireAdmin(request);
  if (admin instanceof Response) return admin;
  try {
    const { data, error } = await supabaseAdmin
      .from('mises_en_avant')
      .select('*')
      .order('ordre', { ascending: true });
    if (error) throw error;
    return NextResponse.json({ mises_en_avant: data });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  const admin = await requireAdmin(request);
  if (admin instanceof Response) return admin;
  try {
    const body = await request.json();
    const { data, error } = await supabaseAdmin
      .from('mises_en_avant')
      .insert(body)
      .select()
      .single();
    if (error) throw error;
    return NextResponse.json({ mise_en_avant: data }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
