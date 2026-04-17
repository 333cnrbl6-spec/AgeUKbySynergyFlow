import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Mail, Send } from 'lucide-react';
import { toast } from 'sonner';

export default function OpportunitySummaryModal({ isOpen, onOpenChange, volunteerId, volunteerName, jobId, jobTitle }) {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadSummary = async () => {
    if (!volunteerId || !jobId) return;

    setLoading(true);
    try {
      const result = await base44.functions.invoke('generateOpportunitySummary', {
        volunteer_id: volunteerId,
        job_id: jobId
      });

      if (result.data.success) {
        setSummary(result.data.summary);
      } else {
        toast.error('Failed to generate summary');
      }
    } catch (error) {
      toast.error('Error generating summary');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (open) => {
    if (open && !summary) {
      loadSummary();
    }
    onOpenChange(open);
  };

  const handleSendEmail = async () => {
    if (!summary) return;

    try {
      const emailBody = `
Hi ${volunteerName},

${summary.hook}

${summary.why_great_fit}

${summary.impact_statement}

Key Benefits:
${summary.key_benefits?.map(b => `• ${b}`).join('\n')}

${summary.call_to_action}

Best regards,
Age UK Bury Volunteer Team
      `.trim();

      // Send would be through an email function - for now just toast
      toast.success('Ready to send! This would be sent via your email system.');
    } catch (error) {
      toast.error('Error preparing email');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Opportunity for {volunteerName}</DialogTitle>
          <DialogDescription>Personalized summary for: {jobTitle}</DialogDescription>
        </DialogHeader>

        {loading && !summary ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground ml-2">Generating personalized summary...</p>
          </div>
        ) : summary ? (
          <div className="space-y-4">
            {/* Title & Hook */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">{summary.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm italic text-primary font-medium">{summary.hook}</p>
              </CardContent>
            </Card>

            {/* Why Great Fit */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Why This is Perfect for You</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-foreground">{summary.why_great_fit}</p>
              </CardContent>
            </Card>

            {/* Impact */}
            <Card className="bg-green-50 border-green-200">
              <CardContent className="pt-6">
                <p className="text-sm font-medium text-green-900">{summary.impact_statement}</p>
              </CardContent>
            </Card>

            {/* Key Benefits */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Key Benefits</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {summary.key_benefits?.map((benefit, idx) => (
                    <li key={idx} className="text-sm flex gap-2">
                      <Badge variant="outline" className="mt-0.5">✓</Badge>
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* CTA */}
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="pt-6">
                <p className="text-sm font-medium text-blue-900">{summary.call_to_action}</p>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                onClick={handleSendEmail}
                className="flex-1 gap-2"
              >
                <Mail className="w-4 h-4" />
                Send as Email
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => onOpenChange(false)}
              >
                Close
              </Button>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}