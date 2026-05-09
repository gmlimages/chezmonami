// Gestion des comptes admin — réservé aux super_admin
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { requireAdmin } from '@/lib/adminAuth';
import { logAdminAction } from '@/lib/auditLog';
import bcrypt from 'bcryptjs';

export async function GET(request) {
  const admin = await requireAdmin(request);
  if (admin instanceof Response) return admin;
  try {
    const { data, error } = await supabaseAdmin
      .from('admins')
      .select('id, nom, email, role, doit_changer_mdp, date_creation, derniere_connexion, tentatives_connexion, bloque_jusqu_a, tfa_active')
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
  if (admin.role !== 'super_admin') {
    return NextResponse.json({ error: 'Réservé aux super-admins' }, { status: 403 });
  }
  try {
    const body = await request.json();
    const { nom, email, mot_de_passe, role } = body;

    if (!nom?.trim() || !email?.trim() || !mot_de_passe) {
      return NextResponse.json({ error: 'Nom, email et mot de passe requis' }, { status: 400 });
    }
    if (mot_de_passe.length < 8) {
      return NextResponse.json({ error: 'Mot de passe : minimum 8 caractères' }, { status: 400 });
    }
    if (!['admin', 'super_admin'].includes(role)) {
      return NextResponse.json({ error: 'Rôle invalide' }, { status: 400 });
    }

    // Email unique
    const { data: existant } = await supabaseAdmin
      .from('admins')
      .select('id')
      .eq('email', email.toLowerCase().trim())
      .maybeSingle();
    if (existant) {
      return NextResponse.json({ error: 'Un admin existe déjà avec cet email' }, { status: 409 });
    }

    const hash = await bcrypt.hash(mot_de_passe, 12);

    const { data, error } = await supabaseAdmin
      .from('admins')
      .insert({
        nom: nom.trim(),
        email: email.toLowerCase().trim(),
        mot_de_passe: hash,
        role,
        doit_changer_mdp: true,
      })
      .select('id, nom, email, role, doit_changer_mdp, date_creation')
      .single();

    if (error) throw error;

    await logAdminAction({
      request,
      admin,
      action: 'admin.creer',
      cibleType: 'admin',
      cibleId: data.id,
      details: { email: data.email, role: data.role },
    });

    return NextResponse.json({ admin: data }, { status: 201 });
  } catch (error) {
    console.error('POST /api/admin/comptes error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
