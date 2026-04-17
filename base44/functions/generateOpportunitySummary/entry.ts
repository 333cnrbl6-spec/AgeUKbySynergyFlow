import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * Generates personalized volunteer opportunity summaries.
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { volunteer_id, job_id } = await req.json();
    if (!volunteer_id || !job_id) return Response.json({ error: 'Missing IDs' }, { status: 400 });

    // Fetch volunteer and job
    const volunteers = await base44.entities.Volunteer.list();
    const volunteer = volunteers.find(v => v.id === volunteer_id);
    if (!volunteer) return Response.json({ error: 'Volunteer not found' }, { status: 404 });

    const jobs = await base44.entities.Job.list();
    const job = jobs.find(j => j.id === job_id);
    if (!job) return Response.json({ error: 'Job not found' }, { status: 404 });

    const prompt = `Create a personalized volunteer opportunity summary for this volunteer:

VOLUNTEER:
Name: ${volunteer.name}
Skills: ${volunteer.skills?.join(', ') || 'General'}
Experience Level: ${volunteer.experience_level}
Location: ${volunteer.location}
Jobs Completed: ${volunteer.jobs_completed}
Interests: ${volunteer.interests?.join(', ') || 'Flexible'}

OPPORTUNITY:
Title: ${job.title}
Type: ${job.job_type}
Client: ${job.client_name}
Location: ${job.town}
Description: ${job.description || 'No description'}
Estimated Hours: ${job.estimated_hours || 'Not specified'}
Priority: ${job.priority}

Generate a brief, engaging summary highlighting why this is a great fit. Include:
{
  "title": "Personalized title for this opportunity",
  "hook": "One sentence to spark interest",
  "why_great_fit": "2-3 sentences explaining the match",
  "impact_statement": "How their contribution matters",
  "key_benefits": ["benefit1", "benefit2", "benefit3"],
  "call_to_action": "Encouraging next step message"
}`;

    const summary = await base44.integrations.Core.InvokeLLM({
      prompt: prompt,
      response_json_schema: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          hook: { type: 'string' },
          why_great_fit: { type: 'string' },
          impact_statement: { type: 'string' },
          key_benefits: { type: 'array', items: { type: 'string' } },
          call_to_action: { type: 'string' }
        }
      }
    });

    return Response.json({
      success: true,
      volunteer_id,
      job_id,
      volunteer_name: volunteer.name,
      job_title: job.title,
      summary: summary
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});