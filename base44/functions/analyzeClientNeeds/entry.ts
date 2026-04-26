import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { client_id } = body;

    const clients = await base44.entities.Client.list();
    const client = clients.find(c => c.id === client_id && c.branch_id === user.branch_id);

    if (!client) {
      return Response.json({ error: 'Client not found' }, { status: 404 });
    }

    const prompt = `Analyze the needs of this client: ${JSON.stringify(client)}. Provide recommendations for services.`;

    const response = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: 'object',
        properties: {
          priority_needs: { type: 'array', items: { type: 'string' } },
          recommended_services: { type: 'array', items: { type: 'string' } }
        }
      }
    });

    return Response.json(response);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});