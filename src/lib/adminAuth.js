// Utilitaire d'authentification admin — SERVER ONLY
// Valide le token de session admin contre la table admin_sessions
import { supabaseAdmin } from '@/lib/supabaseAdmin';

/**
 * Valide un token admin depuis le header Authorization.
 * Retourne l'objet admin si valide, null sinon.
 */
export async function getAdminFromToken(request) {
  const authHeader = request.headers.get('Authorization');
  const token = authHeader?.replace('Bearer ', '').trim();
  if (!token) return null;

  const { data: session } = await supabaseAdmin
    .from('admin_sessions')
    .select('id, expires_at, admin_id, admins(id, nom, email, role)')
    .eq('token', token)
    .single();

  if (!session) return null;

  // Token expiré → nettoyer
  if (new Date(session.expires_at) < new Date()) {
    await supabaseAdmin.from('admin_sessions').delete().eq('id', session.id);
    return null;
  }

  return session.admins;
}

/**
 * Raccourci : retourne une réponse 401 standard si l'admin n'est pas authentifié.
 * Usage :
 *   const admin = await requireAdmin(request);
 *   if (admin instanceof Response) return admin;
 */
export async function requireAdmin(request) {
  const admin = await getAdminFromToken(request);
  if (!admin) {
    return new Response(JSON.stringify({ error: 'Non autorisé' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  return admin;
}
