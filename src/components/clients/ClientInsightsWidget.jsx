import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw, Lightbulb, MessageCircle, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

export default function ClientInsightsWidget({ clientId, clientName }) {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  const loadInsights = async () => {
    setLoading(true);
    try {
      const result = await base44.functions.invoke('analyzeClientNeeds', {
        client_id: clientId
      });

      if (result.data.success) {
        setInsights(result.data.insights);
        setLastUpdated(new Date());
      } else {
        toast.error('Failed to analyze client');
      }
    } catch (error) {
      toast.error('Error analyzing client');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInsights();
  }, [clientId]);

  if (loading && !insights) {
    return (
      <Card>
        <CardContent className="pt-6 flex items-center justify-center py-12">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground ml-2">Analyzing client profile...</p>
        </CardContent>
      </Card>
    );
  }

  if (!insights) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Interaction Summary */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-yellow-600" />
            Interaction Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{insights.interaction_summary}</p>
        </CardContent>
      </Card>

      {/* Predicted Needs */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-600" />
            Predicted Needs
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {insights.predicted_needs?.map((need, idx) => (
              <Badge key={idx} className="bg-blue-100 text-blue-800">{need}</Badge>
            ))}
          </div>
          <p className="text-xs text-muted-foreground italic">{insights.predicted_needs_reasoning}</p>
        </CardContent>
      </Card>

      {/* Communication Strategy */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <MessageCircle className="w-4 h-4 text-green-600" />
            Communication Strategy
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase">Best Contact Method</p>
              <Badge variant="outline" className="mt-1">
                {insights.communication_strategy?.best_contact_method}
              </Badge>
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase">Tone</p>
              <Badge variant="outline" className="mt-1">
                {insights.communication_strategy?.communication_tone}
              </Badge>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Key Talking Points</p>
            <ul className="text-sm space-y-1">
              {insights.communication_strategy?.key_talking_points?.map((point, idx) => (
                <li key={idx} className="flex gap-2">
                  <span className="text-primary">•</span>
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Engagement Tips</p>
            <ul className="text-sm space-y-1 bg-muted/50 p-3 rounded-lg">
              {insights.communication_strategy?.engagement_tips?.map((tip, idx) => (
                <li key={idx} className="flex gap-2">
                  <span className="text-primary">✓</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Recommended Actions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Recommended Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {insights.recommended_actions?.map((action, idx) => (
              <li key={idx} className="flex gap-3 text-sm">
                <span className="font-semibold text-primary min-w-fit">{idx + 1}.</span>
                <span>{action}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Refresh button */}
      <div className="flex justify-between items-center">
        <p className="text-xs text-muted-foreground">
          {lastUpdated && `Last analyzed: ${lastUpdated.toLocaleTimeString()}`}
        </p>
        <Button
          size="sm"
          variant="outline"
          onClick={loadInsights}
          disabled={loading}
          className="gap-2"
        >
          {loading && <Loader2 className="w-3 h-3 animate-spin" />}
          <RefreshCw className="w-3 h-3" />
          Re-analyze
        </Button>
      </div>
    </div>
  );
}