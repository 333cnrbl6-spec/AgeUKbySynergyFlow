import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Wrench, Users, PoundSterling, Clock, CalendarDays } from "lucide-react";
import StatCard from "../components/dashboard/StatCard";
import RecentJobsList from "../components/dashboard/RecentJobsList";
import RevenueChart from "../components/dashboard/RevenueChart";
import { format } from "date-fns";

export default function Dashboard() {
  const { data: jobs = [] } = useQuery({
    queryKey: ["jobs"],
    queryFn: () => base44.entities.Job.list("-created_date", 100),
  });

  const { data: clients = [] } = useQuery({
    queryKey: ["clients"],
    queryFn: () => base44.entities.Client.list("-created_date", 100),
  });

  const activeJobs = jobs.filter(j => !["paid", "cancelled", "referred_out"].includes(j.status));
  const completedThisMonth = jobs.filter(j => {
    if (j.status !== "paid" && j.status !== "completed") return false;
    const d = new Date(j.created_date);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const totalRevenue = jobs
    .filter(j => j.payment_status === "paid")
    .reduce((sum, j) => sum + (j.total_cost || 0), 0);
  const unpaidJobs = jobs.filter(j => j.status === "completed" && j.payment_status === "unpaid");

  const today = format(new Date(), "EEEE, d MMMM yyyy");

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-heading font-bold">Good morning, Sue</h1>
        <p className="text-muted-foreground mt-1">{today}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active Jobs"
          value={activeJobs.length}
          subtitle={`${completedThisMonth.length} completed this month`}
          icon={Wrench}
        />
        <StatCard
          title="Total Clients"
          value={clients.length}
          subtitle="Registered clients"
          icon={Users}
        />
        <StatCard
          title="Revenue"
          value={`£${totalRevenue.toFixed(2)}`}
          subtitle="Total collected"
          icon={PoundSterling}
        />
        <StatCard
          title="Awaiting Payment"
          value={unpaidJobs.length}
          subtitle={`£${unpaidJobs.reduce((s, j) => s + (j.total_cost || 0), 0).toFixed(2)} outstanding`}
          icon={Clock}
        />
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue chart */}
        <div className="lg:col-span-2 bg-card rounded-xl p-5 shadow-sm border border-border/50">
          <h2 className="font-heading font-semibold text-lg mb-4">Revenue Overview</h2>
          <RevenueChart jobs={jobs} />
        </div>

        {/* Today's schedule */}
        <div className="bg-card rounded-xl p-5 shadow-sm border border-border/50">
          <div className="flex items-center gap-2 mb-4">
            <CalendarDays className="w-5 h-5 text-primary" />
            <h2 className="font-heading font-semibold text-lg">Today's Jobs</h2>
          </div>
          {(() => {
            const todayStr = format(new Date(), "yyyy-MM-dd");
            const todayJobs = jobs.filter(j => j.scheduled_date === todayStr);
            if (todayJobs.length === 0) {
              return <p className="text-sm text-muted-foreground py-4">No jobs scheduled for today</p>;
            }
            return todayJobs.map(job => (
              <div key={job.id} className="py-3 border-b border-border/50 last:border-0">
                <p className="font-medium text-sm">{job.title}</p>
                <p className="text-xs text-muted-foreground">{job.client_name} • {job.scheduled_time || "TBC"}</p>
                {job.address && <p className="text-xs text-muted-foreground mt-0.5">{job.address}</p>}
              </div>
            ));
          })()}
        </div>
      </div>

      {/* Recent jobs */}
      <div className="bg-card rounded-xl p-5 shadow-sm border border-border/50">
        <h2 className="font-heading font-semibold text-lg mb-3">Recent Jobs</h2>
        <RecentJobsList jobs={jobs} />
      </div>
    </div>
  );
}