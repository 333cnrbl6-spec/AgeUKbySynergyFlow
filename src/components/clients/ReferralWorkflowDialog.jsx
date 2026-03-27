import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { base44 } from '@/api/base44Client';
import { Lightbulb, CheckCircle2 } from 'lucide-react';

export default function ReferralWorkflowDialog({ isOpen, onClose, client, triggerEvent, onReferralCreated }) {
  const [selectedService, setSelectedService] = useState('befriending');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const referralServices = [
    { value: 'befriending', label: 'Befriending Service', description: 'Regular visits or phone calls for companionship' },
    { value: 'day_centre', label: 'Day Centre Activity', description: 'Social and structured activities' },
    { value: 'activities', label: 'Social Activities', description: 'Hobby groups, events, outings' },
    { value: 'home_help', label: 'Home Help Service', description: 'Domestic support and assistance' },
    { value: 'foot_care', label: 'Foot Care Service', description: 'Professional toenail and foot care' },
    { value: 'it_training', label: 'IT Training', description: 'Digital skills and technology support' },
    { value: 'health_referral', label: 'Health Referral', description: 'NHS or specialist health services' },
    { value: 'other', label: 'Other Service', description: 'Custom referral' }
  ];

  const handleCreateReferral = async () => {
    try {
      setIsSubmitting(true);
      
      const referralEntry = {
        id: `ref_${Date.now()}`,
        service_type: selectedService,
        trigger_event: triggerEvent,
        referred_date: new Date().toISOString().split('T')[0],
        status: 'pending',
        referred_by: 'System - Automated Workflow',
        notes: notes
      };

      // Add referral to client's history
      const currentHistory = client.referral_history || [];
      const updatedHistory = [...currentHistory, referralEntry];

      await base44.entities.Client.update(client.id, {
        referral_history: updatedHistory
      });

      // Callback to parent
      if (onReferralCreated) {
        onReferralCreated(referralEntry);
      }

      // Reset form
      setSelectedService('befriending');
      setNotes('');
      onClose();
    } catch (error) {
      console.error('Error creating referral:', error);
      alert('Failed to create referral. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedServiceObj = referralServices.find(s => s.value === selectedService);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-amber-600" />
            Suggested Referral
          </DialogTitle>
          <DialogDescription>
            Based on the activity, we've identified a potential referral opportunity for {client?.first_name} {client?.last_name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Trigger Event */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm font-semibold text-blue-900 mb-1">What triggered this referral:</p>
            <p className="text-sm text-blue-800">{triggerEvent}</p>
          </div>

          {/* Client Status */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Client</p>
              <p className="font-semibold">{client?.first_name} {client?.last_name}</p>
              {client?.isolation_level && client.isolation_level !== 'unknown' && (
                <Badge variant="outline" className="mt-2">
                  {client.isolation_level === 'isolated' ? '🚨' : '⚠️'} {client.isolation_level}
                </Badge>
              )}
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Status</p>
              <p className="font-semibold text-foreground">{client?.status === 'active' ? '✓ Active' : 'Inactive'}</p>
            </div>
          </div>

          {/* Service Selection */}
          <div className="space-y-3">
            <label className="text-sm font-semibold">Referral Service</label>
            <Select value={selectedService} onValueChange={setSelectedService}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {referralServices.map(service => (
                  <SelectItem key={service.value} value={service.value}>
                    {service.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedServiceObj && (
              <p className="text-xs text-muted-foreground italic">
                {selectedServiceObj.description}
              </p>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-3">
            <label className="text-sm font-semibold">Notes (Optional)</label>
            <Textarea
              placeholder="Add any context or notes about why this referral is appropriate..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-20"
            />
          </div>

          {/* Auto-suggested reason */}
          {client?.isolation_level === 'isolated' && selectedService === 'befriending' && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-semibold text-green-900">Perfect match!</p>
                <p className="text-green-800 text-xs mt-1">Client shows signs of isolation—befriending services can help reduce loneliness and improve wellbeing.</p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Skip for Now
          </Button>
          <Button onClick={handleCreateReferral} disabled={isSubmitting}>
            {isSubmitting ? 'Creating...' : 'Create Referral'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}