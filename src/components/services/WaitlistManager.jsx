import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, Users, Clock, TrendingUp, CheckCircle2, Phone, Mail } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';

export default function WaitlistManager() {
  const [selectedService, setSelectedService] = useState("");
  const [prioritized, setPrioritized] = useState(null);
  const [loadingPrioritize, setLoadingPrioritize] = useState(false);
  const [convertingId, setConvertingId] = useState(null);
  const [convertFormData, setConvertFormData] = useState({});
  const qc = useQueryClient();

  const { data: waitlist = [] } = useQuery({
    queryKey: ['waitlist'],
    queryFn: () => base44.entities.Waitlist.list('-date_added', 500),
  });

  // Get unique services with waitlists
  const services = useMemo(() => {
    const serviceSet = new Set(waitlist.map(w => w.service_name));
    return Array.from(serviceSet).sort();
  }, [waitlist]);

  // Filter by selected service
  const serviceWaitlist = useMemo(() => {
    if (!selectedService) return [];
    return waitlist.filter(w => w.service_name === selectedService && w.status === 'waiting');
  }, [waitlist, selectedService]);

  const prioritizeMutation = useMutation({
    mutationFn: async () => {
      setLoadingPrioritize(true);
      const result = await base44.functions.invoke('prioritizeWaitlist', { 
        service_name: selectedService 
      });
      setPrioritized(result.data.prioritized);
      setLoadingPrioritize(false);
      return result.data;
    },
  });

  const convertMutation = useMutation({
    mutationFn: async (data) => {
      const result = await base44.functions.invoke('convertWaitlistToClient', data);
      return result.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['waitlist'] });
      setPrioritized(null);
      setConvertingId(null);
      setConvertFormData({});
      toast.success('Prospect converted to client');
    },
  });

  const handleConvert = async (waitlistEntry) => {
    setConvertingId(waitlistEntry.id);
    setConvertFormData({
      waitlist_id: waitlistEntry.id,
      prospect_id: waitlistEntry.prospect_id,
      prospect_name: waitlistEntry.prospect_name,
      prospect_phone: waitlistEntry.prospect_phone || '',
      prospect_email: waitlistEntry.prospect_email || '',
      prospect_town: waitlistEntry.prospect_town || '',
      prospect_dob: ''
    });
  };

  const handleSubmitConvert = async () => {
    await convertMutation.mutateAsync(convertFormData);
  };

  const displayList = prioritized || serviceWaitlist;
  const waitingCount = serviceWaitlist.length;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-heading font-bold mb-2">Service Waitlists</h2>
        <p className="text-sm text-muted-foreground">Manage prospect queues for popular services</p>
      </div>

      {/* Service Selector */}
      {services.length > 0 && (
        <div className="flex gap-3 items-end">
          <div className="flex-1">
            <Label className="text-sm">Select Service</Label>
            <Select value={selectedService} onValueChange={setSelectedService}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a service with waitlist" />
              </SelectTrigger>
              <SelectContent>
                {services.map(service => {
                  const count = waitlist.filter(w => w.service_name === service && w.status === 'waiting').length;
                  return (
                    <SelectItem key={service} value={service}>
                      {service} ({count} waiting)
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
          {selectedService && (
            <Button 
              onClick={() => prioritizeMutation.mutate()}
              disabled={loadingPrioritize || waitingCount === 0}
              variant="outline"
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              Prioritize List
            </Button>
          )}
        </div>
      )}

      {/* Service Stats */}
      {selectedService && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Users className="w-4 h-4" /> {selectedService}
              </span>
              <Badge variant="secondary">{waitingCount} waiting</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-3 gap-3">
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-xs text-muted-foreground">Total Waiting</p>
              <p className="text-2xl font-bold text-blue-700">{waitingCount}</p>
            </div>
            <div className="p-3 bg-red-50 rounded-lg border border-red-200">
              <p className="text-xs text-muted-foreground">Urgent</p>
              <p className="text-2xl font-bold text-red-700">
                {serviceWaitlist.filter(w => w.urgency === 'urgent').length}
              </p>
            </div>
            <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
              <p className="text-xs text-muted-foreground">Soon</p>
              <p className="text-2xl font-bold text-amber-700">
                {serviceWaitlist.filter(w => w.urgency === 'soon').length}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Waitlist Display */}
      {selectedService && displayList.length === 0 ? (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>No prospects on waitlist for this service.</AlertDescription>
        </Alert>
      ) : selectedService ? (
        <div className="space-y-2">
          {displayList.map((entry, idx) => (
            <Card key={entry.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10">
                        <span className="text-sm font-bold text-primary">#{entry.position || idx + 1}</span>
                      </div>
                      <div>
                        <h3 className="font-semibold">{entry.prospect_name}</h3>
                        <div className="flex flex-wrap gap-2 mt-1">
                          <Badge 
                            variant="outline"
                            className={
                              entry.urgency === 'urgent' ? 'bg-red-50 text-red-700 border-red-200' :
                              entry.urgency === 'soon' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                              'bg-blue-50 text-blue-700 border-blue-200'
                            }
                          >
                            {entry.urgency}
                          </Badge>
                          {entry.prospect_town && (
                            <Badge variant="outline">{entry.prospect_town}</Badge>
                          )}
                          {entry.score && (
                            <Badge variant="outline" className="bg-green-50 text-green-700">
                              Score: {entry.score}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Contact Info */}
                    <div className="flex flex-wrap gap-4 text-xs text-muted-foreground mt-3">
                      {entry.prospect_phone && (
                        <a href={`tel:${entry.prospect_phone}`} className="flex items-center gap-1 hover:text-primary">
                          <Phone className="w-3 h-3" /> {entry.prospect_phone}
                        </a>
                      )}
                      {entry.prospect_email && (
                        <a href={`mailto:${entry.prospect_email}`} className="flex items-center gap-1 hover:text-primary">
                          <Mail className="w-3 h-3" /> {entry.prospect_email}
                        </a>
                      )}
                      {entry.days_waiting !== undefined && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {entry.days_waiting} days waiting
                        </span>
                      )}
                    </div>

                    {entry.reason_for_interest && (
                      <p className="text-xs text-muted-foreground mt-2 italic">{entry.reason_for_interest}</p>
                    )}
                  </div>

                  {/* Actions */}
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button 
                        size="sm" 
                        onClick={() => handleConvert(entry)}
                      >
                        <CheckCircle2 className="w-4 h-4 mr-1" />
                        Convert to Client
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Convert to Active Client</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <Alert>
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>
                            This will create a new client record for {entry.prospect_name} and mark them as active.
                          </AlertDescription>
                        </Alert>

                        <div className="space-y-3">
                          <div>
                            <Label>Name</Label>
                            <Input 
                              value={convertFormData.prospect_name || ''} 
                              onChange={(e) => setConvertFormData(prev => ({ ...prev, prospect_name: e.target.value }))}
                            />
                          </div>
                          <div>
                            <Label>Phone</Label>
                            <Input 
                              value={convertFormData.prospect_phone || ''} 
                              onChange={(e) => setConvertFormData(prev => ({ ...prev, prospect_phone: e.target.value }))}
                            />
                          </div>
                          <div>
                            <Label>Email</Label>
                            <Input 
                              type="email"
                              value={convertFormData.prospect_email || ''} 
                              onChange={(e) => setConvertFormData(prev => ({ ...prev, prospect_email: e.target.value }))}
                            />
                          </div>
                          <div>
                            <Label>Town</Label>
                            <Select value={convertFormData.prospect_town || ''} onValueChange={(v) => setConvertFormData(prev => ({ ...prev, prospect_town: v }))}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select town" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Bury">Bury</SelectItem>
                                <SelectItem value="Ramsbottom">Ramsbottom</SelectItem>
                                <SelectItem value="Tottington">Tottington</SelectItem>
                                <SelectItem value="Prestwich">Prestwich</SelectItem>
                                <SelectItem value="Radcliffe">Radcliffe</SelectItem>
                                <SelectItem value="Whitefield">Whitefield</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-2">
                          <Button variant="outline">Cancel</Button>
                          <Button 
                            onClick={handleSubmitConvert}
                            disabled={convertMutation.isPending}
                          >
                            {convertMutation.isPending ? 'Converting...' : 'Confirm Conversion'}
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Select a service to view the waitlist.</AlertDescription>
        </Alert>
      )}
    </div>
  );
}