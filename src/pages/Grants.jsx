import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, PoundSterling, AlertTriangle, CheckCircle2, Clock, TrendingUp, FileText, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import GrantFormDialog from "../components/grants/GrantFormDialog";
import { differenceInDays, parseISO } from "date-fns";

const statusColors = {
  planning: "bg-gray-100 text-gray-600 border-gray-200",
  applied: "bg-blue-50 text-blue-700 border-blue-200",
  under_review: "bg-amber-50 text-amber-700 border-amber-200",
  awarded: "bg-emerald-50 text-emerald-700 border-emerald-200",
  declined: "bg-red-50 text-red-600 border-red-200",
  withdrawn: "bg-gray-100 text-gray-500 border-gray-200",
  closed: "bg-gray-100 text-gray-400 border-gray-200",
};

const funderLabels = {
  bury_council: "Bury Council", national_lottery: "National Lottery", lloyds_foundation: "Lloyds Foundation",
  nhs: "NHS", age_uk_national: "Age UK National", trust_foundation: "Trust/Foundation",
  corporate: "Corporate", other: "Other"
};

export default function Grants() {
  const [dialog, setDialog] = useState(false);
  const [editing, setEditing] = useState(null);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const qc = useQueryClient();

  const { data: grants = [], isLoading } = useQuery({ queryKey: ["grants"], queryFn: () => base44.entities.Grant.list("-created_date", 200) });

  const save = useMutation({
    mutationFn: g => g.id ? base44.entities.Grant.update(g.id, g) : base44.entities.Grant.create(g),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["grants"] })
  });

  const today = new Date().toISOString().split("T")[0];

  const activeGrants = grants.filter(g => g.status === "awarded");
  const totalAwarded = activeGrants.reduce((s, g) => s + (g.amount_awarded || 0), 0);
  const totalApplied = grants.filter(g => ["applied","under_review"].includes(g.status)).reduce((s, g) => s + (g.amount_applied || 0), 0);
  const reportsOverdue = grants.filter(g => g.next_report_due && g.next_report_due < today && g.status === "awarded");
  const reportsDueSoon = grants.filter(g => {
    if (!g.next_report_due || g.status !== "awarded") return false;
    const days = differenceInDays(parseISO(g.next_report_due), new Date());
    return days >= 0 && days <= 30;
  });

  const filtered = grants.filter(g => {
    const matchStatus = filter === "all" || g.status === filter;
    const matchSearch = !search || g.title?.toLowerCase().includes(search.toLowerCase()) || g.funder_name?.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold">Grants & Funding</h1>
          <p className="text-sm text-muted-foreground">Track applications, awards, KPIs and reporting deadlines</p>
        </div>
        <Button onClick={() => { setEditing(null); setDialog(true); }}><Plus className="w-4 h-4 mr-2" />Add Grant</Button>
      </div>

      {/* Alerts */}
      {reportsOverdue.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2 text-sm text-red-800">
          <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span><strong>{reportsOverdue.length} monitoring report(s) overdue:</strong> {reportsOverdue.map(g => g.title).join(", ")}</span>
        </div>
      )}
      {reportsDueSoon.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2 text-sm text-amber-800">
          <Clock className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span><strong>{reportsDueSoon.length} report(s) due within 30 days:</strong> {reportsDueSoon.map(g => `${g.title} (${g.next_report_due})`).join(", ")}</span>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Active Grants", value: activeGrants.length, icon: CheckCircle2, color: "text-emerald-600" },
          { label: "Total Awarded (Active)", value: `£${totalAwarded.toLocaleString()}`, icon: PoundSterling, color: "text-primary" },
          { label: "Pipeline (Applied)", value: `£${totalApplied.toLocaleString()}`, icon: TrendingUp, color: "text-blue-600" },
          { label: "Reports Due ≤30 days", value: reportsDueSoon.length + reportsOverdue.length, icon: FileText, color: reportsOverdue.length > 0 ? "text-red-600" : "text-amber-600" },
        ].map(s => (
          <div key={s.label} className="bg-card rounded-xl p-4 border border-border/50 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <s.icon className={cn("w-4 h-4", s.color)} />
            </div>
            <p className={cn("text-2xl font-bold font-heading mt-1", s.color)}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <Input placeholder="Search grants..." value={search} onChange={e => setSearch(e.target.value)} className="max-w-xs" />
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-44"><SelectValue placeholder="All statuses" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {["planning","applied","under_review","awarded","declined","withdrawn","closed"].map(s =>
              <SelectItem key={s} value={s}>{s.replace("_"," ").replace(/\b\w/g,c=>c.toUpperCase())}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Grant Cards */}
      {isLoading ? <div className="animate-pulse h-32 bg-muted rounded-xl" /> : (
        <div className="space-y-3">
          {filtered.length === 0 && <p className="text-center text-muted-foreground py-12 text-sm">No grants found. Add your first grant application.</p>}
          {filtered.map(g => {
            const daysToReport = g.next_report_due ? differenceInDays(parseISO(g.next_report_due), new Date()) : null;
            const reportUrgent = daysToReport !== null && daysToReport < 0;
            const reportSoon = daysToReport !== null && daysToReport >= 0 && daysToReport <= 30;
            return (
              <div key={g.id} className="bg-card border rounded-xl p-5 hover:shadow-sm cursor-pointer group" onClick={() => { setEditing(g); setDialog(true); }}>
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="font-heading font-semibold">{g.title}</span>
                      <Badge variant="outline" className={cn("text-xs border", statusColors[g.status])}>{g.status.replace("_"," ")}</Badge>
                      {g.restricted && <Badge variant="outline" className="text-xs">Restricted</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground">{g.funder_name} · {funderLabels[g.funder_type]}</p>
                    {g.service_area && <p className="text-xs text-muted-foreground mt-0.5 capitalize">{g.service_area.replace(/_/g," ")}</p>}
                    {g.kpi_targets && <p className="text-xs text-muted-foreground mt-1 line-clamp-1">KPIs: {g.kpi_targets}</p>}
                  </div>
                  <div className="text-right flex-shrink-0 space-y-1">
                    {g.amount_awarded > 0 && <p className="font-bold text-emerald-600 font-heading">£{g.amount_awarded.toLocaleString()} awarded</p>}
                    {!g.amount_awarded && g.amount_applied > 0 && <p className="font-semibold text-blue-600">£{g.amount_applied.toLocaleString()} applied</p>}
                    {g.start_date && <p className="text-xs text-muted-foreground">{g.start_date} – {g.end_date || "ongoing"}</p>}
                    {g.next_report_due && g.status === "awarded" && (
                      <div className={cn("flex items-center gap-1 justify-end text-xs font-medium", reportUrgent ? "text-red-600" : reportSoon ? "text-amber-600" : "text-muted-foreground")}>
                        <Calendar className="w-3 h-3" />
                        Report: {g.next_report_due} {reportUrgent ? "(OVERDUE)" : reportSoon ? `(${daysToReport}d)` : ""}
                      </div>
                    )}
                  </div>
                </div>
                {g.amount_awarded > 0 && g.amount_spent > 0 && (
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                      <span>Spent: £{g.amount_spent.toLocaleString()}</span>
                      <span>{Math.round((g.amount_spent / g.amount_awarded) * 100)}%</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${Math.min(100, (g.amount_spent / g.amount_awarded) * 100)}%` }} />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <GrantFormDialog open={dialog} onOpenChange={setDialog} grant={editing}
        onSave={async g => { await save.mutateAsync(g); setEditing(null); }} />
    </div>
  );
}