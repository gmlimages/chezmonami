// Helper SERVER ONLY pour journaliser les actions admin.
// À appeler depuis les routes API admin après chaque action sensible.
//
//   import { logAdminAction } from '@/lib/auditLog';
//   await logAdminAction({
//     request,
//     admin,
//     action: 'structure.publier',
//     cibleType: 'structure',
//     cibleId: structureId,
//     details: { motif: 'validation manuelle' },
//   });

import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function logAdminAction({
  request,
  admin,
  action,
  cibleType = null,
  cibleId = null,
  details = null,
}) {
  if (!action) return;
  try {
    const ip =
      request?.headers?.get?.('x-forwarded-for')?.split(',')[0]?.trim() ||
      request?.headers?.get?.('x-real-ip') ||
      null;
    const userAgent = request?.headers?.get?.('user-agent') || null;

    await supabaseAdmin.from('admin_audit_logs').insert({
      admin_id: admin?.id || null,
      admin_email: admin?.email || null,
      action,
      cible_type: cibleType,
      cible_id: cibleId ? String(cibleId) : null,
      details: details || null,
      ip,
      user_agent: userAgent,
    });
  } catch (err) {
    // Ne jamais bloquer l'action principale en cas d'échec d'audit.
    console.error('[auditLog] échec insertion :', err?.message || err);
  }
}
