import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { waitlist_id, prospect_id, prospect_name, prospect_phone, prospect_email, prospect_town, prospect_dob } = await req.json();

    if (!waitlist_id || !prospect_name) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Parse prospect name
    const nameParts = prospect_name.trim().split(' ');
    const first_name = nameParts[0];
    const last_name = nameParts.slice(1).join(' ') || first_name;

    // Create new client from waitlist prospect
    const newClient = await base44.entities.Client.create({
      first_name,
      last_name,
      phone: prospect_phone || '',
      email: prospect_email || '',
      town: prospect_town || '',
      status: 'active',
      referral_source: 'waitlist',
      notes: `Converted from waitlist - was waiting for service`
    });

    // Update waitlist entry
    await base44.entities.Waitlist.update(waitlist_id, {
      status: 'converted',
      converted_to_client_id: newClient.id
    });

    return Response.json({
      success: true,
      message: 'Prospect converted to client',
      waitlist_id,
      client_id: newClient.id,
      client_name: `${first_name} ${last_name}`,
      phone: prospect_phone
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});