// API templates de réponse admin
import { requireAdmin } from '@/lib/adminAuth';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { logAdminAction } from '@/lib/auditLog';

export async function GET(request) {
  const admin = await requireAdmin(request);
  if (admin instanceof Response) return admin;

  const { searchParams } = new URL(request.url);
  const contexte = searchParams.get('contexte');

  let query = supabaseAdmin
    .from('templates_reponse')
    .select('*')
    .or(`admin_id.eq.${admin.id},partage.eq.true`)
    .order('utilisations', { ascending: false })
    .order('created_at', { ascending: false });

  if (contexte) query = query.eq('contexte', contexte);

  const { data, error } = await query;
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ templates: data || [] });
}

export async function POST(request) {
  const admin = await requireAdmin(request);
  if (admin instanceof Response) return admin;

  const body = await request.json();
  const { titre, contenu, contexte, partage } = body || {};
  if (!titre || !contenu) {
    return Response.json({ error: 'titre et contenu requis' }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from('templates_reponse')
    .insert({
      admin_id: admin.id,
      titre,
      contenu,
      contexte: contexte || null,
      partage: !!partage,
    })
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });

  await logAdminAction({
    request,
    admin,
    action: 'template.creer',
    cibleType: 'template_reponse',
    cibleId: data.id,
    details: { titre, contexte },
  });

  return Response.json({ template: data });
}
