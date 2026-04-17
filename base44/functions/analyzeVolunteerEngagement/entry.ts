import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * Analyzes volunteer engagement and suggests retention strategies.
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { volunteer_id } = await req.json();
    if (!volunteer_id) return Response.json({ error: 'Missing volunteer_id' }, { status: 400 });

    // Fetch volunteer
    const volunteers = await base44.entities.Volunteer.list();
    const volunteer = volunteers.find(v => v.id === volunteer_id);
    if (!volunteer) return Response.json({ error: 'Volunteer not found' }, { status: 404 });

    // Build engagement context
    const daysSinceLastActivity = volunteer.last_activity_date 
      ? Math.floor((Date.now() - new Date(volunteer.last_activity_date).getTime()) / (1000 * 60 * 60 * 24))
      : null;

    const prompt = `Analyze this volunteer's engagement profile and suggest retention strategies:

VOLUNTEER PROFILE:
Name: ${volunteer.name}
Joined: ${volunteer.joined_date}
Status: ${volunteer.status}
Jobs Completed: ${volunteer.jobs_completed}
Hours Volunteered: ${volunteer.hours_volunteered}
Experience Level: ${volunteer.experience_level}
Engagement Score: ${volunteer.engagement_score}/100
Days Since Last Activity: ${daysSinceLastActivity || 'Unknown'}
Skills: ${volunteer.skills?.join(', ') || 'None recorded'}
Interests: ${volunteer.interests?.join(', ') || 'None recorded'}

Provide your response as JSON with these fields:
{
  "engagement_level": "high/medium/low/at_risk",
  "engagement_summary": "Brief assessment of their engagement",
  "key_metrics": {
    "productivity": "assessment of jobs completed",
    "consistency": "assessment of activity frequency",
    "skill_utilization": "how well their skills are being used"
  },
  "risk_factors": ["factor1", "factor2"],
  "retention_strategies": [
    {
      "strategy": "specific action",
      "rationale": "why this will help",
      "priority": "high/medium/low"
    }
  ],
  "recommended_opportunities": ["opportunity1", "opportunity2"],
  "recognition_ideas": ["idea1", "idea2"]
}`;

    const analysis = await base44.integrations.Core.InvokeLLM({
      prompt: prompt,
      response_json_schema: {
        type: 'object',
        properties: {
          engagement_level: { type: 'string' },
          engagement_summary: { type: 'string' },
          key_metrics: { type: 'object' },
          risk_factors: { type: 'array', items: { type: 'string' } },
          retention_strategies: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                strategy: { type: 'string' },
                rationale: { type: 'string' },
                priority: { type: 'string' }
              }
            }
          },
          recommended_opportunities: { type: 'array', items: { type: 'string' } },
          recognition_ideas: { type: 'array', items: { type: 'string' } }
        }
      }
    });

    return Response.json({
      success: true,
      volunteer_id,
      volunteer_name: volunteer.name,
      analysis: analysis
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});