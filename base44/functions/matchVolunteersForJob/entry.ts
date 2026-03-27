import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { job_id } = await req.json();

    if (!job_id) {
      return Response.json({ error: 'Missing job_id' }, { status: 400 });
    }

    // Fetch job details
    const job = await base44.entities.Job.list();
    const jobData = job.find(j => j.id === job_id);
    
    if (!jobData) {
      return Response.json({ error: 'Job not found' }, { status: 404 });
    }

    // Fetch client to get location
    const clients = await base44.entities.Client.list();
    const client = clients.find(c => c.id === jobData.client_id);

    // Fetch all staff/volunteers
    const staff = await base44.entities.StaffMember.list();
    const volunteers = staff.filter(s => s.role === 'volunteer' && s.status === 'active');

    if (volunteers.length === 0) {
      return Response.json({ 
        success: true, 
        matches: [],
        message: 'No active volunteers available'
      });
    }

    // Skill categories for job types
    const jobTypeSkills = {
      'handrails': ['installation', 'safety', 'carpentry'],
      'security_locks': ['installation', 'security', 'locks'],
      'shelves': ['installation', 'carpentry', 'DIY'],
      'curtain_rails': ['installation', 'DIY'],
      'wall_decorations': ['installation', 'hanging'],
      'minor_plumbing': ['plumbing', 'repairs'],
      'painting_decorating': ['decorating', 'painting'],
      'light_bulbs': ['electrical', 'basic'],
      'flat_pack': ['assembly', 'carpentry'],
      'smoke_alarms': ['electrical', 'safety'],
      'key_safes': ['installation', 'security'],
      'draught_excluders': ['DIY', 'weatherproofing'],
      'carpet_cleaning': ['cleaning', 'equipment'],
      'minor_gardening': ['gardening', 'outdoors'],
      'fence_painting': ['painting', 'outdoors'],
      'furniture_moving': ['lifting', 'logistics'],
    };

    // Calculate match scores for each volunteer
    const matches = volunteers.map(volunteer => {
      let score = 0;
      const reasons = [];

      // 1. Skill match (40 points max)
      const requiredSkills = jobTypeSkills[jobData.job_type] || [];
      if (requiredSkills.length > 0 && volunteer.notes) {
        const volunteerSkills = volunteer.notes.toLowerCase();
        const matchedSkills = requiredSkills.filter(skill => 
          volunteerSkills.includes(skill.toLowerCase())
        );
        const skillScore = (matchedSkills.length / requiredSkills.length) * 40;
        score += skillScore;
        if (matchedSkills.length > 0) {
          reasons.push(`Skills: ${matchedSkills.join(', ')}`);
        }
      }

      // 2. Location proximity (30 points max)
      if (client?.town && volunteer.name) {
        // Simple proximity scoring based on same town/area
        const volunteerTown = volunteer.notes?.includes(client.town) ? client.town : null;
        if (volunteerTown === client.town) {
          score += 30;
          reasons.push(`Local to ${client.town}`);
        } else {
          score += 15; // Partial credit for proximity
          reasons.push('Willing to travel');
        }
      }

      // 3. DBS check status (20 points)
      if (volunteer.dbs_checked && volunteer.dbs_expiry) {
        const expiryDate = new Date(volunteer.dbs_expiry);
        if (expiryDate > new Date()) {
          score += 20;
          reasons.push('Valid DBS check');
        } else {
          // DBS expired, reduce score but still consider
          score += 5;
          reasons.push('DBS check expired');
        }
      }

      // 4. Availability (10 points) - based on job type preferences in notes
      if (volunteer.notes?.toLowerCase().includes(jobData.job_type?.replace(/_/g, ' ').toLowerCase())) {
        score += 10;
        reasons.push('Interested in this service type');
      }

      return {
        volunteer_id: volunteer.id,
        name: volunteer.name,
        role: volunteer.role,
        email: volunteer.email,
        phone: volunteer.phone,
        score: Math.round(score),
        reasons,
        dbs_valid: volunteer.dbs_checked && new Date(volunteer.dbs_expiry) > new Date(),
        notes: volunteer.notes,
      };
    }).sort((a, b) => b.score - a.score);

    // Store match suggestions in job notes for reference
    const topMatches = matches.slice(0, 3);
    const matchSummary = topMatches.map(m => `${m.name} (${m.score}/100)`).join(', ');

    return Response.json({
      success: true,
      job_id,
      job_title: jobData.title,
      client_location: client?.town || 'Unknown',
      total_volunteers: volunteers.length,
      matches: matches,
      top_matches: topMatches,
      match_summary: matchSummary,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});