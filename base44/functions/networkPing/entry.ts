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

    const pingResponse = await fetch(`${config.hub_api_url}/ping`, {
      method: 'GET',
      headers: {
        'X-Branch-API-Key': config.hub_api_key,
        'X-Branch-ID': config.branch_id || config.id,
      },
    });

    const connected = pingResponse.ok;

    await base44.asServiceRole.entities.NetworkConfig.update(config.id, {
      connection_status: connected ? 'connected' : 'error',
      last_sync_result: connected ? 'Ping successful' : `Ping failed: ${pingResponse.status}`,
    });

    return Response.json({ connected, status: pingResponse.status });

  } catch (error) {
    return Response.json({ connected: false, error: error.message }, { status: 500 });
  }
});