import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle2, Clock, MapPin, User, ChevronRight } from 'lucide-react';
import ServiceFeedbackDialog from './ServiceFeedbackDialog';
import { format } from 'date-fns';

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  in_progress: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-gray-100 text-gray-800'
};

const statusIcons = {
  pending: <Clock className="w-4 h-4" />,
  in_progress: <AlertCircle className="w-4 h-4" />,
  completed: <CheckCircle2 className="w-4 h-4" />
};

export default function ClientScheduledJobs({ clientId }) {
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);

  const { data: jobs = [] } = useQuery({
    queryKey: ['clientScheduledJobs', clientId],
    queryFn: async () => {
      if (!clientId) return [];
      const allJobs = await base44.entities.Job.list();
      return allJobs
        .filter(j => j.client_id === clientId)
        .sort((a, b) => {
          // Upcoming first, then in progress, then completed
          const statusOrder = { pending: 0, in_progress: 1, completed: 2, cancelled: 3 };
          return statusOrder[a.status] - statusOrder[b.status];
        });
    },
    enabled: !!clientId
  });

  const { data: feedback = [] } = useQuery({
    queryKey: ['jobFeedback', clientId],
    queryFn: async () => {
      if (!clientId) return [];
      const allFeedback = await base44.entities.ServiceFeedback.list();
      return allFeedback.filter(f => f.client_id === clientId);
    },
    enabled: !!clientId
  });

  const handleFeedback = (job) => {
    setSelectedJob(job);
    setFeedbackOpen(true);
  };

  const hasFeedback = (jobId) => feedback.some(f => f.job_id === jobId);

  if (jobs.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6 text-center py-12">
          <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
          <p className="text-muted-foreground">No scheduled jobs yet</p>
          <p className="text-xs text-muted-foreground mt-1">Your scheduled services will appear here</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4">
        {jobs.map(job => {
          const jobFeedback = feedback.find(f => f.job_id === job.id);
          const isCompleted = job.status === 'completed';

          return (
            <Card key={job.id} className={isCompleted ? 'opacity-75' : ''}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <CardTitle className="text-base truncate">{job.title}</CardTitle>
                      <Badge className={statusColors[job.status]} variant="outline">
                        {statusIcons[job.status]}
                        <span className="ml-1 capitalize">{job.status}</span>
                      </Badge>
                    </div>
                    <CardDescription className="text-xs">{job.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Job Details Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {job.scheduled_date && (
                    <div className="flex gap-2 text-sm">
                      <Clock className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      <div>
                        <p className="font-medium">{format(new Date(job.scheduled_date), 'MMMM d, yyyy')}</p>
                        {job.scheduled_time && <p className="text-xs text-muted-foreground">{job.scheduled_time}</p>}
                      </div>
                    </div>
                  )}

                  {job.address && (
                    <div className="flex gap-2 text-sm">
                      <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                      <p>{job.address}, {job.town}</p>
                    </div>
                  )}

                  {job.assigned_to && (
                    <div className="flex gap-2 text-sm col-span-1 sm:col-span-2">
                      <User className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                      <p>Assigned to: <strong>{job.assigned_to}</strong></p>
                    </div>
                  )}
                </div>

                {/* Progress Indicator */}
                {job.status === 'in_progress' && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-sm font-medium text-blue-900">Work in Progress</p>
                    <p className="text-xs text-blue-800 mt-1">Our team is working on your request. We'll notify you when complete.</p>
                  </div>
                )}

                {job.status === 'completed' && !jobFeedback && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <p className="text-sm font-medium text-green-900 mb-2">✓ Service Completed</p>
                    <p className="text-xs text-green-800 mb-3">We'd love to hear about your experience!</p>
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 text-white"
                      onClick={() => handleFeedback(job)}
                    >
                      Share Feedback
                      <ChevronRight className="w-3 h-3 ml-1" />
                    </Button>
                  </div>
                )}

                {jobFeedback && (
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                    <p className="text-sm font-medium text-purple-900 mb-2">✓ Feedback Submitted</p>
                    <div className="flex gap-1">
                      {[...Array(Math.round(jobFeedback.overall_satisfaction))].map((_, i) => (
                        <span key={i} className="text-lg">⭐</span>
                      ))}
                    </div>
                    {jobFeedback.comments && (
                      <p className="text-xs text-purple-800 mt-2 italic">"{jobFeedback.comments.substring(0, 80)}..."</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Feedback Dialog */}
      {selectedJob && (
        <ServiceFeedbackDialog
          open={feedbackOpen}
          onOpenChange={setFeedbackOpen}
          job={selectedJob}
          clientId={clientId}
        />
      )}
    </div>
  );
}