import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const waitlist = await base44.entities.Waitlist.filter({
      branch_id: user.branch_id,
      status: 'waiting'
    });

    // Sort by urgency and date
    const sorted = waitlist.sort((a, b) => {
      const urgencyOrder = { urgent: 0, soon: 1, routine: 2 };
      const urgencyDiff = urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
      if (urgencyDiff !== 0) return urgencyDiff;
      return new Date(a.date_added) - new Date(b.date_added);
    });

    // Update positions
    for (let i = 0; i < sorted.length; i++) {
      await base44.entities.Waitlist.update(sorted[i].id, { position: i + 1 });
    }

    return Response.json({ total: sorted.length, repositioned: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});