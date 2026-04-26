import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const stats = {
      branch_id: user.branch_id,
      clients_count: (await base44.entities.Client.filter({ branch_id: user.branch_id })).length,
      jobs_count: (await base44.entities.Job.filter({ branch_id: user.branch_id })).length,
      volunteers_count: (await base44.entities.Volunteer.filter({ branch_id: user.branch_id })).length,
      synced_at: new Date().toISOString()
    };

    return Response.json({ success: true, ...stats });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});