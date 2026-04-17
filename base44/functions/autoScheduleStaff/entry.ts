import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * Auto-generates weekly staff schedules balancing availability, skills, and holidays.
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user?.role === 'admin') return Response.json({ error: 'Admin only' }, { status: 403 });

    const body = await req.json();
    const scheduleStartDate = body.start_date || new Date().toISOString().split('T')[0];
    const scheduleEndDate = body.end_date || new Date(Date.now() + 7*24*60*60*1000).toISOString().split('T')[0];

    // Fetch all active staff
    const staff = await base44.entities.StaffMember.filter({ status: 'active' });

    // Fetch approved holidays for the week
    const holidays = await base44.entities.HolidayRequest.filter({
      status: 'approved'
    });

    // Fetch existing jobs to fill
    const jobs = await base44.entities.Job.filter({
      scheduled_date: { $gte: scheduleStartDate, $lte: scheduleEndDate },
      assigned_to: { $exists: false }
    });

    const assignments = [];

    // Build availability map: staff_name -> [available_dates]
    const availabilityMap = {};
    staff.forEach(s => {
      const unavailableDates = holidays
        .filter(h => h.staff_name === s.name && h.start_date <= scheduleEndDate && h.end_date >= scheduleStartDate)
        .flatMap(h => {
          const dates = [];
          let current = new Date(h.start_date);
          while (current.toISOString().split('T')[0] <= h.end_date) {
            dates.push(current.toISOString().split('T')[0]);
            current.setDate(current.getDate() + 1);
          }
          return dates;
        });
      
      availabilityMap[s.name] = {
        staff: s,
        unavailable_dates: unavailableDates,
        assigned_count: 0
      };
    });

    // Assign jobs by skill match + availability + balanced workload
    for (const job of jobs) {
      const candidates = staff.filter(s => {
        const isAvailable = !availabilityMap[s.name].unavailable_dates.includes(job.scheduled_date);
        const hasSkill = s.role && job.job_category && s.role.toLowerCase().includes(job.job_category.toLowerCase());
        return isAvailable && hasSkill;
      });

      if (candidates.length > 0) {
        // Pick staff with lowest assigned_count
        const bestMatch = candidates.reduce((prev, curr) =>
          availabilityMap[curr.name].assigned_count < availabilityMap[prev.name].assigned_count ? curr : prev
        );

        await base44.entities.Job.update(job.id, {
          assigned_to: bestMatch.name,
          assignment_date: new Date().toISOString().split('T')[0]
        });

        availabilityMap[bestMatch.name].assigned_count += 1;
        assignments.push({
          job_id: job.id,
          staff: bestMatch.name,
          date: job.scheduled_date
        });
      }
    }

    return Response.json({
      schedule_period: `${scheduleStartDate} to ${scheduleEndDate}`,
      total_jobs_assigned: assignments.length,
      assignments: assignments
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});