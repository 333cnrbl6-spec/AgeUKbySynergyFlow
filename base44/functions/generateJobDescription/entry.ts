import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { job_title, client_needs } = body;

    const prompt = `Generate a concise job description for: ${job_title}. Client needs: ${client_needs}`;

    const response = await base44.integrations.Core.InvokeLLM({
      prompt,
      model: 'gpt_5_mini'
    });

    return Response.json({ description: response });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});