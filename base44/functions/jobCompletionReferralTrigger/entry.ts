import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

/**
 * Automation: Triggered when a Job status changes to 'completed'
 * Checks if client is isolated and creates a referral suggestion
 * This function is called by the system, not directly
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();

    // Extract job and event data
    const { event, data: jobData } = payload;
    
    if (!jobData) {
      return Response.json({ error: 'No job data' }, { status: 400 });
    }

    // Only process if job is marked as completed
    if (jobData.status !== 'completed') {
      return Response.json({ success: false, reason: 'Job not completed' });
    }

    // Get the client
    const clientId = jobData.client_id;
    if (!clientId) {
      return Response.json({ error: 'No client associated with job' }, { status: 400 });
    }

    const clients = await base44.asServiceRole.entities.Client.list();
    const client = clients.find(c => c.id === clientId);

    if (!client) {
      return Response.json({ error: 'Client not found' }, { status: 404 });
    }

    // Check if client is isolated
    const isIsolated = client.isolation_level === 'isolated' || client.isolation_level === 'at_risk';

    // Check if client needs befriending
    const supportNeeds = client.support_needs || [];
    const needsBefriending = !supportNeeds.includes('befriending');

    // Prepare referral suggestion (will be shown to user in frontend)
    const referralSuggestion = {
      triggered: true,
      clientId: clientId,
      clientName: `${client.first_name} ${client.last_name}`,
      triggerEvent: `Handyperson job completed: "${jobData.title}"`,
      reason: isIsolated ? 'Client shows isolation risk and may benefit from befriending' : 'Job completion is a good opportunity to discuss additional support',
      suggestedService: 'befriending',
      isolationLevel: client.isolation_level,
      timestamp: new Date().toISOString()
    };

    // Log the suggestion
    console.log('Referral workflow triggered:', referralSuggestion);

    return Response.json({
      success: true,
      referralSuggestion: referralSuggestion,
      clientIsolated: isIsolated,
      needsBefriending: needsBefriending
    });
  } catch (error) {
    console.error('Error in job completion referral trigger:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});