// Modification / suppression d'un compte admin — réservé aux super_admin
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { requireAdmin } from '@/lib/adminAuth';
import { logAdminAction } from '@/lib/auditLog';
import bcrypt from 'bcryptjs';

export async function PATCH(request, { params }) {
  const admin = await requireAdmin(request);
  if (admin instanceof Response) return admin;
  if (admin.role !== 'super_admin') {
    return NextResponse.json({ error: 'Réservé aux super-admins' }, { status: 403 });
  }
  try {
    const { id } = await params;
    const body = await request.json();

    const updates = {};
    if (body.nom !== undefined)              updates.nom = String(body.nom).trim();
    if (body.email !== undefined)            updates.email = String(body.email).toLowerCase().trim();
    if (body.role !== undefined) {
      if (!['admin', 'super_admin'].includes(body.role)) {
        return NextResponse.json({ error: 'Rôle invalide' }, { status: 400 });
      }
      updates.role = body.role;
    }
    if (body.tentatives_connexion !== undefined) updates.tentatives_connexion = body.tentatives_connexion;
    if (body.bloque_jusqu_a !== undefined)       updates.bloque_jusqu_a = body.bloque_jusqu_a;
    if (body.doit_changer_mdp !== undefined)     updates.doit_changer_mdp = body.doit_changer_mdp;

    // Mot de passe — toujours hashé en bcrypt
    if (body.mot_de_passe) {
      if (String(body.mot_de_passe).length < 8) {
        return NextResponse.json({ error: 'Mot de passe : minimum 8 caractères' }, { status: 400 });
      }
      updates.mot_de_passe = await bcrypt.hash(String(body.mot_de_passe), 12);
      updates.doit_changer_mdp = true;
    }

    // Empêcher un super_admin de se rétrograder lui-même (évite la perte de droits)
    if (id === admin.id && updates.role && updates.role !== admin.role) {
      return NextResponse.json({ error: 'Vous ne pouvez pas changer votre propre rôle' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('admins')
      .update(updates)
      .eq('id', id)
      .select('id, nom, email, role, doit_changer_mdp')
      .single();

    if (error) throw error;

    await logAdminAction({
      request,
      admin,
      action: body.mot_de_passe ? 'admin.reset_mdp' : 'admin.modifier',
      cibleType: 'admin',
      cibleId: id,
      details: { champs_modifies: Object.keys(updates).filter(k => k !== 'mot_de_passe') },
    });

    return NextResponse.json({ admin: data });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const admin = await requireAdmin(request);
  if (admin instanceof Response) return admin;
  if (admin.role !== 'super_admin') {
    return NextResponse.json({ error: 'Réservé aux super-admins' }, { status: 403 });
  }
  try {
    const { id } = await params;
    if (id === admin.id) {
      return NextResponse.json({ error: 'Vous ne pouvez pas supprimer votre propre compte' }, { status: 400 });
    }
    const { error } = await supabaseAdmin.from('admins').delete().eq('id', id);
    if (error) throw error;

    await logAdminAction({
      request,
      admin,
      action: 'admin.supprimer',
      cibleType: 'admin',
      cibleId: id,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
