import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * Generates a comprehensive AI-powered stakeholder report analyzing:
 * - Monthly service activity
 * - Client feedback trends
 * - Volunteer performance
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { month, year } = await req.json();
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    const targetMonth = month || currentMonth;
    const targetYear = year || currentYear;

    // Fetch all data
    const [jobs, clients, feedback, volunteers, referrals, servicRequests] = await Promise.all([
      base44.entities.Job.list(),
      base44.entities.Client.list(),
      base44.entities.ServiceFeedback.list(),
      base44.entities.Volunteer.list(),
      base44.entities.Referral.list(),
      base44.entities.ServiceRequest.list()
    ]);

    // Filter by month
    const filterByMonth = (items, dateField) => {
      return items.filter(item => {
        const date = new Date(item[dateField]);
        return date.getMonth() + 1 === targetMonth && date.getFullYear() === targetYear;
      });
    };

    const monthlyJobs = filterByMonth(jobs, 'created_date');
    const monthlyFeedback = filterByMonth(feedback, 'submitted_date');
    const monthlyRequests = filterByMonth(servicRequests, 'submitted_date');

    // Calculate metrics
    const completedJobs = monthlyJobs.filter(j => j.status === 'completed').length;
    const totalJobRevenue = monthlyJobs.filter(j => j.status === 'completed').reduce((sum, j) => sum + (j.total_cost || 0), 0);
    const avgJobCost = completedJobs > 0 ? (totalJobRevenue / completedJobs).toFixed(2) : 0;

    // Feedback analysis
    const avgSatisfaction = monthlyFeedback.length > 0
      ? (monthlyFeedback.reduce((sum, f) => sum + (f.overall_satisfaction || 0), 0) / monthlyFeedback.length).toFixed(1)
      : 0;
    
    const recommendationRate = monthlyFeedback.length > 0
      ? ((monthlyFeedback.filter(f => f.would_recommend).length / monthlyFeedback.length) * 100).toFixed(1)
      : 0;

    // Volunteer performance
    const activeVolunteers = volunteers.filter(v => v.status === 'active').length;
    const topVoluneer = volunteers.sort((a, b) => (b.jobs_completed || 0) - (a.jobs_completed || 0))[0];

    // Build context for AI
    const reportContext = `
MONTHLY REPORT SUMMARY (${targetMonth}/${targetYear})

SERVICE DELIVERY:
- Jobs Completed: ${completedJobs}
- Total Jobs: ${monthlyJobs.length}
- Total Revenue: £${totalJobRevenue.toFixed(2)}
- Average Job Cost: £${avgJobCost}
- Most Common Job Types: ${[...new Set(monthlyJobs.map(j => j.job_type))].slice(0, 3).join(', ')}

CLIENT FEEDBACK (${monthlyFeedback.length} responses):
- Average Satisfaction: ${avgSatisfaction}/5
- Recommendation Rate: ${recommendationRate}%
- Common Praise: ${monthlyFeedback.filter(f => f.would_recommend).length} positive, ${monthlyFeedback.filter(f => !f.would_recommend).length} constructive feedback

SERVICE REQUESTS:
- New Requests: ${monthlyRequests.length}
- Request Types: ${[...new Set(monthlyRequests.map(r => r.request_type))].join(', ')}

VOLUNTEER METRICS:
- Active Volunteers: ${activeVolunteers}
- Top Performer: ${topVoluneer?.name || 'N/A'} (${topVoluneer?.jobs_completed || 0} jobs completed)

CLIENT INSIGHTS:
- Total Clients: ${clients.length}
- At-Risk/Isolated: ${clients.filter(c => c.isolation_level === 'at_risk' || c.isolation_level === 'isolated').length}
- New Referrals: ${filterByMonth(referrals, 'received_date').length}

Generate a professional stakeholder report that:
1. Summarizes key performance metrics
2. Analyzes trends in client feedback
3. Highlights volunteer contributions and engagement
4. Identifies areas of excellence and improvement
5. Provides actionable recommendations for the next month
6. Includes impact statements suitable for funders/partners

Format the response as valid JSON with these fields:
{
  "executive_summary": "1-2 paragraph overview",
  "service_delivery": {
    "title": "Service Delivery Report",
    "key_metrics": [{"label": "...", "value": "..."}],
    "insights": "Detailed analysis"
  },
  "feedback_analysis": {
    "title": "Client Feedback Trends",
    "highlights": ["positive trend 1", "positive trend 2"],
    "areas_for_improvement": ["area 1", "area 2"],
    "detailed_analysis": "In-depth feedback interpretation"
  },
  "volunteer_performance": {
    "title": "Volunteer Team Performance",
    "key_contributors": ["name1", "name2"],
    "engagement_insights": "Analysis of volunteer engagement",
    "retention_recommendations": ["strategy1", "strategy2"]
  },
  "impact_statement": "Compelling story about lives changed this month",
  "recommendations": [
    {"action": "specific action", "rationale": "why", "timeline": "when"}
  ],
  "metrics_summary": {
    "jobs_completed": number,
    "client_satisfaction": number,
    "volunteer_participation": number,
    "total_impact_value": "£amount"
  }
}`;

    const analysis = await base44.integrations.Core.InvokeLLM({
      prompt: reportContext,
      response_json_schema: {
        type: 'object',
        properties: {
          executive_summary: { type: 'string' },
          service_delivery: { type: 'object' },
          feedback_analysis: { type: 'object' },
          volunteer_performance: { type: 'object' },
          impact_statement: { type: 'string' },
          recommendations: { type: 'array' },
          metrics_summary: { type: 'object' }
        }
      }
    });

    return Response.json({
      success: true,
      month: targetMonth,
      year: targetYear,
      reportData: analysis,
      rawMetrics: {
        completedJobs,
        totalRevenue: totalJobRevenue,
        feedbackResponses: monthlyFeedback.length,
        avgSatisfaction,
        recommendationRate,
        activeVolunteers
      }
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});