import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { requireAdmin } from '@/lib/adminAuth';

export async function GET(request) {
  const admin = await requireAdmin(request);
  if (admin instanceof Response) return admin;
  try {
    const { data, error } = await supabaseAdmin
      .from('admins')
      .select('id, nom, email, role, doit_changer_mdp, date_creation, derniere_connexion')
      .order('date_creation', { ascending: false });
    if (error) throw error;
    return NextResponse.json({ admins: data });
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
      .from('admins')
      .insert({ ...body, doit_changer_mdp: true })
      .select('id, nom, email, role, doit_changer_mdp, date_creation')
      .single();
    if (error) throw error;
    return NextResponse.json({ admin: data }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
