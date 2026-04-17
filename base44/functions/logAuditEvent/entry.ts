import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * Logs entity changes (create, update, delete) to AuditLog for activity tracking.
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { entity_type, entity_id, action, changes } = await req.json();

    const auditLog = await base44.entities.AuditLog.create({
      entity_type,
      entity_id,
      action,
      changes,
      changed_by: user.email,
      timestamp: new Date().toISOString()
    });

    return Response.json({ success: true, log_id: auditLog.id });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});