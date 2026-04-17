import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * Analyzes client interaction history, predicts needs, and suggests communication strategies.
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { client_id } = await req.json();
    if (!client_id) return Response.json({ error: 'Missing client_id' }, { status: 400 });

    // Fetch client data
    const client = await base44.entities.Client.list();
    const targetClient = client.find(c => c.id === client_id);
    if (!targetClient) return Response.json({ error: 'Client not found' }, { status: 404 });

    // Fetch related data
    const jobs = await base44.entities.Job.filter({ client_id });
    const referrals = await base44.entities.Referral.filter({ client_id });
    const serviceRequests = await base44.entities.ServiceRequest.filter({ client_id });
    const auditLogs = await base44.entities.AuditLog.filter({ entity_id: client_id });

    // Build context string
    const jobSummary = jobs.map(j => `${j.title} (${j.status}) - ${j.scheduled_date}`).join(', ');
    const referralSummary = referrals.map(r => `${r.reason_for_referral} (${r.status})`).join(', ');
    const servicesSummary = serviceRequests.map(s => `${s.request_type}: ${s.title}`).join(', ');

    const prompt = `You are an expert in elderly care and community support. Analyze this client's profile and history:

CLIENT PROFILE:
Name: ${targetClient.first_name} ${targetClient.last_name}
Age: ${targetClient.date_of_birth ? Math.floor((Date.now() - new Date(targetClient.date_of_birth).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : 'Unknown'}
Location: ${targetClient.town}
Isolation Level: ${targetClient.isolation_level}
Dementia-related: ${targetClient.dementia_related ? 'Yes' : 'No'}
Current Needs: ${targetClient.support_needs?.join(', ') || 'None recorded'}
Referral Source: ${targetClient.referral_source}

INTERACTION HISTORY:
Jobs: ${jobSummary || 'None'}
Referrals: ${referralSummary || 'None'}
Services Requested: ${servicesSummary || 'None'}

Provide your response as JSON with exactly these fields:
{
  "interaction_summary": "A 2-3 sentence summary of their main interaction patterns and service usage",
  "predicted_needs": ["need1", "need2", "need3"],
  "predicted_needs_reasoning": "Brief explanation of why these needs are predicted",
  "communication_strategy": {
    "best_contact_method": "phone/email/visit/letter",
    "communication_tone": "friendly/formal/casual/warm",
    "key_talking_points": ["point1", "point2", "point3"],
    "engagement_tips": ["tip1", "tip2"]
  },
  "recommended_actions": ["action1", "action2"]
}`;

    const insights = await base44.integrations.Core.InvokeLLM({
      prompt: prompt,
      response_json_schema: {
        type: 'object',
        properties: {
          interaction_summary: { type: 'string' },
          predicted_needs: { type: 'array', items: { type: 'string' } },
          predicted_needs_reasoning: { type: 'string' },
          communication_strategy: {
            type: 'object',
            properties: {
              best_contact_method: { type: 'string' },
              communication_tone: { type: 'string' },
              key_talking_points: { type: 'array', items: { type: 'string' } },
              engagement_tips: { type: 'array', items: { type: 'string' } }
            }
          },
          recommended_actions: { type: 'array', items: { type: 'string' } }
        },
        required: ['interaction_summary', 'predicted_needs', 'communication_strategy', 'recommended_actions']
      }
    });

    return Response.json({
      success: true,
      client_id,
      client_name: `${targetClient.first_name} ${targetClient.last_name}`,
      insights: insights
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});