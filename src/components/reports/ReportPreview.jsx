import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, TrendingUp, Users, Target } from 'lucide-react';

export default function ReportPreview({ reportData, month, year }) {
  const data = reportData.reportData;

  return (
    <div id="report-preview" className="space-y-6 bg-white p-8">
      {/* Header */}
      <div className="border-b pb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Age UK Bury</h1>
            <p className="text-lg text-gray-600">Monthly Stakeholder Report</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-primary">{month} {year}</p>
            <p className="text-sm text-gray-500 mt-1">Generated {new Date().toLocaleDateString()}</p>
          </div>
        </div>
      </div>

      {/* Executive Summary */}
      <div className="bg-blue-50 border-l-4 border-blue-600 p-6 rounded">
        <h2 className="text-2xl font-bold text-gray-900 mb-3">Executive Summary</h2>
        <p className="text-gray-700 leading-relaxed">{data.executive_summary}</p>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-50 p-4 rounded border">
          <p className="text-sm text-gray-600 font-semibold">JOBS COMPLETED</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{data.metrics_summary.jobs_completed}</p>
        </div>
        <div className="bg-gray-50 p-4 rounded border">
          <p className="text-sm text-gray-600 font-semibold">CLIENT SATISFACTION</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{data.metrics_summary.client_satisfaction}/5</p>
        </div>
        <div className="bg-gray-50 p-4 rounded border">
          <p className="text-sm text-gray-600 font-semibold">VOLUNTEERS ACTIVE</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{data.metrics_summary.volunteer_participation}</p>
        </div>
        <div className="bg-gray-50 p-4 rounded border">
          <p className="text-sm text-gray-600 font-semibold">TOTAL IMPACT VALUE</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{data.metrics_summary.total_impact_value}</p>
        </div>
      </div>

      {/* Service Delivery Section */}
      <div className="page-break">
        <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-primary" />
          {data.service_delivery.title}
        </h2>
        <p className="text-gray-700 mb-4 leading-relaxed">{data.service_delivery.insights}</p>
        <div className="grid grid-cols-2 gap-3">
          {data.service_delivery.key_metrics?.map((metric, idx) => (
            <div key={idx} className="bg-gray-50 p-3 rounded">
              <p className="text-xs text-gray-600 font-semibold">{metric.label}</p>
              <p className="text-xl font-bold text-gray-900 mt-1">{metric.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Feedback Analysis */}
      <div className="page-break">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          {data.feedback_analysis.title}
        </h2>
        <p className="text-gray-700 mb-4 leading-relaxed">{data.feedback_analysis.detailed_analysis}</p>

        <div className="grid grid-cols-1 gap-4 mt-4">
          {data.feedback_analysis.highlights?.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                Highlights
              </h3>
              <ul className="space-y-2">
                {data.feedback_analysis.highlights.map((highlight, idx) => (
                  <li key={idx} className="text-gray-700 flex gap-2">
                    <span className="text-green-600">✓</span>
                    {highlight}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {data.feedback_analysis.areas_for_improvement?.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Areas for Improvement</h3>
              <ul className="space-y-2">
                {data.feedback_analysis.areas_for_improvement.map((area, idx) => (
                  <li key={idx} className="text-gray-700 flex gap-2">
                    <span className="text-amber-600">→</span>
                    {area}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Volunteer Performance */}
      <div className="page-break">
        <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Users className="w-6 h-6 text-primary" />
          {data.volunteer_performance.title}
        </h2>
        <p className="text-gray-700 mb-4 leading-relaxed">{data.volunteer_performance.engagement_insights}</p>

        {data.volunteer_performance.key_contributors?.length > 0 && (
          <div className="mb-4">
            <h3 className="font-semibold text-gray-900 mb-2">Key Contributors</h3>
            <ul className="space-y-1">
              {data.volunteer_performance.key_contributors.map((vol, idx) => (
                <li key={idx} className="text-gray-700">• {vol}</li>
              ))}
            </ul>
          </div>
        )}

        {data.volunteer_performance.retention_recommendations?.length > 0 && (
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Retention Strategies</h3>
            <ul className="space-y-2">
              {data.volunteer_performance.retention_recommendations.map((rec, idx) => (
                <li key={idx} className="text-gray-700 text-sm">
                  <span className="font-semibold">{idx + 1}.</span> {rec}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Impact Statement */}
      <div className="bg-green-50 border-l-4 border-green-600 p-6 rounded">
        <h2 className="text-xl font-bold text-gray-900 mb-3">Our Impact This Month</h2>
        <p className="text-gray-700 leading-relaxed italic">"{data.impact_statement}"</p>
      </div>

      {/* Recommendations */}
      {data.recommendations?.length > 0 && (
        <div className="page-break">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Target className="w-6 h-6 text-primary" />
            Recommendations for Next Month
          </h2>
          <div className="space-y-3">
            {data.recommendations.map((rec, idx) => (
              <div key={idx} className="border-l-4 border-primary pl-4 py-2">
                <h3 className="font-semibold text-gray-900">{rec.action}</h3>
                <p className="text-sm text-gray-600 mt-1">{rec.rationale}</p>
                <p className="text-xs text-gray-500 mt-1">Timeline: {rec.timeline}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="border-t pt-6 mt-8 text-center text-xs text-gray-500">
        <p>This report was generated using AI analysis of Age UK Bury's operational data.</p>
        <p>For more information, please contact the management team.</p>
      </div>
    </div>
  );
}