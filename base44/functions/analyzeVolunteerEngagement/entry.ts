import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { volunteer_id } = body;

    const volunteers = await base44.entities.Volunteer.list();
    const volunteer = volunteers.find(v => v.id === volunteer_id && v.branch_id === user.branch_id);

    if (!volunteer) {
      return Response.json({ error: 'Volunteer not found' }, { status: 404 });
    }

    const prompt = `Analyze volunteer engagement: ${JSON.stringify(volunteer)}. Provide insights and recommendations.`;

    const response = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: 'object',
        properties: {
          engagement_level: { type: 'string' },
          strength_areas: { type: 'array', items: { type: 'string' } },
          development_areas: { type: 'array', items: { type: 'string' } }
        }
      }
    });

    return Response.json(response);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});