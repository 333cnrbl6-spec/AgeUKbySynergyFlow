import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * Network Ping — tests connection to the Hub without sending any data.
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorised' }, { status: 401 });

    const configs = await base44.asServiceRole.entities.NetworkConfig.list();
    const config = configs[0];

    if (!config || !config.hub_api_url || !config.hub_api_key) {
      return Response.json({ connected: false, error: 'Hub URL and API key not configured' });
    }

    // Ping the Hub with a minimal POST to test connectivity
    const hubUrl = config.hub_api_url || 'https://api.base44.com/api/apps/6802d80c68e8e7ecfa12c3ef/functions/receiveBranchSync';
    const hubApiKey = config.hub_api_key || 'auk_Bx7mK2pQnR9vLsY4wJdF6tUeA3hCgN8X';

    const pingResponse = await fetch(hubUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Branch-API-Key': hubApiKey,
        'X-Branch-ID': config.branch_id || 'bury',
      },
      body: JSON.stringify({ report_period: 'ping-test', stats: { ping: true } }),
    });

    const connected = pingResponse.ok;
    let responseBody = null;
    try { responseBody = await pingResponse.json(); } catch (_) { responseBody = null; }

    await base44.asServiceRole.entities.NetworkConfig.update(config.id, {
      connection_status: connected ? 'connected' : 'error',
      last_sync_result: connected ? 'Ping successful' : `Ping failed: ${pingResponse.status}`,
    });

    return Response.json({ connected, status: pingResponse.status, url_used: hubUrl, response_body: responseBody });

  } catch (error) {
    return Response.json({ connected: false, error: error.message }, { status: 500 });
  }
});