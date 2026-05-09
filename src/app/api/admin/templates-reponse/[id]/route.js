// API templates de réponse — actions par id
import { requireAdmin } from '@/lib/adminAuth';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { logAdminAction } from '@/lib/auditLog';

async function checkOwnership(id, admin) {
  const { data } = await supabaseAdmin
    .from('templates_reponse')
    .select('id, admin_id, partage')
    .eq('id', id)
    .single();
  if (!data) return null;
  // Le créateur peut éditer/supprimer ; un super-admin peut tout
  if (data.admin_id !== admin.id && admin.role !== 'super_admin') return false;
  return data;
}

export async function PATCH(request, { params }) {
  const admin = await requireAdmin(request);
  if (admin instanceof Response) return admin;
  const p = await params;
  const ok = await checkOwnership(p.id, admin);
  if (ok === null) return Response.json({ error: 'Introuvable' }, { status: 404 });
  if (ok === false) return Response.json({ error: 'Non autorisé' }, { status: 403 });

  const body = await request.json();
  const update = {};
  ['titre', 'contenu', 'contexte', 'partage'].forEach((k) => {
    if (k in body) update[k] = body[k];
  });
  update.updated_at = new Date().toISOString();

  // Incrément utilisations (atomique côté serveur)
  if (body.incrementUsage) {
    const { data: cur } = await supabaseAdmin
      .from('templates_reponse')
      .select('utilisations')
      .eq('id', p.id)
      .single();
    update.utilisations = (cur?.utilisations || 0) + 1;
  }

  const { data, error } = await supabaseAdmin
    .from('templates_reponse')
    .update(update)
    .eq('id', p.id)
    .select()
    .single();
  if (error) return Response.json({ error: error.message }, { status: 500 });

  if (!body.incrementUsage) {
    await logAdminAction({
      request,
      admin,
      action: 'template.modifier',
      cibleType: 'template_reponse',
      cibleId: p.id,
    });
  }
  return Response.json({ template: data });
}

export async function DELETE(request, { params }) {
  const admin = await requireAdmin(request);
  if (admin instanceof Response) return admin;
  const p = await params;
  const ok = await checkOwnership(p.id, admin);
  if (ok === null) return Response.json({ error: 'Introuvable' }, { status: 404 });
  if (ok === false) return Response.json({ error: 'Non autorisé' }, { status: 403 });

  const { error } = await supabaseAdmin
    .from('templates_reponse')
    .delete()
    .eq('id', p.id);
  if (error) return Response.json({ error: error.message }, { status: 500 });

  await logAdminAction({
    request,
    admin,
    action: 'template.supprimer',
    cibleType: 'template_reponse',
    cibleId: p.id,
  });
  return Response.json({ success: true });
}
