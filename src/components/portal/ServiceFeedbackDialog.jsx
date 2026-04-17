import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle2, Star } from 'lucide-react';
import { toast } from 'sonner';

const StarRating = ({ value, onChange, label }) => {
  const [hoverValue, setHoverValue] = useState(0);

  return (
    <div>
      <label className="text-sm font-semibold block mb-2">{label}</label>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map(star => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            onMouseEnter={() => setHoverValue(star)}
            onMouseLeave={() => setHoverValue(0)}
            className="transition-transform hover:scale-110"
          >
            <Star
              className={`w-8 h-8 ${
                star <= (hoverValue || value)
                  ? 'fill-amber-400 text-amber-400'
                  : 'text-gray-300'
              }`}
            />
          </button>
        ))}
      </div>
      <p className="text-xs text-muted-foreground mt-1">
        {value > 0 && ['Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][value - 1]}
      </p>
    </div>
  );
};

export default function ServiceFeedbackDialog({ open, onOpenChange, job, clientId }) {
  const [formData, setFormData] = useState({
    work_quality: 0,
    professionalism: 0,
    tidiness: 0,
    overall_satisfaction: 0,
    comments: '',
    would_recommend: null,
    improvements_suggested: ''
  });
  const queryClient = useQueryClient();

  const submitMutation = useMutation({
    mutationFn: async (data) => {
      return base44.entities.ServiceFeedback.create({
        ...data,
        client_id: clientId,
        job_id: job.id,
        job_title: job.title,
        service_date: job.scheduled_date,
        submitted_date: new Date().toISOString()
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientScheduledJobs', clientId] });
      queryClient.invalidateQueries({ queryKey: ['jobFeedback', clientId] });
      toast.success('Thank you! Your feedback has been submitted.');
      onOpenChange(false);
      setFormData({
        work_quality: 0,
        professionalism: 0,
        tidiness: 0,
        overall_satisfaction: 0,
        comments: '',
        would_recommend: null,
        improvements_suggested: ''
      });
    },
    onError: () => {
      toast.error('Failed to submit feedback. Please try again.');
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.overall_satisfaction === 0) {
      toast.error('Please provide an overall satisfaction rating');
      return;
    }
    submitMutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>How was your service?</DialogTitle>
          <DialogDescription>
            Help us improve by sharing your feedback about "{job.title}"
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Service Quality Ratings */}
          <div className="space-y-4">
            <h3 className="font-semibold text-base">Rate Your Experience</h3>

            <StarRating
              value={formData.work_quality}
              onChange={(v) => setFormData({...formData, work_quality: v})}
              label="Quality of Work"
            />

            <StarRating
              value={formData.professionalism}
              onChange={(v) => setFormData({...formData, professionalism: v})}
              label="Professionalism"
            />

            <StarRating
              value={formData.tidiness}
              onChange={(v) => setFormData({...formData, tidiness: v})}
              label="Cleanliness & Tidiness"
            />

            <div className="border-t pt-4">
              <StarRating
                value={formData.overall_satisfaction}
                onChange={(v) => setFormData({...formData, overall_satisfaction: v})}
                label="Overall Satisfaction *"
              />
            </div>
          </div>

          {/* Comments */}
          <div>
            <label className="text-sm font-semibold block mb-2">Your Feedback</label>
            <Textarea
              placeholder="Tell us what went well, what could be improved, or any other comments..."
              value={formData.comments}
              onChange={(e) => setFormData({...formData, comments: e.target.value})}
              className="min-h-24"
            />
          </div>

          {/* Would Recommend */}
          <div className="space-y-3">
            <label className="text-sm font-semibold block">Would you recommend this service?</label>
            <div className="flex gap-3">
              <Button
                type="button"
                variant={formData.would_recommend === true ? 'default' : 'outline'}
                onClick={() => setFormData({...formData, would_recommend: true})}
                className="flex-1"
              >
                <span className="text-lg mr-2">👍</span> Yes
              </Button>
              <Button
                type="button"
                variant={formData.would_recommend === false ? 'default' : 'outline'}
                onClick={() => setFormData({...formData, would_recommend: false})}
                className="flex-1"
              >
                <span className="text-lg mr-2">👎</span> No
              </Button>
            </div>
          </div>

          {/* Improvements */}
          <div>
            <label className="text-sm font-semibold block mb-2">Suggested Improvements (Optional)</label>
            <Textarea
              placeholder="Any suggestions for how we could improve this service?"
              value={formData.improvements_suggested}
              onChange={(e) => setFormData({...formData, improvements_suggested: e.target.value})}
              className="min-h-20"
            />
          </div>

          {/* Info Box */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-6 text-sm text-blue-900">
              <p className="flex gap-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
                Your feedback is valuable and helps us serve you better. Thank you!
              </p>
            </CardContent>
          </Card>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitMutation.isPending}
            >
              {submitMutation.isPending ? 'Submitting...' : 'Submit Feedback'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}