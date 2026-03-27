import React, { useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Heart, Users, Clock, Music, TrendingUp, Award } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns';

const COLORS = ['#8B4789', '#F5A623', '#7ED321', '#4FC3F7', '#E91E63'];

export default function ImpactDashboard() {
  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list(),
  });

  const { data: jobs = [] } = useQuery({
    queryKey: ['jobs'],
    queryFn: () => base44.entities.Job.list(),
  });

  const { data: timesheets = [] } = useQuery({
    queryKey: ['timesheets'],
    queryFn: () => base44.entities.TimesheetEntry.list(),
  });

  const { data: staff = [] } = useQuery({
    queryKey: ['staff'],
    queryFn: () => base44.entities.StaffMember.list(),
  });

  const { data: bookings = [] } = useQuery({
    queryKey: ['bookings'],
    queryFn: () => base44.entities.RoomBooking.list(),
  });

  const { data: referrals = [] } = useQuery({
    queryKey: ['referrals'],
    queryFn: () => base44.entities.Referral.list(),
  });

  // KPI Calculations
  const kpis = useMemo(() => {
    const volunteers = staff.filter(s => s.role === 'volunteer');
    
    // Total volunteer hours (from completed work entries)
    const volunteerHours = timesheets
      .filter(t => volunteers.some(v => v.id === t.staff_id) && t.entry_type === 'work')
      .reduce((sum, t) => sum + (t.hours_worked || 0), 0);

    // Dementia-related clients
    const dementiaClients = clients.filter(c => c.dementia_related && c.status === 'active').length;

    // Dementia interventions (jobs completed for dementia clients)
    const dementiaInterventions = jobs.filter(j => {
      const client = clients.find(c => c.id === j.client_id);
      return client?.dementia_related && j.status === 'completed';
    }).length;

    // Dementia-friendly activities from bookings
    const dementiaActivities = bookings.filter(b => 
      b.activity_name?.toLowerCase().includes('dementia') || 
      b.activity_name?.toLowerCase().includes('music in mind') ||
      b.recurring
    ).length;

    // Active clients served
    const activeClients = clients.filter(c => c.status === 'active').length;

    // Completed jobs
    const completedJobs = jobs.filter(j => j.status === 'completed').length;

    // Client referral success (active or completed referrals)
    const successfulReferrals = referrals.filter(r => 
      r.status === 'active' || r.status === 'closed'
    ).length;

    // Average job value
    const totalJobValue = jobs
      .filter(j => j.status === 'completed' && j.total_cost)
      .reduce((sum, j) => sum + j.total_cost, 0);
    const avgJobValue = completedJobs > 0 ? (totalJobValue / completedJobs).toFixed(2) : 0;

    // Client satisfaction (derived from referral outcomes)
    const referralsWithOutcome = referrals.filter(r => r.outcome);
    const satisfactionRate = referralsWithOutcome.length > 0 
      ? Math.round((referralsWithOutcome.filter(r => r.status === 'active').length / referralsWithOutcome.length) * 100)
      : 0;

    return {
      volunteerHours: volunteerHours.toFixed(1),
      dementiaClients,
      dementiaInterventions,
      dementiaActivities,
      activeClients,
      completedJobs,
      successfulReferrals,
      avgJobValue,
      satisfactionRate,
      volunteers: volunteers.length,
    };
  }, [clients, jobs, timesheets, staff, bookings, referrals]);

  // Monthly trends (last 6 months)
  const monthlyTrends = useMemo(() => {
    const months = Array.from({ length: 6 }, (_, i) => subMonths(new Date(), 5 - i));
    
    return months.map(month => {
      const monthStart = startOfMonth(month);
      const monthEnd = endOfMonth(month);
      
      const monthJobs = jobs.filter(j => {
        if (!j.completed_date) return false;
        const date = parseISO(j.completed_date);
        return isWithinInterval(date, { start: monthStart, end: monthEnd });
      });

      const monthTimesheets = timesheets.filter(t => {
        const date = parseISO(t.date);
        return isWithinInterval(date, { start: monthStart, end: monthEnd });
      });

      const volunteers = staff.filter(s => s.role === 'volunteer');
      const volunteerHours = monthTimesheets
        .filter(t => volunteers.some(v => v.id === t.staff_id) && t.entry_type === 'work')
        .reduce((sum, t) => sum + (t.hours_worked || 0), 0);

      return {
        month: format(month, 'MMM'),
        jobsCompleted: monthJobs.length,
        volunteerHours: parseFloat(volunteerHours.toFixed(1)),
        jobValue: monthJobs.reduce((sum, j) => sum + (j.total_cost || 0), 0),
      };
    });
  }, [jobs, timesheets, staff]);

  // Dementia support breakdown
  const dementiaBreakdown = useMemo(() => {
    return [
      { name: 'Dementia Clients', value: kpis.dementiaClients },
      { name: 'Non-Dementia', value: kpis.activeClients - kpis.dementiaClients },
    ];
  }, [kpis]);

  // Job status breakdown
  const jobBreakdown = useMemo(() => {
    const statuses = {};
    jobs.forEach(j => {
      statuses[j.status] = (statuses[j.status] || 0) + 1;
    });
    return Object.entries(statuses).map(([status, count]) => ({
      name: status.replace('_', ' ').charAt(0).toUpperCase() + status.slice(1),
      value: count,
    }));
  }, [jobs]);

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-heading font-bold">Impact & Outcomes</h1>
        <p className="text-muted-foreground mt-1">Key performance indicators and impact metrics</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Volunteer Hours</CardTitle>
              <Clock className="w-4 h-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.volunteerHours}</div>
            <p className="text-xs text-muted-foreground mt-1">{kpis.volunteers} active volunteers</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Dementia Support</CardTitle>
              <Heart className="w-4 h-4 text-destructive" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.dementiaClients}</div>
            <p className="text-xs text-muted-foreground mt-1">{kpis.dementiaInterventions} interventions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Active Clients</CardTitle>
              <Users className="w-4 h-4 text-secondary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.activeClients}</div>
            <p className="text-xs text-muted-foreground mt-1">{kpis.successfulReferrals} successful referrals</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Job Completion</CardTitle>
              <Award className="w-4 h-4 text-chart-2" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.completedJobs}</div>
            <p className="text-xs text-muted-foreground mt-1">£{kpis.avgJobValue} avg value</p>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Client Satisfaction</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold">{kpis.satisfactionRate}%</span>
              <Badge variant="outline" className="text-xs">Based on referral outcomes</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Dementia Activities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.dementiaActivities}</div>
            <p className="text-xs text-muted-foreground mt-1">Weekly sessions and programs</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Job Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              £{jobs
                .filter(j => j.status === 'completed')
                .reduce((sum, j) => sum + (j.total_cost || 0), 0)
                .toFixed(0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">From completed work</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Volunteer Hours & Jobs Trend */}
        <Card>
          <CardHeader>
            <CardTitle>6-Month Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Bar yAxisId="left" dataKey="jobsCompleted" fill="#8B4789" name="Jobs Completed" />
                <Bar yAxisId="right" dataKey="volunteerHours" fill="#F5A623" name="Volunteer Hours" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Job Value Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => `£${value.toFixed(0)}`} />
                <Line type="monotone" dataKey="jobValue" stroke="#7ED321" strokeWidth={2} name="Revenue" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Client Demographics */}
        <Card>
          <CardHeader>
            <CardTitle>Client Needs Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={dementiaBreakdown} cx="50%" cy="50%" labelLine={false} label={({ name, value }) => `${name}: ${value}`} outerRadius={100} fill="#8884d8" dataKey="value">
                  {dementiaBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Job Status */}
        <Card>
          <CardHeader>
            <CardTitle>Job Status Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={jobBreakdown} cx="50%" cy="50%" labelLine={false} label={({ name, value }) => `${name}: ${value}`} outerRadius={100} fill="#8884d8" dataKey="value">
                  {jobBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}