import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Phone, Mail, MapPin, FileText, History } from 'lucide-react';
import ReferralHistory from '@/components/clients/ReferralHistory';
import ClientFormDialog from '@/components/clients/ClientFormDialog';
import ClientInsightsWidget from '@/components/clients/ClientInsightsWidget';

export default function ClientDetails() {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const { data: client, isLoading, refetch } = useQuery({
    queryKey: ['client', clientId],
    queryFn: async () => {
      // Fetch single client - adjust based on your SDK method
      const clients = await base44.entities.Client.list();
      return clients.find(c => c.id === clientId);
    },
    enabled: !!clientId
  });

  const { data: jobs = [] } = useQuery({
    queryKey: ['client-jobs', clientId],
    queryFn: async () => {
      const allJobs = await base44.entities.Job.list();
      return allJobs.filter(j => j.client_id === clientId);
    },
    enabled: !!clientId
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-40 bg-muted rounded-lg animate-pulse" />
        <div className="h-64 bg-muted rounded-lg animate-pulse" />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Client not found</p>
        <Button variant="outline" onClick={() => navigate('/clients')} className="mt-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Clients
        </Button>
      </div>
    );
  }

  const handleSaveClient = async (data) => {
    await base44.entities.Client.update(clientId, data);
    refetch();
    setEditDialogOpen(false);
  };

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/clients')}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{client.first_name} {client.last_name}</h1>
          <Badge className="mt-2">{client.status === 'active' ? 'Active' : 'Inactive'}</Badge>
        </div>
        <Button onClick={() => setEditDialogOpen(true)}>Edit Details</Button>
      </div>

      {/* Main Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Phone className="w-4 h-4" />
              Phone
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-mono text-sm">{client.phone}</p>
          </CardContent>
        </Card>

        {client.email && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm break-all">{client.email}</p>
            </CardContent>
          </Card>
        )}

        {(client.town || client.postcode) && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Location
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{[client.town, client.postcode].filter(Boolean).join(', ')}</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Support Needs & Isolation */}
      {(client.isolation_level || client.support_needs?.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle>Support Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {client.isolation_level && (
              <div>
                <p className="text-sm font-semibold text-muted-foreground">Isolation Level</p>
                <Badge className={
                  client.isolation_level === 'isolated' ? 'bg-red-100 text-red-800' :
                  client.isolation_level === 'at_risk' ? 'bg-amber-100 text-amber-800' :
                  'bg-green-100 text-green-800'
                } className="mt-2">
                  {client.isolation_level}
                </Badge>
              </div>
            )}
            {client.support_needs?.length > 0 && (
              <div>
                <p className="text-sm font-semibold text-muted-foreground mb-2">Support Needs</p>
                <div className="flex flex-wrap gap-2">
                  {client.support_needs.map((need, idx) => (
                    <Badge key={idx} variant="secondary">{need}</Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* AI Insights Section */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
        <div className="mb-4">
          <h2 className="text-lg font-heading font-semibold flex items-center gap-2">
            <span className="text-2xl">✨</span>
            AI Client Insights
          </h2>
          <p className="text-sm text-muted-foreground mt-1">Personalized analysis to enhance client engagement</p>
        </div>
        <ClientInsightsWidget clientId={clientId} clientName={`${client.first_name} ${client.last_name}`} />
      </div>

      {/* Tabs */}
       <Tabs defaultValue="jobs" className="w-full">
         <TabsList className="grid w-full grid-cols-3">
           <TabsTrigger value="jobs">Jobs ({jobs.length})</TabsTrigger>
           <TabsTrigger value="referrals">
             <History className="w-4 h-4 mr-2" />
             Referral History
           </TabsTrigger>
           <TabsTrigger value="notes">Notes</TabsTrigger>
         </TabsList>

        {/* Jobs Tab */}
        <TabsContent value="jobs">
          <Card>
            <CardHeader>
              <CardTitle>Service Jobs</CardTitle>
              <CardDescription>Handyperson and other service jobs for this client</CardDescription>
            </CardHeader>
            <CardContent>
              {jobs.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">No jobs recorded yet</p>
              ) : (
                <div className="space-y-3">
                  {jobs.map(job => (
                    <div key={job.id} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-semibold">{job.title}</p>
                          <p className="text-sm text-muted-foreground">{job.job_type}</p>
                        </div>
                        <Badge>{job.status}</Badge>
                      </div>
                      {job.scheduled_date && (
                        <p className="text-sm text-muted-foreground">Scheduled: {new Date(job.scheduled_date).toLocaleDateString()}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Referral History Tab */}
        <TabsContent value="referrals">
          <ReferralHistory referrals={client.referral_history} />
        </TabsContent>

        {/* Notes Tab */}
        <TabsContent value="notes">
          <Card>
            <CardHeader>
              <CardTitle>Client Notes</CardTitle>
            </CardHeader>
            <CardContent>
              {client.notes ? (
                <p className="text-sm whitespace-pre-wrap">{client.notes}</p>
              ) : (
                <p className="text-sm text-muted-foreground py-8">No notes recorded yet</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <ClientFormDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        client={client}
        onSave={handleSaveClient}
      />
    </div>
  );
}