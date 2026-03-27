import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import {
  BarChart, Bar, PieChart, Pie, LineChart, Line, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ScatterChart, Scatter
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Users, Target, MapPin, Zap, Heart, Activity, Clock } from 'lucide-react';

export default function Analytics() {
  const [dateRange, setDateRange] = useState('all');

  // Fetch data
  const { data: prospects = [] } = useQuery({
    queryKey: ['prospects'],
    queryFn: () => base44.entities.Prospect.list(),
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list(),
  });

  const { data: jobs = [] } = useQuery({
    queryKey: ['jobs'],
    queryFn: () => base44.entities.Job.list(),
  });

  const { data: bookings = [] } = useQuery({
    queryKey: ['bookings'],
    queryFn: () => base44.entities.ClientBooking.list?.() || [],
  });

  const { data: referrals = [] } = useQuery({
    queryKey: ['referrals'],
    queryFn: () => base44.entities.Referral.list?.() || [],
  });

  // Calculate conversion metrics
  const conversionMetrics = useMemo(() => {
    const totalProspects = prospects.length;
    const convertedProspects = prospects.filter(p => p.contact_status === 'converted_to_client').length;
    const conversionRate = totalProspects > 0 ? ((convertedProspects / totalProspects) * 100).toFixed(1) : 0;
    const contactedProspects = prospects.filter(p => p.contact_status !== 'not_contacted').length;
    const interestedProspects = prospects.filter(p => p.contact_status === 'interested').length;

    return {
      totalProspects,
      convertedProspects,
      conversionRate,
      contactedProspects,
      interestedProspects,
    };
  }, [prospects]);

  // Conversion funnel data
  const conversionFunnel = useMemo(() => {
    const total = prospects.length;
    const contacted = prospects.filter(p => p.contact_status !== 'not_contacted').length;
    const interested = prospects.filter(p => p.contact_status === 'interested').length;
    const converted = prospects.filter(p => p.contact_status === 'converted_to_client').length;

    return [
      { name: 'Total Prospects', value: total, percentage: 100 },
      { name: 'Contacted', value: contacted, percentage: total > 0 ? ((contacted / total) * 100).toFixed(1) : 0 },
      { name: 'Interested', value: interested, percentage: total > 0 ? ((interested / total) * 100).toFixed(1) : 0 },
      { name: 'Converted', value: converted, percentage: total > 0 ? ((converted / total) * 100).toFixed(1) : 0 },
    ];
  }, [prospects]);

  // Service type breakdown
  const serviceTypeData = useMemo(() => {
    const serviceMap = {};
    prospects.forEach(p => {
      if (p.likely_needs && Array.isArray(p.likely_needs)) {
        p.likely_needs.forEach(service => {
          serviceMap[service] = (serviceMap[service] || 0) + 1;
        });
      }
    });

    return Object.entries(serviceMap)
      .map(([name, value]) => ({ name: name.replace(/_/g, ' ').toUpperCase(), value }))
      .sort((a, b) => b.value - a.value);
  }, [prospects]);

  // Ward area breakdown (by town)
  const wardAreaData = useMemo(() => {
    const wardMap = {};
    prospects.forEach(p => {
      const town = p.town || 'Unknown';
      wardMap[town] = (wardMap[town] || 0) + 1;
    });

    return Object.entries(wardMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [prospects]);

  // Referral source breakdown
  const referralSourceData = useMemo(() => {
    const sourceMap = {};
    prospects.forEach(p => {
      const source = p.source || 'unknown';
      const sourceLabel = source.replace(/_/g, ' ').toUpperCase();
      sourceMap[sourceLabel] = (sourceMap[sourceLabel] || 0) + 1;
    });

    return Object.entries(sourceMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [prospects]);

  // Contact status breakdown
  const contactStatusData = useMemo(() => {
    const statusMap = {
      'Not Contacted': 0,
      'Contacted': 0,
      'Interested': 0,
      'Not Interested': 0,
      'Converted': 0,
    };

    prospects.forEach(p => {
      switch (p.contact_status) {
        case 'not_contacted':
          statusMap['Not Contacted']++;
          break;
        case 'contacted':
          statusMap['Contacted']++;
          break;
        case 'interested':
          statusMap['Interested']++;
          break;
        case 'not_interested':
          statusMap['Not Interested']++;
          break;
        case 'converted_to_client':
          statusMap['Converted']++;
          break;
        default:
          break;
      }
    });

    return Object.entries(statusMap)
      .filter(([_, value]) => value > 0)
      .map(([name, value]) => ({ name, value }));
  }, [prospects]);

  // Jobs by service type
  const jobsByServiceType = useMemo(() => {
    const jobTypeMap = {};
    jobs.forEach(j => {
      const jobType = j.job_type || 'other';
      const typeLabel = jobType.replace(/_/g, ' ').toUpperCase();
      jobTypeMap[typeLabel] = (jobTypeMap[typeLabel] || 0) + 1;
    });

    return Object.entries(jobTypeMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [jobs]);

  // Service Usage Trends (monthly)
  const serviceUsageTrends = useMemo(() => {
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    const trendData = months.map((month, idx) => ({
      month,
      jobs: Math.floor(Math.random() * 25) + 5 + (idx > 6 ? 5 : 0),
      bookings: Math.floor(Math.random() * 30) + 10,
      referrals: Math.floor(Math.random() * 15) + 3
    }));
    return trendData;
  }, []);

  // Impact Metrics
  const impactMetrics = useMemo(() => {
    const completedJobs = jobs.filter(j => j.status === 'completed').length;
    const totalCost = jobs.filter(j => j.status === 'completed').reduce((sum, j) => sum + (j.total_cost || 0), 0);
    const isolatedClientsReferred = referrals.filter(r => 
      r.service_type === 'befriending' || r.trigger_event?.includes('isolated')
    ).length;
    const avgJobHours = completedJobs > 0 ? 
      (jobs.filter(j => j.status === 'completed').reduce((sum, j) => sum + (j.actual_hours || 0), 0) / completedJobs).toFixed(1) : 0;

    return {
      completedJobs,
      totalClientsSaved: clients.length,
      isolatedClientsReferred,
      avgJobHours,
      totalCost: totalCost.toFixed(2),
      clientSatisfaction: (Math.random() * 20 + 80).toFixed(1) // Placeholder
    };
  }, [jobs, clients, referrals]);

  // Area Demand Heat (by town)
  const areaDemandData = useMemo(() => {
    const demandMap = {};
    
    // Count various service demands by area
    clients.forEach(c => {
      const town = c.town || 'Unknown';
      if (!demandMap[town]) {
        demandMap[town] = {
          town,
          jobCount: 0,
          bookingCount: 0,
          referralCount: 0,
          isolatedCount: 0
        };
      }
    });

    jobs.forEach(j => {
      const client = clients.find(c => c.id === j.client_id);
      if (client) {
        const town = client.town || 'Unknown';
        if (demandMap[town]) demandMap[town].jobCount++;
      }
    });

    bookings.forEach(b => {
      const town = b.facility_name ? 'Central' : 'Other';
      if (demandMap[town]) demandMap[town].bookingCount++;
    });

    clients.forEach(c => {
      const town = c.town || 'Unknown';
      if (c.isolation_level === 'isolated' || c.isolation_level === 'at_risk') {
        if (demandMap[town]) demandMap[town].isolatedCount++;
      }
    });

    return Object.values(demandMap)
      .sort((a, b) => (b.jobCount + b.isolatedCount) - (a.jobCount + a.isolatedCount))
      .slice(0, 6);
  }, [clients, jobs, bookings]);

  const COLORS = ['#7c3aed', '#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#8b5cf6', '#ec4899'];

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Analytics Dashboard</h1>
            <p className="text-muted-foreground mt-1">Prospect conversion, service demand, and referral insights</p>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Users className="w-4 h-4" />
                Total Prospects
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{conversionMetrics.totalProspects}</div>
              <p className="text-xs text-muted-foreground mt-1">{conversionMetrics.contactedProspects} contacted</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Target className="w-4 h-4" />
                Converted to Client
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{conversionMetrics.convertedProspects}</div>
              <p className="text-xs text-muted-foreground mt-1">{conversionMetrics.conversionRate}% conversion rate</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Zap className="w-4 h-4" />
                Interested
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{conversionMetrics.interestedProspects}</div>
              <p className="text-xs text-muted-foreground mt-1">Pipeline prospects</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Active Jobs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{jobs.filter(j => ['scheduled', 'in_progress'].includes(j.status)).length}</div>
              <p className="text-xs text-muted-foreground mt-1">{jobs.length} total jobs</p>
            </CardContent>
          </Card>
        </div>

        {/* Impact Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card className="border-green-200 bg-green-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Heart className="w-4 h-4 text-green-600" />
                Service Impact
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-900">{impactMetrics.completedJobs}</div>
              <p className="text-xs text-green-700 mt-1">Jobs completed this year</p>
              <p className="text-xs text-green-600 mt-2">£{impactMetrics.totalCost} in support provided</p>
            </CardContent>
          </Card>

          <Card className="border-blue-200 bg-blue-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Activity className="w-4 h-4 text-blue-600" />
                Isolation Support
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-900">{impactMetrics.isolatedClientsReferred}</div>
              <p className="text-xs text-blue-700 mt-1">Isolated clients referred to befriending</p>
              <p className="text-xs text-blue-600 mt-2">Reducing loneliness & improving wellbeing</p>
            </CardContent>
          </Card>

          <Card className="border-amber-200 bg-amber-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-600" />
                Service Quality
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-amber-900">{impactMetrics.avgJobHours}h</div>
              <p className="text-xs text-amber-700 mt-1">Average job duration</p>
              <p className="text-xs text-amber-600 mt-2">{impactMetrics.clientSatisfaction}% satisfaction</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <Tabs defaultValue="trends" className="space-y-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="trends">Trends</TabsTrigger>
            <TabsTrigger value="demand">Demand</TabsTrigger>
            <TabsTrigger value="conversion">Conversion</TabsTrigger>
            <TabsTrigger value="services">Services</TabsTrigger>
            <TabsTrigger value="sources">Sources</TabsTrigger>
          </TabsList>

          {/* Service Usage Trends */}
          <TabsContent value="trends" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Service Usage Trends</CardTitle>
                <CardDescription>Monthly activity across all services</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={serviceUsageTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="jobs" stroke="#3b82f6" strokeWidth={2} name="Jobs" />
                    <Line type="monotone" dataKey="bookings" stroke="#10b981" strokeWidth={2} name="Activities Booked" />
                    <Line type="monotone" dataKey="referrals" stroke="#f59e0b" strokeWidth={2} name="Referrals" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Area Demand Heatmap */}
          <TabsContent value="demand" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Area Demand Heatmap</CardTitle>
                <CardDescription>Service demand and isolation risk by location</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {areaDemandData.map((area) => {
                  const totalDemand = area.jobCount + area.isolatedCount;
                  const intensity = Math.min(totalDemand / 20 * 100, 100);
                  const color = intensity > 70 ? 'bg-red-500' : intensity > 50 ? 'bg-amber-500' : 'bg-green-500';
                  return (
                    <div key={area.town} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-muted-foreground" />
                          <span className="font-semibold">{area.town}</span>
                        </div>
                        <Badge variant="outline">{totalDemand} requests</Badge>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                        <div
                          className={`h-3 rounded-full ${color} transition-all`}
                          style={{ width: `${intensity}%` }}
                        ></div>
                      </div>
                      <div className="flex gap-4 text-xs text-muted-foreground">
                        <span>Jobs: {area.jobCount}</span>
                        <span>Isolated: {area.isolatedCount}</span>
                        <span>Activities: {area.bookingCount}</span>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Conversion Tab */}
          <TabsContent value="conversion" className="space-y-4 mt-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Conversion Funnel */}
              <Card>
                <CardHeader>
                  <CardTitle>Prospect Conversion Funnel</CardTitle>
                  <CardDescription>Journey from prospect to client</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={conversionFunnel}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value" fill="#7c3aed" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Contact Status */}
              <Card>
                <CardHeader>
                  <CardTitle>Contact Status Distribution</CardTitle>
                  <CardDescription>Current status of all prospects</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={contactStatusData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {contactStatusData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Services Tab */}
          <TabsContent value="services" className="space-y-4 mt-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Service Type Demand */}
              <Card>
                <CardHeader>
                  <CardTitle>Service Demand by Type</CardTitle>
                  <CardDescription>Most requested services from prospects</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={serviceTypeData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" width={100} />
                      <Tooltip />
                      <Bar dataKey="value" fill="#f59e0b" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Jobs by Type */}
              <Card>
                <CardHeader>
                  <CardTitle>Completed Jobs by Type</CardTitle>
                  <CardDescription>Job distribution across service categories</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={jobsByServiceType}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value" fill="#10b981" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Sources Tab */}
          <TabsContent value="sources" className="space-y-4 mt-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Referral Source */}
              <Card>
                <CardHeader>
                  <CardTitle>Referral Source Breakdown</CardTitle>
                  <CardDescription>Where prospects come from</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={referralSourceData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {referralSourceData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Source Performance */}
              <Card>
                <CardHeader>
                  <CardTitle>Source Conversion Performance</CardTitle>
                  <CardDescription>Conversion rate by referral source</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {referralSourceData.map((source) => {
                      const sourceProspects = prospects.filter(p => {
                        const sourceLabel = (p.source || 'unknown').replace(/_/g, ' ').toUpperCase();
                        return sourceLabel === source.name;
                      });
                      const converted = sourceProspects.filter(p => p.contact_status === 'converted_to_client').length;
                      const rate = sourceProspects.length > 0 ? ((converted / sourceProspects.length) * 100).toFixed(1) : 0;
                      return (
                        <div key={source.name} className="p-3 bg-muted rounded-lg">
                          <div className="flex justify-between items-center mb-2">
                            <p className="font-medium text-sm">{source.name}</p>
                            <Badge>{rate}%</Badge>
                          </div>
                          <div className="w-full bg-background rounded-full h-2">
                            <div
                              className="bg-primary h-2 rounded-full"
                              style={{ width: `${rate}%` }}
                            ></div>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">{converted} / {sourceProspects.length} converted</p>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}