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

    const volunteers = await base44.entities.Volunteer.filter({
      branch_id: user.branch_id,
      status: 'active'
    });

    const matches = [];
    for (const job of jobs.slice(0, 5)) {
      const matched = volunteers.filter(v => 
        v.skills && v.skills.length > 0
      ).slice(0, 3);

      matches.push({
        job_id: job.id,
        job_title: job.title,
        candidates: matched.map(v => ({ id: v.id, name: v.name }))
      });
    }

    return Response.json({ total_jobs: jobs.length, matches });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});