// API audit logs admin
import { requireAdmin } from '@/lib/adminAuth';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(request) {
  const admin = await requireAdmin(request);
  if (admin instanceof Response) return admin;

  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get('limit') || '100', 10), 500);
  const offset = parseInt(searchParams.get('offset') || '0', 10);
  const action = searchParams.get('action');
  const cibleType = searchParams.get('cible_type');
  const adminId = searchParams.get('admin_id');
  const dateMin = searchParams.get('date_min');

  let query = supabaseAdmin
    .from('admin_audit_logs')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (action) query = query.ilike('action', `%${action}%`);
  if (cibleType) query = query.eq('cible_type', cibleType);
  if (adminId) query = query.eq('admin_id', adminId);
  if (dateMin) query = query.gte('created_at', dateMin);

  const { data, error, count } = await query;
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ logs: data || [], total: count || 0 });
}
