import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * Matches volunteers to jobs based on skills, availability, and location.
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { job_id } = await req.json();

    // Fetch job
    const job = await base44.entities.Job.list();
    const targetJob = job.find(j => j.id === job_id);
    if (!targetJob) return Response.json({ error: 'Job not found' }, { status: 404 });

    // Fetch all active volunteers
    const volunteers = await base44.entities.Volunteer.filter({ status: 'active' });

    // Score each volunteer
    const scoredMatches = volunteers.map(vol => {
      let score = 0;
      let reasons = [];

      // Location match (40 points)
      if (targetJob.town === vol.location) {
        score += 40;
        reasons.push('Same location');
      } else {
        score += 10;
      }

      // Skills match (40 points)
      const jobSkills = targetJob.job_type?.toLowerCase() || '';
      const volSkills = (vol.skills || []).map(s => s.toLowerCase());
      const skillMatch = volSkills.some(s => jobSkills.includes(s) || jobSkills.includes(s));
      if (skillMatch) {
        score += 40;
        reasons.push('Matching skills');
      }

      // Availability match (20 points)
      if (vol.availability && vol.availability.length > 0) {
        score += 20;
        reasons.push('Good availability');
      }

      // Experience level bonus (if intermediate or advanced)
      if (vol.experience_level === 'advanced') {
        score += 15;
        reasons.push('Advanced experience');
      } else if (vol.experience_level === 'intermediate') {
        score += 8;
      }

      // Engagement bonus (active volunteers)
      if (vol.engagement_score > 70) {
        score += 10;
        reasons.push('Highly engaged');
      }

      return {
        volunteer_id: vol.id,
        name: vol.name,
        email: vol.email,
        location: vol.location,
        skills: vol.skills,
        match_score: Math.min(100, score),
        match_reasons: reasons,
        jobs_completed: vol.jobs_completed,
        hours_volunteered: vol.hours_volunteered
      };
    });

    // Sort by score and return top matches
    const topMatches = scoredMatches
      .filter(m => m.match_score >= 40)
      .sort((a, b) => b.match_score - a.match_score)
      .slice(0, 5);

    return Response.json({
      success: true,
      job_id,
      job_title: targetJob.title,
      matches: topMatches,
      total_candidates_evaluated: scoredMatches.length
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});