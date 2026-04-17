import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * Auto-assign unassigned jobs to available staff based on location and workload capacity.
 * Triggered when a job is created or manually invoked.
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    // Fetch unassigned jobs
    const unassignedJobs = await base44.entities.Job.filter({
      assigned_to: { $exists: false }
    });

    // Fetch all active staff members
    const staffMembers = await base44.entities.StaffMember.filter({
      status: 'active'
    });

    // Fetch work schedules to calculate current workload
    const workSchedules = await base44.entities.WorkSchedule.list();
    const timesheetEntries = await base44.entities.TimesheetEntry.list();

    // Build workload map: staff_id -> current_job_count
    const workloadMap = {};
    staffMembers.forEach(staff => {
      const assignedCount = unassignedJobs.filter(j => j.assigned_to === staff.name).length;
      workloadMap[staff.name] = assignedCount;
    });

    const assignments = [];

    // Try to assign each unassigned job
    for (const job of unassignedJobs) {
      // Find best match: same town + lowest workload
      const candidates = staffMembers.filter(staff => {
        const isAvailable = !workSchedules.some(ws => 
          ws.staff_name === staff.name && 
          new Date(ws.date) <= new Date(job.scheduled_date) && 
          new Date(ws.end_date) >= new Date(job.scheduled_date)
        );
        return isAvailable && (job.town === undefined || job.town === staff.location);
      });

      if (candidates.length > 0) {
        // Sort by workload (ascending) and pick the least busy
        const bestMatch = candidates.reduce((prev, curr) => 
          (workloadMap[curr.name] || 0) < (workloadMap[prev.name] || 0) ? curr : prev
        );

        // Assign job
        await base44.entities.Job.update(job.id, {
          assigned_to: bestMatch.name,
          assignment_date: new Date().toISOString().split('T')[0]
        });

        workloadMap[bestMatch.name] = (workloadMap[bestMatch.name] || 0) + 1;
        assignments.push({ job_id: job.id, assigned_to: bestMatch.name });
      }
    }

    return Response.json({ 
      total_unassigned: unassignedJobs.length,
      assignments_made: assignments.length,
      assignments: assignments
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});