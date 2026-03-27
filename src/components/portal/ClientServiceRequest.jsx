import React, { useState } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

export default function ClientServiceRequest({ client }) {
  const [formData, setFormData] = useState({
    request_type: 'handyperson',
    job_category: 'handrails',
    title: '',
    description: '',
    urgency: 'routine',
    preferred_dates: [],
    client_notes: ''
  });
  const [selectedDates, setSelectedDates] = useState([]);
  const queryClient = useQueryClient();

  const { data: requests = [] } = useQuery({
    queryKey: ['clientServiceRequests', client.id],
    queryFn: async () => {
      const allRequests = await base44.entities.ServiceRequest.list();
      return allRequests.filter(r => r.client_id === client.id);
    }
  });

  const submitMutation = useMutation({
    mutationFn: async (data) => {
      return base44.entities.ServiceRequest.create({
        ...data,
        client_id: client.id,
        client_name: `${client.first_name} ${client.last_name}`,
        client_phone: client.phone,
        client_email: client.email,
        submitted_date: new Date().toISOString().split('T')[0],
        status: 'submitted'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientServiceRequests'] });
      setFormData({
        request_type: 'handyperson',
        job_category: 'handrails',
        title: '',
        description: '',
        urgency: 'routine',
        preferred_dates: [],
        client_notes: ''
      });
      setSelectedDates([]);
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    submitMutation.mutate({
      ...formData,
      preferred_dates: selectedDates
    });
  };

  const jobCategories = [
    'handrails', 'security_locks', 'shelves', 'curtain_rails',
    'wall_decorations', 'minor_plumbing', 'painting_decorating', 'light_bulbs',
    'flat_pack', 'smoke_alarms', 'key_safes', 'draught_excluders',
    'carpet_cleaning', 'minor_gardening', 'fence_painting', 'furniture_moving', 'other'
  ];

  return (
    <div className="space-y-6">
      {/* Request Form */}
      <Card>
        <CardHeader>
          <CardTitle>Request a Service</CardTitle>
          <CardDescription>Submit a request for repairs, maintenance, or other services</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Service Type */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold block mb-2">Service Type</label>
                <Select value={formData.request_type} onValueChange={(value) => setFormData({...formData, request_type: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="handyperson">Handyperson Service</SelectItem>
                    <SelectItem value="foot_care">Foot Care</SelectItem>
                    <SelectItem value="information">Information/Advice</SelectItem>
                    <SelectItem value="befriending">Befriending</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.request_type === 'handyperson' && (
                <div>
                  <label className="text-sm font-semibold block mb-2">Job Category</label>
                  <Select value={formData.job_category} onValueChange={(value) => setFormData({...formData, job_category: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {jobCategories.map(cat => (
                        <SelectItem key={cat} value={cat}>
                          {cat.replace(/_/g, ' ')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {/* Title */}
            <div>
              <label className="text-sm font-semibold block mb-2">Summary</label>
              <Input
                placeholder="Brief description of what you need"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="text-sm font-semibold block mb-2">Detailed Description</label>
              <Textarea
                placeholder="Provide more details about what needs to be done..."
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="min-h-24"
              />
            </div>

            {/* Urgency */}
            <div>
              <label className="text-sm font-semibold block mb-2">Urgency</label>
              <Select value={formData.urgency} onValueChange={(value) => setFormData({...formData, urgency: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="routine">Routine (no rush)</SelectItem>
                  <SelectItem value="soon">Soon (within 2 weeks)</SelectItem>
                  <SelectItem value="urgent">Urgent (ASAP)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Additional Notes */}
            <div>
              <label className="text-sm font-semibold block mb-2">Additional Notes (Optional)</label>
              <Textarea
                placeholder="Any other information that might be helpful..."
                value={formData.client_notes}
                onChange={(e) => setFormData({...formData, client_notes: e.target.value})}
                className="min-h-16"
              />
            </div>

            {/* Alert */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg flex gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-blue-800">
                We'll review your request and contact you within 2 working days to discuss next steps.
              </p>
            </div>

            <Button type="submit" className="w-full" disabled={submitMutation.isPending}>
              {submitMutation.isPending ? 'Submitting...' : 'Submit Request'}
            </Button>
          </form>

          {submitMutation.isSuccess && (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg flex gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-green-900">Request Submitted!</p>
                <p className="text-sm text-green-800 mt-1">We'll review your request and contact you soon.</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Previous Requests */}
      {requests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Your Service Requests</CardTitle>
            <CardDescription>History of your submitted requests</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {requests.map(request => (
              <div key={request.id} className="p-4 border rounded-lg">
                <div className="flex items-start justify-between gap-4 mb-2">
                  <div>
                    <p className="font-semibold">{request.title}</p>
                    <p className="text-sm text-muted-foreground">{request.request_type}</p>
                  </div>
                  <Badge>{request.status}</Badge>
                </div>
                {request.staff_notes && (
                  <p className="text-sm bg-muted p-2 rounded mt-2">{request.staff_notes}</p>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}