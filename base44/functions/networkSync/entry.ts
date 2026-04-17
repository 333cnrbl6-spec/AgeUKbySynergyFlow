import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * Network Sync Function
 * Packages anonymised branch statistics and pushes them to the Network Hub.
 * NO client names, addresses, or personal data is ever included.
 * Only aggregate counts and metrics are shared.
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorised' }, { status: 401 });
    }

    // Only admins can trigger a network sync
    if (user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Load network config
    const configs = await base44.asServiceRole.entities.NetworkConfig.list();
    const config = configs[0];

    if (!config || !config.hub_api_url || !config.hub_api_key) {
      return Response.json({ 
        success: false, 
        error: 'Network Hub not configured. Please set Hub URL and API key in Network Settings.' 
      }, { status: 400 });
    }

    // Gather anonymised stats — NO personal data
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];

    const [clients, jobs, referrals, grants, volunteers] = await Promise.all([
      base44.asServiceRole.entities.Client.list('-created_date', 1000),
      base44.asServiceRole.entities.Job.list('-created_date', 1000),
      base44.asServiceRole.entities.Referral.list('-received_date', 1000),
      base44.asServiceRole.entities.Grant.list('-created_date', 200),
      base44.asServiceRole.entities.StaffMember.list('-created_date', 200),
    ]);

    // Build anonymised payload
    const payload = {
      branch_id: config.branch_id || config.id,
      branch_name: config.branch_name,
      report_date: now.toISOString(),
      reporting_period: {
        month: now.getMonth() + 1,
        year: now.getFullYear()
      },
      stats: {
        total_clients: clients.filter(c => c.status === 'active').length,
        total_clients_all_time: clients.length,
        new_clients_this_month: clients.filter(c => c.created_date?.startsWith(monthStart.substring(0, 7))).length,
        dementia_clients: clients.filter(c => c.dementia_related).length,
        isolated_clients: clients.filter(c => c.isolation_level === 'isolated').length,
        jobs_active: jobs.filter(j => !['paid','cancelled','referred_out'].includes(j.status)).length,
        jobs_completed_this_month: jobs.filter(j => j.status === 'completed' && j.scheduled_date?.startsWith(monthStart.substring(0, 7))).length,
        revenue_collected: jobs.filter(j => j.payment_status === 'paid').reduce((s, j) => s + (j.total_cost || 0), 0),
        referrals_received_this_month: referrals.filter(r => r.received_date?.startsWith(monthStart.substring(0, 7))).length,
        referrals_active: referrals.filter(r => ['received','contacted','assessment_booked','active'].includes(r.status)).length,
        grants_active: grants.filter(g => g.status === 'awarded').length,
        grants_total_awarded: grants.filter(g => g.status === 'awarded').reduce((s, g) => s + (g.amount_awarded || 0), 0),
        staff_active: volunteers.filter(v => v.status === 'active').length,
        volunteers_active: volunteers.filter(v => v.role === 'volunteer' && v.status === 'active').length,
      }
    };

    // Push to Hub
    const hubResponse = await fetch(`${config.hub_api_url}/branch-sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Branch-API-Key': config.hub_api_key,
        'X-Branch-ID': config.branch_id || config.id,
      },
      body: JSON.stringify(payload),
    });

    const resultText = await hubResponse.text();
    const success = hubResponse.ok;

    // Update config with sync result
    await base44.asServiceRole.entities.NetworkConfig.update(config.id, {
      last_sync_date: now.toISOString(),
      connection_status: success ? 'connected' : 'error',
      last_sync_result: success ? 'Sync successful' : `Hub error: ${hubResponse.status} ${resultText}`,
    });

    return Response.json({
      success,
      message: success ? 'Stats successfully synced to Network Hub' : `Sync failed: ${resultText}`,
      stats_sent: payload.stats,
      timestamp: now.toISOString(),
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});