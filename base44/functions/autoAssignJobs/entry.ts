import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get unassigned jobs for this branch
    const jobs = await base44.entities.Job.filter({
      branch_id: user.branch_id,
      status: 'pending'
    });

    // Get available staff for this branch
    const staff = await base44.entities.StaffMember.filter({
      branch_id: user.branch_id,
      status: 'active'
    });

    let assigned = 0;
    for (const job of jobs) {
      if (staff.length > 0) {
        const randomStaff = staff[Math.floor(Math.random() * staff.length)];
        await base44.entities.Job.update(job.id, {
          assigned_to: randomStaff.id,
          assigned_to_name: randomStaff.name,
          status: 'assigned'
        });
        assigned++;
      }
    }

    return Response.json({ assigned, total: jobs.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});