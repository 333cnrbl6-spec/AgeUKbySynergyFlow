import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

async function refreshTokenIfNeeded(base44, me) {
  const XERO_CLIENT_ID = Deno.env.get("XERO_CLIENT_ID");
  const XERO_CLIENT_SECRET = Deno.env.get("XERO_CLIENT_SECRET");

  const expiry = me.xero_token_expiry ? new Date(me.xero_token_expiry) : null;
  const needsRefresh = !expiry || expiry < new Date(Date.now() + 60000);

  if (needsRefresh && me.xero_refresh_token) {
    const credentials = btoa(`${XERO_CLIENT_ID}:${XERO_CLIENT_SECRET}`);
    const tokenRes = await fetch('https://identity.xero.com/connect/token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: me.xero_refresh_token,
      }),
    });
    const tokens = await tokenRes.json();
    if (!tokens.error) {
      await base44.auth.updateMe({
        xero_access_token: tokens.access_token,
        xero_refresh_token: tokens.refresh_token,
        xero_token_expiry: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
      });
      return tokens.access_token;
    }
  }
  return me.xero_access_token;
}

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  if (!user.xero_access_token) return Response.json({ error: 'Not connected to Xero' }, { status: 400 });

  const body = await req.json();
  const { action } = body;

  const accessToken = await refreshTokenIfNeeded(base44, user);
  const tenantId = user.xero_tenant_id;

  const xeroHeaders = {
    'Authorization': `Bearer ${accessToken}`,
    'Xero-tenant-id': tenantId,
    'Accept': 'application/json',
  };

  if (action === 'sync_invoices') {
    // Fetch PAID invoices from Xero (supplier bills = ACCPAY)
    const res = await fetch('https://api.xero.com/api.xro/2.0/Invoices?Status=PAID&Type=ACCPAY&page=1', {
      headers: xeroHeaders,
    });
    const data = await res.json();
    const invoices = data.Invoices || [];

    // Get all purchase orders to match
    const pos = await base44.asServiceRole.entities.PurchaseOrder.list();
    let matched = 0;

    for (const inv of invoices) {
      const ref = inv.Reference || inv.InvoiceNumber;
      const matchedPO = pos.find(po =>
        po.invoice_reference && po.invoice_reference.toLowerCase() === ref.toLowerCase()
      );
      if (matchedPO && matchedPO.payment_status !== 'paid') {
        await base44.asServiceRole.entities.PurchaseOrder.update(matchedPO.id, {
          payment_status: 'paid',
          payment_date: inv.FullyPaidOnDate ? inv.FullyPaidOnDate.split('T')[0] : new Date().toISOString().split('T')[0],
          amount_paid: inv.AmountPaid,
        });
        matched++;
      }
    }

    return Response.json({ success: true, total_invoices: invoices.length, matched_pos: matched, invoices: invoices.slice(0, 20) });
  }

  if (action === 'get_invoices') {
    const status = body.status || 'AUTHORISED';
    const type = body.type || 'ACCPAY';
    const res = await fetch(`https://api.xero.com/api.xro/2.0/Invoices?Status=${status}&Type=${type}&page=1`, {
      headers: xeroHeaders,
    });
    const data = await res.json();
    return Response.json({ invoices: data.Invoices || [] });
  }

  if (action === 'get_accounts') {
    const res = await fetch('https://api.xero.com/api.xro/2.0/Accounts', {
      headers: xeroHeaders,
    });
    const data = await res.json();
    return Response.json({ accounts: data.Accounts || [] });
  }

  if (action === 'sync_grant_spend') {
    // Fetch bank transactions / spend tagged to tracking categories
    const res = await fetch('https://api.xero.com/api.xro/2.0/BankTransactions?page=1', {
      headers: xeroHeaders,
    });
    const data = await res.json();
    const transactions = data.BankTransactions || [];

    // Get grants to match by tracking category name
    const grants = await base44.asServiceRole.entities.Grant.list();
    const updates = [];

    for (const grant of grants) {
      const grantTransactions = transactions.filter(tx =>
        tx.TrackingCategories && tx.TrackingCategories.some(tc =>
          tc.Name && tc.Name.toLowerCase().includes(grant.title.toLowerCase().substring(0, 10))
        )
      );
      const totalSpend = grantTransactions.reduce((sum, tx) => sum + (tx.Total || 0), 0);
      if (totalSpend > 0 && totalSpend !== grant.amount_spent) {
        await base44.asServiceRole.entities.Grant.update(grant.id, { amount_spent: totalSpend });
        updates.push({ grant: grant.title, amount_spent: totalSpend });
      }
    }

    return Response.json({ success: true, transactions_checked: transactions.length, grants_updated: updates });
  }

  if (action === 'get_organisation') {
    const res = await fetch('https://api.xero.com/api.xro/2.0/Organisation', {
      headers: xeroHeaders,
    });
    const data = await res.json();
    return Response.json({ organisation: data.Organisations?.[0] || null });
  }

  return Response.json({ error: 'Unknown action' }, { status: 400 });
});