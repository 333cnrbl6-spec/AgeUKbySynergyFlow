import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { entity_type, entity_id, action, changes } = body;

    await base44.entities.AuditLog.create({
      branch_id: user.branch_id,
      entity_type,
      entity_id,
      action,
      changed_by: user.email,
      changes: JSON.stringify(changes),
      timestamp: new Date().toISOString()
    });

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});