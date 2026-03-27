import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LogOut, Calendar, Wrench, User, AlertCircle } from 'lucide-react';
import ClientActivityBooking from '@/components/portal/ClientActivityBooking';
import ClientServiceRequest from '@/components/portal/ClientServiceRequest';
import ClientProfile from '@/components/portal/ClientProfile';

export default function ClientPortal() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');

  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['clientPortalUser'],
    queryFn: async () => {
      try {
        return await base44.auth.me();
      } catch {
        return null;
      }
    }
  });

  const { data: client, isLoading: clientLoading } = useQuery({
    queryKey: ['clientPortalProfile', user?.email],
    queryFn: async () => {
      if (!user?.email) return null;
      const clients = await base44.entities.Client.list();
      return clients.find(c => c.email === user.email);
    },
    enabled: !!user?.email
  });

  const { data: bookings = [] } = useQuery({
    queryKey: ['clientBookings', client?.id],
    queryFn: async () => {
      if (!client?.id) return [];
      const allBookings = await base44.entities.ClientBooking.list();
      return allBookings.filter(b => b.client_id === client.id && b.status === 'confirmed');
    },
    enabled: !!client?.id
  });

  const { data: requests = [] } = useQuery({
    queryKey: ['clientRequests', client?.id],
    queryFn: async () => {
      if (!client?.id) return [];
      const allRequests = await base44.entities.ServiceRequest.list();
      return allRequests.filter(r => r.client_id === client.id);
    },
    enabled: !!client?.id
  });

  const handleLogout = async () => {
    await base44.auth.logout('/');
  };

  const isLoading = userLoading || clientLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-primary/10 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto"></div>
          <p className="mt-3 text-sm text-muted-foreground">Loading your portal...</p>
        </div>
      </div>
    );
  }

  if (!user || !client) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-primary/10 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-600" />
              Access Required
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              To access your client portal, please log in with your email address.
            </p>
            <Button onClick={() => navigate('/')} className="w-full">
              Log In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-primary/10 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Welcome, {client.first_name}!</h1>
            <p className="text-muted-foreground mt-1">Your Age UK Bury Portal</p>
          </div>
          <Button variant="outline" onClick={handleLogout} className="gap-2">
            <LogOut className="w-4 h-4" />
            Log Out
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Upcoming Activities</p>
                  <p className="text-2xl font-bold mt-1">{bookings.filter(b => new Date(b.scheduled_date) > new Date()).length}</p>
                </div>
                <Calendar className="w-8 h-8 text-primary opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending Requests</p>
                  <p className="text-2xl font-bold mt-1">{requests.filter(r => r.status === 'submitted' || r.status === 'acknowledged').length}</p>
                </div>
                <Wrench className="w-8 h-8 text-amber-600 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Account Status</p>
                  <Badge className="mt-2">{client.status === 'active' ? '✓ Active' : 'Inactive'}</Badge>
                </div>
                <User className="w-8 h-8 text-green-600 opacity-20" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="activities">Activities</TabsTrigger>
            <TabsTrigger value="requests">Requests</TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
          </TabsList>

          {/* Dashboard */}
          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Upcoming Activities */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Upcoming Activities
                  </CardTitle>
                  <CardDescription>Your scheduled sessions</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {bookings.filter(b => new Date(b.scheduled_date) > new Date()).length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4">No upcoming activities. <Button variant="link" className="p-0" onClick={() => setActiveTab('activities')}>Browse available activities</Button></p>
                  ) : (
                    bookings.filter(b => new Date(b.scheduled_date) > new Date()).slice(0, 3).map(booking => (
                      <div key={booking.id} className="p-3 bg-muted rounded-lg">
                        <p className="font-semibold text-sm">{booking.activity_name}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(booking.scheduled_date).toLocaleDateString()} at {booking.start_time}
                        </p>
                        {booking.facility_name && (
                          <p className="text-xs text-muted-foreground">{booking.facility_name}</p>
                        )}
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              {/* Service Requests */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Wrench className="w-5 h-5" />
                    Your Requests
                  </CardTitle>
                  <CardDescription>Repair & service requests</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {requests.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4">No requests yet. <Button variant="link" className="p-0" onClick={() => setActiveTab('requests')}>Submit a request</Button></p>
                  ) : (
                    requests.slice(0, 3).map(request => (
                      <div key={request.id} className="p-3 bg-muted rounded-lg">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-semibold text-sm">{request.title}</p>
                            <p className="text-xs text-muted-foreground mt-1">{request.request_type}</p>
                          </div>
                          <Badge variant="outline" className="text-xs whitespace-nowrap">{request.status}</Badge>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Help & Support */}
            <Card className="bg-blue-50 border-blue-200">
              <CardHeader>
                <CardTitle className="text-lg">Need Help?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <p>If you have any questions or need assistance, please contact us:</p>
                <div className="space-y-1">
                  <p><strong>Phone:</strong> <span className="font-mono">0161 793 8000</span></p>
                  <p><strong>Email:</strong> <span className="font-mono">support@ageukbury.org.uk</span></p>
                  <p><strong>Hours:</strong> Monday–Friday, 9am–5pm</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Activities */}
          <TabsContent value="activities">
            <ClientActivityBooking client={client} />
          </TabsContent>

          {/* Service Requests */}
          <TabsContent value="requests">
            <ClientServiceRequest client={client} />
          </TabsContent>

          {/* Profile */}
          <TabsContent value="profile">
            <ClientProfile client={client} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}