import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { waitlist_id } = body;

    const waitlist = await base44.entities.Waitlist.list();
    const item = waitlist.find(w => w.id === waitlist_id && w.branch_id === user.branch_id);

    if (!item) {
      return Response.json({ error: 'Not found' }, { status: 404 });
    }

    // Create client from waitlist
    const client = await base44.entities.Client.create({
      branch_id: user.branch_id,
      first_name: item.prospect_name.split(' ')[0],
      last_name: item.prospect_name.split(' ').slice(1).join(' '),
      phone: item.prospect_phone,
      email: item.prospect_email,
      town: item.prospect_town
    });

    // Update waitlist
    await base44.entities.Waitlist.update(waitlist_id, {
      converted_to_client_id: client.id,
      status: 'converted'
    });

    return Response.json({ client_id: client.id });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});