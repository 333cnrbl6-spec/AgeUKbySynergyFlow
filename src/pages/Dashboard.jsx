import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Wrench, Users, PoundSterling, Clock, CalendarDays, Building2, Phone } from "lucide-react";
import StatCard from "../components/dashboard/StatCard";
import RecentJobsList from "../components/dashboard/RecentJobsList";
import RevenueChart from "../components/dashboard/RevenueChart";
import XeroWidget from "../components/dashboard/XeroWidget";
import DementiaSupportWidget from "../components/dashboard/DementiaSupportWidget";
import DataPartnershipWidget from "../components/dashboard/DataPartnershipWidget";
import ActivityWidget from "../components/dashboard/ActivityWidget";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const EVENT_DOT = {
  job:      { colour: "bg-indigo-500",  label: "Job" },
  booking:  { colour: "bg-teal-500",    label: "Booking" },
  work:     { colour: "bg-orange-500",  label: "Work" },
  referral: { colour: "bg-pink-500",    label: "Assessment" },
};

export default function Dashboard() {
  const todayStr = format(new Date(), "yyyy-MM-dd");
  const today = format(new Date(), "EEEE, d MMMM yyyy");

  const { data: jobs = [] }          = useQuery({ queryKey: ["jobs"],          queryFn: () => base44.entities.Job.list("-created_date", 100) });
  const { data: clients = [] }       = useQuery({ queryKey: ["clients"],       queryFn: () => base44.entities.Client.list("-created_date", 100) });
  const { data: bookings = [] }      = useQuery({ queryKey: ["bookings"],      queryFn: () => base44.entities.RoomBooking.list("-date", 200) });
  const { data: workSchedules = [] } = useQuery({ queryKey: ["workSchedules"], queryFn: () => base44.entities.WorkSchedule.list("-scheduled_date", 200) });
  const { data: referrals = [] }     = useQuery({ queryKey: ["referrals"],     queryFn: () => base44.entities.Referral.list("-received_date", 200) });

  // Stats
  const activeJobs = jobs.filter(j => !["paid", "cancelled", "referred_out"].includes(j.status));
  const completedThisMonth = jobs.filter(j => {
    if (j.status !== "paid" && j.status !== "completed") return false;
    const d = new Date(j.created_date);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const totalRevenue = jobs.filter(j => j.payment_status === "paid").reduce((s, j) => s + (j.total_cost || 0), 0);
  const unpaidJobs = jobs.filter(j => j.status === "completed" && j.payment_status === "unpaid");

  // Today's unified schedule
  const todayEvents = [
    ...jobs.filter(j => j.scheduled_date === todayStr).map(j => ({
      id: `job-${j.id}`, type: "job", title: j.title, subtitle: j.client_name, time: j.scheduled_time, status: j.status,
    })),
    ...bookings.filter(b => b.date === todayStr && b.status !== "cancelled").map(b => ({
      id: `bk-${b.id}`, type: "booking", title: b.activity_name, subtitle: b.facility_name, time: b.start_time, status: b.status,
    })),
    ...workSchedules.filter(w => w.scheduled_date === todayStr).map(w => ({
      id: `ws-${w.id}`, type: "work", title: w.job_title || "Work Schedule", subtitle: w.supplier_name, time: w.scheduled_time, status: w.status,
    })),
    ...referrals.filter(r => r.received_date === todayStr && r.status === "assessment_booked").map(r => ({
      id: `ref-${r.id}`, type: "referral", title: `${r.client_first_name} ${r.client_last_name}`, subtitle: "Assessment", time: null, status: r.status,
    })),
  ].sort((a, b) => {
    if (!a.time) return 1;
    if (!b.time) return -1;
    return a.time.localeCompare(b.time);
  });

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-heading font-bold">Good morning</h1>
        <p className="text-muted-foreground mt-1">{today}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Active Jobs" value={activeJobs.length} subtitle={`${completedThisMonth.length} completed this month`} icon={Wrench} />
        <StatCard title="Total Clients" value={clients.length} subtitle="Registered clients" icon={Users} />
        <StatCard title="Revenue" value={`£${totalRevenue.toFixed(2)}`} subtitle="Total collected" icon={PoundSterling} />
        <StatCard title="Awaiting Payment" value={unpaidJobs.length} subtitle={`£${unpaidJobs.reduce((s, j) => s + (j.total_cost || 0), 0).toFixed(2)} outstanding`} icon={Clock} />
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue chart */}
        <div className="lg:col-span-2 bg-card rounded-xl p-5 shadow-sm border border-border/50">
          <h2 className="font-heading font-semibold text-lg mb-4">Revenue Overview</h2>
          <RevenueChart jobs={jobs} />
        </div>

        {/* Today's schedule — all event types */}
        <div className="bg-card rounded-xl p-5 shadow-sm border border-border/50 flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <CalendarDays className="w-5 h-5 text-primary" />
            <h2 className="font-heading font-semibold text-lg">Today's Schedule</h2>
            {todayEvents.length > 0 && (
              <span className="ml-auto text-xs bg-primary/10 text-primary font-semibold px-2 py-0.5 rounded-full">{todayEvents.length}</span>
            )}
          </div>
          {todayEvents.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">Nothing scheduled for today.</p>
          ) : (
            <div className="space-y-2 overflow-y-auto flex-1">
              {todayEvents.map(ev => {
                const cfg = EVENT_DOT[ev.type];
                return (
                  <div key={ev.id} className="py-2.5 border-b border-border/40 last:border-0 flex items-start gap-2">
                    <div className={cn("w-2 h-2 rounded-full flex-shrink-0 mt-1.5", cfg?.colour)} />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{ev.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{ev.subtitle} {ev.time ? `· ${ev.time}` : ""}</p>
                    </div>
                    <Badge variant="outline" className="text-xs flex-shrink-0 capitalize">{cfg?.label}</Badge>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Bottom row: Recent Jobs + Dementia Support + Data Partnerships + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-card rounded-xl p-5 shadow-sm border border-border/50">
          <h2 className="font-heading font-semibold text-lg mb-3">Recent Jobs</h2>
          <RecentJobsList jobs={jobs} />
        </div>
        <div className="space-y-6">
          <DementiaSupportWidget />
          <DataPartnershipWidget />
        </div>
      </div>

      {/* Activity Feed */}
      <ActivityWidget />

      {/* Xero Integration */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-3">
          <XeroWidget />
        </div>
      </div>
    </div>
  );
}