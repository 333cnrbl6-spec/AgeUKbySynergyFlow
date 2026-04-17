import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * Sends email notifications to staff about their weekly shifts.
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { start_date, end_date } = body;

    // Fetch all jobs assigned for the period
    const jobs = await base44.entities.Job.filter({
      scheduled_date: { $gte: start_date, $lte: end_date },
      assigned_to: { $exists: true }
    });

    // Group jobs by assigned staff
    const schedulesByStaff = {};
    jobs.forEach(job => {
      if (!schedulesByStaff[job.assigned_to]) {
        schedulesByStaff[job.assigned_to] = [];
      }
      schedulesByStaff[job.assigned_to].push(job);
    });

    // Fetch staff emails
    const staff = await base44.entities.StaffMember.list();
    const staffMap = Object.fromEntries(staff.map(s => [s.name, s.email]));

    // Send notifications
    const notificationsSent = [];
    for (const [staffName, assignedJobs] of Object.entries(schedulesByStaff)) {
      const email = staffMap[staffName];
      if (!email) continue;

      const jobList = assignedJobs
        .map(j => `• ${j.title} - ${j.scheduled_date} at ${j.scheduled_time}`)
        .join('\n');

      const body = `Hi ${staffName},\n\nYour weekly schedule has been updated:\n\n${jobList}\n\nPlease confirm your availability.\n\nBest regards,\nAge UK Bury`;

      await base44.integrations.Core.SendEmail({
        to: email,
        subject: `Your Weekly Schedule Update (${start_date} - ${end_date})`,
        body: body
      });

      notificationsSent.push({ staff: staffName, email, jobs_count: assignedJobs.length });
    }

    return Response.json({
      notifications_sent: notificationsSent.length,
      details: notificationsSent
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});