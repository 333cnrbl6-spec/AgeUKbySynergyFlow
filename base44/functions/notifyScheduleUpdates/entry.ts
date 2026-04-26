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

    let sent = 0;
    for (const member of staff) {
      if (member.email) {
        await base44.integrations.Core.SendEmail({
          to: member.email,
          subject: `Schedule Update for week of ${week_starting}`,
          body: `Your schedule has been updated. Please check the system for details.`
        });
        sent++;
      }
    }

    return Response.json({ sent });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});