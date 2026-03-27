import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const XERO_CLIENT_ID = Deno.env.get("XERO_CLIENT_ID");
const XERO_CLIENT_SECRET = Deno.env.get("XERO_CLIENT_SECRET");
const XERO_REDIRECT_URI = Deno.env.get("XERO_REDIRECT_URI");

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { action } = body;

  // Check if secrets are configured
  if (!XERO_CLIENT_ID || !XERO_CLIENT_SECRET || !XERO_REDIRECT_URI) {
    return Response.json({ error: 'not_configured' }, { status: 200 });
  }

  if (action === 'get_auth_url') {
    const scopes = 'openid profile email accounting.transactions accounting.contacts offline_access';
    const state = crypto.randomUUID();
    const url = `https://login.xero.com/identity/connect/authorize?response_type=code&client_id=${XERO_CLIENT_ID}&redirect_uri=${encodeURIComponent(XERO_REDIRECT_URI)}&scope=${encodeURIComponent(scopes)}&state=${state}`;
    return Response.json({ url, state });
  }

  if (action === 'exchange_code') {
    const { code } = body;
    const credentials = btoa(`${XERO_CLIENT_ID}:${XERO_CLIENT_SECRET}`);
    const tokenRes = await fetch('https://identity.xero.com/connect/token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: XERO_REDIRECT_URI,
      }),
    });
    const tokens = await tokenRes.json();
    if (tokens.error) return Response.json({ error: tokens.error_description }, { status: 400 });

    // Get tenant/organisation info
    const tenantsRes = await fetch('https://api.xero.com/connections', {
      headers: { 'Authorization': `Bearer ${tokens.access_token}` },
    });
    const tenants = await tenantsRes.json();
    const tenant = tenants[0];

    // Store tokens in user record
    await base44.auth.updateMe({
      xero_access_token: tokens.access_token,
      xero_refresh_token: tokens.refresh_token,
      xero_tenant_id: tenant?.tenantId,
      xero_org_name: tenant?.tenantName,
      xero_token_expiry: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
    });

    return Response.json({ success: true, org_name: tenant?.tenantName });
  }

  if (action === 'disconnect') {
    await base44.auth.updateMe({
      xero_access_token: null,
      xero_refresh_token: null,
      xero_tenant_id: null,
      xero_org_name: null,
      xero_token_expiry: null,
    });
    return Response.json({ success: true });
  }

  if (action === 'check_status') {
    const me = await base44.auth.me();
    const connected = !!me.xero_access_token;
    return Response.json({ connected, org_name: me.xero_org_name || null });
  }

  return Response.json({ error: 'Unknown action' }, { status: 400 });
});