import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import {
  BarChart, Bar, PieChart, Pie, LineChart, Line, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Users, Target, MapPin, Zap } from 'lucide-react';

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

        {/* Charts */}
        <Tabs defaultValue="conversion" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="conversion">Conversion</TabsTrigger>
            <TabsTrigger value="services">Services</TabsTrigger>
            <TabsTrigger value="location">Location</TabsTrigger>
            <TabsTrigger value="sources">Sources</TabsTrigger>
          </TabsList>

          {/* Conversion Tab */}
          <TabsContent value="conversion" className="space-y-4">
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
          <TabsContent value="services" className="space-y-4">
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

          {/* Location Tab */}
          <TabsContent value="location" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Prospect Distribution by Ward Area</CardTitle>
                <CardDescription>Catchment area coverage across Bury</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={wardAreaData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="value" fill="#3b82f6" name="Prospects" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Ward Summary Table */}
            <Card>
              <CardHeader>
                <CardTitle>Area Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {wardAreaData.map((area) => {
                    const areaProspects = prospects.filter(p => p.town === area.name);
                    const converted = areaProspects.filter(p => p.contact_status === 'converted_to_client').length;
                    const rate = areaProspects.length > 0 ? ((converted / areaProspects.length) * 100).toFixed(1) : 0;
                    return (
                      <div key={area.name} className="flex justify-between items-center p-3 bg-muted rounded-lg">
                        <div className="flex items-center gap-3">
                          <MapPin className="w-4 h-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium">{area.name}</p>
                            <p className="text-xs text-muted-foreground">{area.value} prospects</p>
                          </div>
                        </div>
                        <Badge variant="outline">{rate}% converted</Badge>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Sources Tab */}
          <TabsContent value="sources" className="space-y-4">
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