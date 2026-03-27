import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { job_id, job_title, client_name, client_email, scheduled_date, scheduled_time, organiser_name } = await req.json();

    if (!client_email || !scheduled_date) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Format date for readability
    const reminderDate = new Date(scheduled_date);
    const formattedDate = reminderDate.toLocaleDateString('en-GB', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });

    const emailBody = `Dear ${client_name},

We have an appointment coming up!

Service: ${job_title}
Date: ${formattedDate}
Time: ${scheduled_time || 'To be confirmed'}
Staff Member: ${organiser_name || 'Our team'}

If you need to reschedule or have any questions, please contact Age UK Bury on 0161 XXX XXXX.

Best regards,
Age UK Bury Team`;

    const result = await base44.integrations.Core.SendEmail({
      to: client_email,
      subject: `Reminder: Your Age UK Bury appointment on ${formattedDate}`,
      body: emailBody,
      from_name: 'Age UK Bury Appointments'
    });

    return Response.json({ 
      success: true, 
      message: 'Reminder sent',
      email_sent_to: client_email,
      job_id
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});