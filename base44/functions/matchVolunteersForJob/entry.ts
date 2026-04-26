import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { job_id } = body;

    const job = await base44.entities.Job.list();
    const jobData = job.find(j => j.id === job_id && j.branch_id === user.branch_id);

    if (!jobData) {
      return Response.json({ error: 'Job not found' }, { status: 404 });
    }

    const volunteers = await base44.entities.Volunteer.filter({
      branch_id: user.branch_id,
      status: 'active'
    });

    return Response.json({ 
      job_id, 
      available_volunteers: volunteers.length,
      candidates: volunteers.slice(0, 5)
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});