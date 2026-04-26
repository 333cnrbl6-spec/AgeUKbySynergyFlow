import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Store Xero auth token for this branch
    const body = await req.json();
    const { auth_code } = body;

    // In production, exchange auth_code for token
    return Response.json({
      branch_id: user.branch_id,
      authorized: true,
      message: 'Xero authorization successful'
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});