import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COLORS = ['#6B3FA0', '#FFAA00', '#10B981', '#3B82F6', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6'];

export default function NetworkAnalytics() {
  const [selectedBranch, setSelectedBranch] = useState(null);

  // Fetch all data across network
  const { data: jobs = [], isLoading: jobsLoading } = useQuery({
    queryKey: ['jobs-network'],
    queryFn: () => base44.entities.Job.list()
  });

  const { data: volunteers = [] } = useQuery({
    queryKey: ['volunteers-network'],
    queryFn: () => base44.entities.Volunteer.list()
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['clients-network'],
    queryFn: () => base44.entities.Client.list()
  });

  const { data: kindTransactions = [] } = useQuery({
    queryKey: ['kind-transactions-network'],
    queryFn: () => base44.entities.KindCreditsTransaction.list()
  });

  const { data: branches = [] } = useQuery({
    queryKey: ['branches'],
    queryFn: () => base44.entities.Branch.list()
  });

  // Aggregate data by branch
  const aggregateByBranch = () => {
    const branchData = {};
    
    branches.forEach(branch => {
      branchData[branch.id] = {
        branch_id: branch.id,
        branch_name: branch.branch_name,
        jobs_completed: 0,
        active_jobs: 0,
        total_revenue: 0,
        active_volunteers: 0,
        total_clients: 0,
        kind_credits_used: 0,
        kind_credits_earned: 0
      };
    });

    jobs.forEach(job => {
      if (branchData[job.branch_id]) {
        if (job.status === 'completed') {
          branchData[job.branch_id].jobs_completed++;
        }
        if (job.status === 'in_progress' || job.status === 'assigned') {
          branchData[job.branch_id].active_jobs++;
        }
        if (job.cost_actual) {
          branchData[job.branch_id].total_revenue += job.cost_actual;
        }
      }
    });

    volunteers.forEach(vol => {
      if (branchData[vol.branch_id] && vol.status === 'active') {
        branchData[vol.branch_id].active_volunteers++;
      }
    });

    clients.forEach(client => {
      if (branchData[client.branch_id]) {
        branchData[client.branch_id].total_clients++;
      }
    });

    kindTransactions.forEach(txn => {
      if (branchData[txn.branch_id]) {
        if (txn.type === 'spent_claim' || txn.type === 'spent_reserve') {
          branchData[txn.branch_id].kind_credits_used += txn.amount;
        } else if (txn.type === 'earned_listing' || txn.type === 'earned_bonus') {
          branchData[txn.branch_id].kind_credits_earned += txn.amount;
        }
      }
    });

    return Object.values(branchData);
  };

  const branchMetrics = aggregateByBranch();
  
  // Network-wide KPIs
  const networkKPIs = {
    total_jobs: jobs.filter(j => j.status === 'completed').length,
    active_jobs: jobs.filter(j => j.status === 'in_progress' || j.status === 'assigned').length,
    total_revenue: jobs.reduce((sum, j) => sum + (j.cost_actual || 0), 0),
    active_volunteers: volunteers.filter(v => v.status === 'active').length,
    total_clients: clients.length,
    kind_credits_used: kindTransactions.filter(t => t.type.includes('spent')).reduce((sum, t) => sum + t.amount, 0),
    kind_credits_earned: kindTransactions.filter(t => t.type.includes('earned')).reduce((sum, t) => sum + t.amount, 0)
  };

  // Conversion rate (prospects to clients)
  const conversionRate = clients.length > 0 
    ? ((clients.length / (clients.length + 50)) * 100).toFixed(1)
    : 0;

  if (jobsLoading) {
    return <div className="p-8 text-center">Loading network analytics...</div>;
  }

  const filteredMetrics = selectedBranch 
    ? branchMetrics.filter(m => m.branch_id === selectedBranch)
    : branchMetrics;

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Network Hub Analytics</h1>
        <p className="text-muted-foreground mt-2">Aggregate performance across all Age UK branches</p>
      </div>

      {/* Network KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Total Jobs Completed</div>
            <div className="text-3xl font-bold text-primary mt-2">{networkKPIs.total_jobs}</div>
            <div className="text-xs text-muted-foreground mt-2">
              {networkKPIs.active_jobs} active
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Active Volunteers</div>
            <div className="text-3xl font-bold text-primary mt-2">{networkKPIs.active_volunteers}</div>
            <div className="text-xs text-muted-foreground mt-2">
              {(networkKPIs.active_volunteers > 0 ? Math.round(networkKPIs.total_jobs / networkKPIs.active_volunteers) : 0)} jobs/volunteer
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Network Revenue</div>
            <div className="text-3xl font-bold text-primary mt-2">£{networkKPIs.total_revenue.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground mt-2">
              Avg: £{networkKPIs.total_jobs > 0 ? Math.round(networkKPIs.total_revenue / networkKPIs.total_jobs) : 0}/job
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">KindCredits Circulation</div>
            <div className="text-3xl font-bold text-primary mt-2">{networkKPIs.kind_credits_earned.toFixed(0)}</div>
            <div className="text-xs text-muted-foreground mt-2">
              {networkKPIs.kind_credits_used.toFixed(0)} used
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Branch Filter */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filter by Branch</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Badge 
              variant={!selectedBranch ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => setSelectedBranch(null)}
            >
              All Branches
            </Badge>
            {branches.map(branch => (
              <Badge 
                key={branch.id}
                variant={selectedBranch === branch.id ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setSelectedBranch(branch.id)}
              >
                {branch.branch_name}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Branch Comparison Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Jobs Completed by Branch */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Jobs Completed by Branch</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={filteredMetrics || branchMetrics}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="branch_name" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="jobs_completed" fill="#6B3FA0" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Active Volunteers by Branch */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Active Volunteers by Branch</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={filteredMetrics || branchMetrics}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="branch_name" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="active_volunteers" fill="#FFAA00" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Revenue by Branch */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Revenue by Branch</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={filteredMetrics || branchMetrics}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="branch_name" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip formatter={(value) => `£${value.toLocaleString()}`} />
                <Bar dataKey="total_revenue" fill="#10B981" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* KindCredits Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">KindCredits Activity by Branch</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={filteredMetrics || branchMetrics}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="branch_name" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="kind_credits_earned" fill="#3B82F6" name="Earned" />
                <Bar dataKey="kind_credits_used" fill="#EF4444" name="Used" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Branch Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Branch Performance Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border">
                <tr>
                  <th className="text-left py-3 px-4 font-semibold">Branch</th>
                  <th className="text-right py-3 px-4">Jobs Complete</th>
                  <th className="text-right py-3 px-4">Active Jobs</th>
                  <th className="text-right py-3 px-4">Volunteers</th>
                  <th className="text-right py-3 px-4">Clients</th>
                  <th className="text-right py-3 px-4">Revenue</th>
                  <th className="text-right py-3 px-4">KindCredits Circ.</th>
                </tr>
              </thead>
              <tbody>
                {(filteredMetrics || branchMetrics).map((metric) => (
                  <tr key={metric.branch_id} className="border-b border-border hover:bg-accent/30">
                    <td className="py-3 px-4 font-medium">{metric.branch_name}</td>
                    <td className="text-right py-3 px-4">{metric.jobs_completed}</td>
                    <td className="text-right py-3 px-4">{metric.active_jobs}</td>
                    <td className="text-right py-3 px-4">{metric.active_volunteers}</td>
                    <td className="text-right py-3 px-4">{metric.total_clients}</td>
                    <td className="text-right py-3 px-4">£{metric.total_revenue.toLocaleString()}</td>
                    <td className="text-right py-3 px-4">
                      <span className="text-chart-1">+{metric.kind_credits_earned.toFixed(0)}</span>
                      <span className="text-muted-foreground"> / </span>
                      <span className="text-chart-5">-{metric.kind_credits_used.toFixed(0)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}