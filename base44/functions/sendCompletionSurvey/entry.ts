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

    const clients = await base44.entities.Client.list();
    const client = clients.find(c => c.id === job.client_id);

    if (client && client.email) {
      await base44.integrations.Core.SendEmail({
        to: client.email,
        subject: `Service Feedback - ${job.title}`,
        body: `We'd love to hear about your experience with our service. Please complete this feedback form.`
      });
    }

    return Response.json({ sent: !!client });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});