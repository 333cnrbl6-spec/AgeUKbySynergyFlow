import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, BarChart3, Users, Wrench, Building2, TrendingUp, FileText, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import ImpactReportDialog from "../components/impact/ImpactReportDialog";
import { startOfMonth, endOfMonth, subMonths, format, parseISO } from "date-fns";

export default function ImpactReporting() {
  const [dialog, setDialog] = useState(false);
  const [editing, setEditing] = useState(null);
  const [period, setPeriod] = useState("this_month");
  const [generating, setGenerating] = useState(false);
  const [generatedSummary, setGeneratedSummary] = useState("");
  const qc = useQueryClient();

  const { data: reports = [] } = useQuery({ queryKey: ["impactReports"], queryFn: () => base44.entities.ImpactReport.list("-created_date", 100) });
  const { data: clients = [] } = useQuery({ queryKey: ["clients"], queryFn: () => base44.entities.Client.list("-created_date", 500) });
  const { data: jobs = [] } = useQuery({ queryKey: ["jobs"], queryFn: () => base44.entities.Job.list("-created_date", 500) });
  const { data: referrals = [] } = useQuery({ queryKey: ["referrals"], queryFn: () => base44.entities.Referral.list("-created_date", 500) });
  const { data: bookings = [] } = useQuery({ queryKey: ["bookings"], queryFn: () => base44.entities.RoomBooking.list("-date", 500) });
  const { data: cafeSales = [] } = useQuery({ queryKey: ["cafeSales"], queryFn: () => base44.entities.CafeSale.list("-sale_date", 90) });
  const { data: grants = [] } = useQuery({ queryKey: ["grants"], queryFn: () => base44.entities.Grant.list("-created_date", 100) });

  const save = useMutation({ mutationFn: r => r.id ? base44.entities.ImpactReport.update(r.id, r) : base44.entities.ImpactReport.create(r), onSuccess: () => qc.invalidateQueries({ queryKey: ["impactReports"] }) });

  // Period calc
  const getPeriodDates = () => {
    const now = new Date();
    if (period === "this_month") return { from: format(startOfMonth(now), "yyyy-MM-dd"), to: format(endOfMonth(now), "yyyy-MM-dd") };
    if (period === "last_month") { const lm = subMonths(now, 1); return { from: format(startOfMonth(lm), "yyyy-MM-dd"), to: format(endOfMonth(lm), "yyyy-MM-dd") }; }
    if (period === "last_quarter") { const q = subMonths(now, 3); return { from: format(startOfMonth(q), "yyyy-MM-dd"), to: format(endOfMonth(now), "yyyy-MM-dd") }; }
    return { from: format(startOfMonth(now), "yyyy-MM-dd"), to: format(endOfMonth(now), "yyyy-MM-dd") };
  };
  const { from, to } = getPeriodDates();

  const inPeriod = (dateStr) => dateStr && dateStr >= from && dateStr <= to;

  // Key stats
  const periodJobs = jobs.filter(j => inPeriod(j.scheduled_date) || inPeriod(j.created_date?.split("T")[0]));
  const completedJobs = periodJobs.filter(j => ["completed","paid"].includes(j.status));
  const periodRevenue = completedJobs.reduce((s, j) => s + (j.total_cost || 0), 0);
  const periodReferrals = referrals.filter(r => inPeriod(r.received_date));
  const periodBookings = bookings.filter(b => inPeriod(b.date) && !["cancelled"].includes(b.status));
  const bookingRevenue = periodBookings.filter(b => b.payment_status === "paid").reduce((s, b) => s + (b.total_charge || 0), 0);
  const periodCafe = cafeSales.filter(s => inPeriod(s.sale_date));
  const cafeRevenue = periodCafe.reduce((s, c) => s + (c.gross_takings || 0), 0);
  const cafCovers = periodCafe.reduce((s, c) => s + (c.covers || 0), 0);
  const activeClients = clients.filter(c => c.status === "active").length;
  const activeGrants = grants.filter(g => g.status === "awarded");
  const totalFunding = activeGrants.reduce((s, g) => s + (g.amount_awarded || 0), 0);

  const generateNarrative = async () => {
    setGenerating(true);
    const stats = `Jobs completed: ${completedJobs.length}, Revenue from handyperson: £${periodRevenue.toFixed(0)}, New referrals: ${periodReferrals.length}, Room bookings: ${periodBookings.length} (£${bookingRevenue.toFixed(0)}), Café customers served: ${cafCovers}, Café takings: £${cafeRevenue.toFixed(0)}, Active clients: ${activeClients}, Active grants: ${activeGrants.length} (total £${totalFunding.toLocaleString()})`;
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are writing a monitoring report narrative for Age UK Bury (charity no. 1141901), a local charity supporting people 50+ in the Bury borough of Greater Manchester. Write a 3-paragraph narrative report for the period ${from} to ${to} based on the following statistics: ${stats}. Include: 1) overview of service delivery, 2) highlights and community impact, 3) financial sustainability. Write in a warm, professional tone appropriate for submission to funders like Bury Council or the National Lottery. Do not make up figures — only reference the ones provided.`
    });
    setGeneratedSummary(result);
    setGenerating(false);
  };

  const statCards = [
    { label: "Active Clients", value: activeClients, icon: Users, color: "text-primary" },
    { label: "Jobs Completed", value: completedJobs.length, icon: Wrench, color: "text-emerald-600" },
    { label: "New Referrals", value: periodReferrals.length, icon: TrendingUp, color: "text-blue-600" },
    { label: "Room Bookings", value: periodBookings.length, icon: Building2, color: "text-purple-600" },
    { label: "Café Covers", value: cafCovers, icon: Users, color: "text-amber-600" },
    { label: "Total Income", value: `£${(periodRevenue + bookingRevenue + cafeRevenue).toFixed(0)}`, icon: TrendingUp, color: "text-emerald-600" },
    { label: "Grant Funding (Active)", value: `£${totalFunding.toLocaleString()}`, icon: FileText, color: "text-primary" },
    { label: "Active Grants", value: activeGrants.length, icon: BarChart3, color: "text-blue-600" },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold">Outcomes & Impact</h1>
          <p className="text-sm text-muted-foreground">Live service stats, funder monitoring reports and AI-generated narratives</p>
        </div>
        <Button onClick={() => { setEditing(null); setDialog(true); }}><Plus className="w-4 h-4 mr-2" />New Report</Button>
      </div>

      {/* Period selector */}
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium">Period:</span>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="this_month">This Month</SelectItem>
            <SelectItem value="last_month">Last Month</SelectItem>
            <SelectItem value="last_quarter">Last Quarter</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-xs text-muted-foreground">{from} → {to}</span>
      </div>

      {/* Live Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map(s => (
          <div key={s.label} className="bg-card rounded-xl p-4 border border-border/50 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <s.icon className={cn("w-4 h-4", s.color)} />
            </div>
            <p className={cn("text-2xl font-bold font-heading mt-1", s.color)}>{s.value}</p>
          </div>
        ))}
      </div>

      <Tabs defaultValue="generate">
        <TabsList className="grid grid-cols-2 w-72">
          <TabsTrigger value="generate">AI Report Generator</TabsTrigger>
          <TabsTrigger value="saved">Saved Reports ({reports.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="generate" className="space-y-4 mt-4">
          <div className="bg-card border rounded-xl p-5">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-heading font-semibold">Generate Monitoring Narrative</h3>
                <p className="text-xs text-muted-foreground mt-1">AI generates a funder-ready narrative using live data from the system for the selected period.</p>
              </div>
              <Button onClick={generateNarrative} disabled={generating} className="flex-shrink-0">
                <Zap className="w-4 h-4 mr-2" />{generating ? "Generating..." : "Generate with AI"}
              </Button>
            </div>
            {generatedSummary ? (
              <div className="space-y-3">
                <div className="bg-muted/40 rounded-lg p-4 text-sm leading-relaxed whitespace-pre-wrap">{generatedSummary}</div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => { setEditing({ title: `Monitoring Report ${from} to ${to}`, report_type: "grant_monitoring", period_from: from, period_to: to, headline_stats: statCards.map(s=>`${s.label}: ${s.value}`).join(" | "), narrative: generatedSummary, status: "draft" }); setDialog(true); }}>
                    <FileText className="w-3.5 h-3.5 mr-1" />Save as Report
                  </Button>
                  <Button variant="outline" size="sm" onClick={generateNarrative}>Regenerate</Button>
                </div>
              </div>
            ) : (
              <div className="bg-muted/20 rounded-lg p-6 text-center text-sm text-muted-foreground">
                Click "Generate with AI" to create a funder-ready narrative based on live system data.
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="saved" className="space-y-3 mt-4">
          {reports.length === 0 && <p className="text-center text-muted-foreground py-10 text-sm">No reports saved yet. Generate one above.</p>}
          {reports.map(r => (
            <div key={r.id} className="bg-card border rounded-xl p-4 hover:shadow-sm cursor-pointer" onClick={() => { setEditing(r); setDialog(true); }}>
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm">{r.title}</span>
                    <Badge variant="outline" className={cn("text-xs capitalize", r.status === "submitted" ? "border-emerald-200 text-emerald-700" : r.status === "accepted" ? "border-blue-200 text-blue-700" : "")}>{r.status}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground capitalize">{r.report_type?.replace(/_/g," ")} · {r.period_from} → {r.period_to}</p>
                  {r.funder_partner && <p className="text-xs text-muted-foreground">Funder: {r.funder_partner}</p>}
                  {r.headline_stats && <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{r.headline_stats}</p>}
                </div>
                <div className="text-right">
                  {r.due_date && <p className="text-xs text-amber-600">Due: {r.due_date}</p>}
                  {r.submitted_date && <p className="text-xs text-emerald-600">Submitted: {r.submitted_date}</p>}
                </div>
              </div>
            </div>
          ))}
        </TabsContent>
      </Tabs>

      <ImpactReportDialog open={dialog} onOpenChange={setDialog} report={editing}
        onSave={async r => { await save.mutateAsync(r); setEditing(null); }} />
    </div>
  );
}