import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { service_name } = await req.json();

    if (!service_name) {
      return Response.json({ error: 'Missing service_name' }, { status: 400 });
    }

    // Fetch all waitlist entries for this service
    const waitlist = await base44.entities.Waitlist.filter({ 
      service_name,
      status: 'waiting'
    });

    if (waitlist.length === 0) {
      return Response.json({ 
        success: true, 
        service_name,
        message: 'No waiting prospects',
        prioritized: []
      });
    }

    // Score and prioritize based on urgency and location
    const scored = waitlist.map(entry => {
      let score = 0;

      // Urgency scoring (0-100 points)
      if (entry.urgency === 'urgent') score += 100;
      else if (entry.urgency === 'soon') score += 50;
      else score += 0;

      // Days waiting (loyalty bonus - 1 point per day, max 30)
      const daysWaiting = Math.floor((new Date() - new Date(entry.date_added)) / (1000 * 60 * 60 * 24));
      score += Math.min(30, daysWaiting);

      return {
        ...entry,
        score,
        days_waiting: daysWaiting
      };
    });

    // Sort by score (highest first), then by days waiting
    const prioritized = scored.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return b.days_waiting - a.days_waiting;
    });

    // Assign positions
    const withPositions = prioritized.map((entry, idx) => ({
      ...entry,
      position: idx + 1
    }));

    return Response.json({
      success: true,
      service_name,
      total_waiting: withPositions.length,
      prioritized: withPositions,
      top_prospect: withPositions[0] || null,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});