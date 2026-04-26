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

    // Send email reminder via integration
    if (job.assigned_to) {
      const staff = await base44.entities.StaffMember.list();
      const assignee = staff.find(s => s.id === job.assigned_to);

      if (assignee && assignee.email) {
        await base44.integrations.Core.SendEmail({
          to: assignee.email,
          subject: `Reminder: ${job.title}`,
          body: `You have a job scheduled: ${job.title} on ${job.scheduled_date}`
        });
      }
    }

    return Response.json({ sent: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});