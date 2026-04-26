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

    const jobs = await base44.entities.Job.list();
    const job = jobs.find(j => j.id === job_id && j.branch_id === user.branch_id);

    if (!job) {
      return Response.json({ error: 'Job not found' }, { status: 404 });
    }

    // Log completion
    await base44.entities.AuditLog.create({
      branch_id: user.branch_id,
      entity_type: 'Job',
      entity_id: job_id,
      action: 'completed',
      changed_by: user.email,
      timestamp: new Date().toISOString()
    });

    // Check if referral should be triggered
    if (job.client_id) {
      const referrals = await base44.entities.Referral.filter({
        branch_id: user.branch_id,
        client_id: job.client_id
      });

      if (referrals.length === 0) {
        // Could create auto-referral here
      }
    }

    return Response.json({ processed: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});