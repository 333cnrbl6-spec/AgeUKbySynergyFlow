import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch branch data
    const clients = await base44.entities.Client.filter({ branch_id: user.branch_id });
    const jobs = await base44.entities.Job.filter({ branch_id: user.branch_id });
    const volunteers = await base44.entities.Volunteer.filter({ branch_id: user.branch_id });

    const report = {
      branch_id: user.branch_id,
      total_clients: clients.length,
      total_jobs: jobs.length,
      completed_jobs: jobs.filter(j => j.status === 'completed').length,
      total_volunteers: volunteers.length,
      generated_at: new Date().toISOString()
    };

    return Response.json(report);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});