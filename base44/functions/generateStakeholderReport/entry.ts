import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const clients = await base44.entities.Client.filter({ branch_id: user.branch_id });
    const jobs = await base44.entities.Job.filter({ branch_id: user.branch_id });
    const grants = await base44.entities.Grant.filter({ branch_id: user.branch_id });

    const report = {
      branch_id: user.branch_id,
      total_clients: clients.length,
      active_clients: clients.filter(c => c.status === 'active').length,
      total_jobs_completed: jobs.filter(j => j.status === 'completed').length,
      total_cost_saved: jobs.reduce((sum, j) => sum + (j.cost_estimate || 0), 0),
      grants_active: grants.filter(g => g.status === 'awarded').length,
      report_date: new Date().toISOString()
    };

    return Response.json(report);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});