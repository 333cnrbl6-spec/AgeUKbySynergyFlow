import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { base44 } from '@/api/base44Client';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

export default function JobCompletionModal({ isOpen, onClose, job, onReferralTrigger }) {
  const [isChecking, setIsChecking] = useState(false);
  const [referralSuggestion, setReferralSuggestion] = useState(null);

  useEffect(() => {
    if (isOpen && job) {
      checkReferralOpportunity();
    }
  }, [isOpen, job]);

  const checkReferralOpportunity = async () => {
    try {
      setIsChecking(true);
      
      // Get client details
      const clients = await base44.entities.Client.list();
      const client = clients.find(c => c.id === job.client_id);

      if (!client) return;

      // Check if isolated
      const isIsolated = client.isolation_level === 'isolated' || client.isolation_level === 'at_risk';
      
      if (isIsolated) {
        setReferralSuggestion({
          clientId: client.id,
          clientName: `${client.first_name} ${client.last_name}`,
          jobTitle: job.title,
          isolationLevel: client.isolation_level,
          message: `This client has been marked as ${client.isolation_level}. Consider recommending befriending services to reduce isolation.`
        });
      }
    } catch (error) {
      console.error('Error checking referral opportunity:', error);
    } finally {
      setIsChecking(false);
    }
  };

  const handleMakeReferral = () => {
    if (onReferralTrigger && referralSuggestion) {
      onReferralTrigger(referralSuggestion);
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            Job Completed
          </DialogTitle>
          <DialogDescription>
            Job: {job?.title}
          </DialogDescription>
        </DialogHeader>

        {isChecking ? (
          <div className="py-8 text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            <p className="mt-3 text-sm text-muted-foreground">Checking referral opportunities...</p>
          </div>
        ) : referralSuggestion ? (
          <div className="space-y-4">
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg flex gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-amber-900">Referral Opportunity</p>
                <p className="text-sm text-amber-800 mt-1">{referralSuggestion.message}</p>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-semibold">Client:</p>
              <p className="text-sm text-foreground">{referralSuggestion.clientName}</p>
              <Badge variant="outline">{referralSuggestion.isolationLevel}</Badge>
            </div>
          </div>
        ) : (
          <div className="py-8 text-center">
            <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Great work! No referrals needed at this time.</p>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          {referralSuggestion && (
            <Button onClick={handleMakeReferral}>
              Make Referral
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}