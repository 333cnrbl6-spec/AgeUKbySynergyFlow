import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { job_id, job_title, client_name, client_email, completed_date } = await req.json();

    if (!client_email) {
      return Response.json({ error: 'Missing client email' }, { status: 400 });
    }

    const completedDate = new Date(completed_date || new Date()).toLocaleDateString('en-GB', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const emailBody = `Dear ${client_name},

Thank you for choosing Age UK Bury for "${job_title}"!

We completed your service on ${completedDate}. We would greatly appreciate your feedback to help us continue providing excellent service.

Please take a moment to answer these quick questions:

1. How satisfied were you with the service provided?
   ☐ Very Satisfied  ☐ Satisfied  ☐ Neutral  ☐ Dissatisfied

2. Did the staff member arrive on time?
   ☐ Yes  ☐ No  ☐ Slightly Late

3. Was the work completed to your expectations?
   ☐ Exceeded expectations  ☐ Met expectations  ☐ Below expectations

4. How likely are you to recommend Age UK Bury to friends or family?
   ☐ Very Likely  ☐ Likely  ☐ Unlikely  ☐ Very Unlikely

5. Any additional comments or suggestions for improvement:
   _________________________________________________________________


You can reply to this email with your responses, or contact us on 0161 XXX XXXX.

Your feedback is invaluable and helps us serve you better.

Best regards,
Age UK Bury Team`;

    const result = await base44.integrations.Core.SendEmail({
      to: client_email,
      subject: `We'd love your feedback on your recent Age UK Bury service`,
      body: emailBody,
      from_name: 'Age UK Bury Feedback'
    });

    return Response.json({ 
      success: true, 
      message: 'Survey sent',
      email_sent_to: client_email,
      job_id
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});