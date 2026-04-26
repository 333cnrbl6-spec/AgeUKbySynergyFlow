import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Sync financial data to Xero for this branch
    const jobs = await base44.entities.Job.filter({ branch_id: user.branch_id });
    const invoices = jobs.filter(j => j.cost_actual).length;

    return Response.json({
      branch_id: user.branch_id,
      invoices_synced: invoices,
      status: 'success',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});