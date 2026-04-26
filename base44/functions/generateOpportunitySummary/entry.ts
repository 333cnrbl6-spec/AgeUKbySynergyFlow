import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const jobs = await base44.entities.Job.filter({
      branch_id: user.branch_id,
      status: 'pending'
    });

    const summary = {
      branch_id: user.branch_id,
      total_pending_jobs: jobs.length,
      high_priority_jobs: jobs.filter(j => j.priority === 'high').length,
      opportunities: jobs.map(j => ({
        id: j.id,
        title: j.title,
        priority: j.priority,
        scheduled_date: j.scheduled_date
      }))
    };

    return Response.json(summary);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});