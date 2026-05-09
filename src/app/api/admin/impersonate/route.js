// API impersonation : un admin demande un token entreprise temporaire pour
// "voir comme" un compte. Le token est tracé en DB (impersonation_sessions)
// et logué dans audit_logs.
import { requireAdmin } from '@/lib/adminAuth';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { logAdminAction } from '@/lib/auditLog';
import crypto from 'crypto';

const DUREE_DEFAUT_MS = 30 * 60 * 1000; // 30 minutes

export async function POST(request) {
  const admin = await requireAdmin(request);
  if (admin instanceof Response) return admin;

  // Restreindre aux super_admin
  if (admin.role !== 'super_admin') {
    return Response.json({ error: 'Réservé aux super-admins' }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const { compte_structure_id, motif } = body || {};
  if (!compte_structure_id) {
    return Response.json({ error: 'compte_structure_id requis' }, { status: 400 });
  }
  if (!motif || motif.trim().length < 5) {
    return Response.json({ error: 'Motif obligatoire (min 5 caractères)' }, { status: 400 });
  }

  // Vérifier que le compte existe
  const { data: compte } = await supabaseAdmin
    .from('comptes_structures')
    .select('id, email, nom_contact, structure_id')
    .eq('id', compte_structure_id)
    .single();
  if (!compte) return Response.json({ error: 'Compte introuvable' }, { status: 404 });

  const token = crypto.randomBytes(32).toString('hex');
  const expires_at = new Date(Date.now() + DUREE_DEFAUT_MS).toISOString();

  const { data: session, error } = await supabaseAdmin
    .from('impersonation_sessions')
    .insert({
      admin_id: admin.id,
      compte_structure_id,
      token,
      motif,
      expires_at,
    })
    .select()
    .single();
  if (error) return Response.json({ error: error.message }, { status: 500 });

  await logAdminAction({
    request,
    admin,
    action: 'impersonation.demarrer',
    cibleType: 'compte_structure',
    cibleId: compte_structure_id,
    details: { motif, session_id: session.id, expires_at },
  });

  return Response.json({
    token,
    compte: { id: compte.id, email: compte.email, nom_contact: compte.nom_contact },
    expires_at,
    session_id: session.id,
  });
}

export async function DELETE(request) {
  const admin = await requireAdmin(request);
  if (admin instanceof Response) return admin;

  const body = await request.json().catch(() => ({}));
  const { session_id } = body || {};
  if (!session_id) return Response.json({ error: 'session_id requis' }, { status: 400 });

  const { error } = await supabaseAdmin
    .from('impersonation_sessions')
    .update({ termine_at: new Date().toISOString() })
    .eq('id', session_id)
    .eq('admin_id', admin.id);
  if (error) return Response.json({ error: error.message }, { status: 500 });

  await logAdminAction({
    request,
    admin,
    action: 'impersonation.terminer',
    cibleType: 'impersonation',
    cibleId: session_id,
  });

  return Response.json({ success: true });
}
