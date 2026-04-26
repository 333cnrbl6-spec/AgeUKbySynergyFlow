import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { week_starting } = body;

    const staff = await base44.entities.StaffMember.filter({
      branch_id: user.branch_id,
      status: 'active'
    });

    const jobs = await base44.entities.Job.filter({
      branch_id: user.branch_id,
      status: 'assigned'
    });

    const schedules = [];
    for (const member of staff) {
      const schedule = await base44.entities.WorkSchedule.create({
        branch_id: user.branch_id,
        staff_id: member.id,
        staff_name: member.name,
        week_starting,
        shifts: [],
        status: 'draft'
      });
      schedules.push(schedule);
    }

    return Response.json({ created: schedules.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});