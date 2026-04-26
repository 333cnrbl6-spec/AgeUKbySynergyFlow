import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Ping the Hub to check connection status
    const branches = await base44.entities.Branch.list();
    const thisBranch = branches.find(b => b.id === user.branch_id);

    if (!thisBranch) {
      return Response.json({ status: 'unknown' });
    }

    return Response.json({
      branch_id: user.branch_id,
      branch_name: thisBranch.branch_name,
      status: thisBranch.status,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return Response.json({ error: error.message, status: 'disconnected' }, { status: 500 });
  }
});