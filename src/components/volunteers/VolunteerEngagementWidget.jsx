import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw, TrendingUp, AlertCircle, Gift } from 'lucide-react';
import { toast } from 'sonner';
import { Progress } from '@/components/ui/progress';

export default function VolunteerEngagementWidget({ volunteerId, volunteerName }) {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadAnalysis = async () => {
    setLoading(true);
    try {
      const result = await base44.functions.invoke('analyzeVolunteerEngagement', {
        volunteer_id: volunteerId
      });

      if (result.data.success) {
        setAnalysis(result.data.analysis);
      } else {
        toast.error('Failed to analyze engagement');
      }
    } catch (error) {
      toast.error('Error analyzing volunteer');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalysis();
  }, [volunteerId]);

  if (loading && !analysis) {
    return (
      <Card>
        <CardContent className="pt-6 flex items-center justify-center py-12">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground ml-2">Analyzing engagement...</p>
        </CardContent>
      </Card>
    );
  }

  if (!analysis) return null;

  const engagementColors = {
    high: 'bg-green-100 text-green-800',
    medium: 'bg-blue-100 text-blue-800',
    low: 'bg-amber-100 text-amber-800',
    at_risk: 'bg-red-100 text-red-800'
  };

  return (
    <div className="space-y-4">
      {/* Engagement Level */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Engagement Status
            </span>
            <Badge className={engagementColors[analysis.engagement_level]}>
              {analysis.engagement_level.toUpperCase()}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{analysis.engagement_summary}</p>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Performance Metrics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {analysis.key_metrics && Object.entries(analysis.key_metrics).map(([key, value]) => (
            <div key={key}>
              <div className="flex justify-between mb-1">
                <p className="text-xs font-semibold text-muted-foreground uppercase">{key.replace(/_/g, ' ')}</p>
              </div>
              <p className="text-sm text-foreground">{value}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Risk Factors */}
      {analysis.risk_factors && analysis.risk_factors.length > 0 && (
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600" />
              Risk Factors
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {analysis.risk_factors.map((factor, idx) => (
                <li key={idx} className="text-sm flex gap-2">
                  <span className="text-amber-600">•</span>
                  <span>{factor}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Retention Strategies */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Retention Strategies</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {analysis.retention_strategies?.map((strategy, idx) => (
            <div key={idx} className="p-3 bg-muted rounded-lg border-l-4 border-primary">
              <div className="flex justify-between items-start mb-1">
                <p className="font-medium text-sm">{strategy.strategy}</p>
                <Badge variant={strategy.priority === 'high' ? 'default' : 'outline'} className="text-xs">
                  {strategy.priority}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground italic">{strategy.rationale}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Recognition Ideas */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Gift className="w-4 h-4" />
            Recognition Ideas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {analysis.recognition_ideas?.map((idea, idx) => (
              <li key={idx} className="text-sm flex gap-2">
                <span className="text-primary">✓</span>
                <span>{idea}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Recommended Opportunities */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Recommended Opportunities</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {analysis.recommended_opportunities?.map((opp, idx) => (
              <li key={idx} className="text-sm flex gap-2">
                <span className="font-semibold text-primary">{idx + 1}.</span>
                <span>{opp}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Button
        onClick={loadAnalysis}
        disabled={loading}
        variant="outline"
        className="w-full gap-2"
      >
        {loading && <Loader2 className="w-3 h-3 animate-spin" />}
        <RefreshCw className="w-3 h-3" />
        Re-analyze
      </Button>
    </div>
  );
}