import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, AlertTriangle, UserPlus, Clock, CheckCircle2, PhoneIncoming } from "lucide-react";
import { cn } from "@/lib/utils";
import ReferralFormDialog from "../components/referrals/ReferralFormDialog";

const statusColors = {
  received: "bg-blue-50 text-blue-700",
  contacted: "bg-amber-50 text-amber-700",
  assessment_booked: "bg-purple-50 text-purple-700",
  active: "bg-emerald-50 text-emerald-700",
  declined: "bg-gray-100 text-gray-500",
  signposted_elsewhere: "bg-orange-50 text-orange-600",
  closed: "bg-gray-100 text-gray-400",
};

const urgencyColors = { routine: "text-gray-500", soon: "text-amber-600", urgent: "text-red-600 font-semibold" };

const sourceLabels = {
  gp_social_prescribing: "GP / Social Prescribing",
  bolton_council_asc: "Bolton Council ASC",
  hospital_discharge: "Hospital Discharge",
  self_referral: "Self-Referral",
  family_carer: "Family / Carer",
  nhs_community: "NHS Community",
  another_charity: "Another Charity",
  other: "Other"
};

export default function Referrals() {
  const [dialog, setDialog] = useState(false);
  const [editing, setEditing] = useState(null);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const qc = useQueryClient();

  const { data: referrals = [], isLoading } = useQuery({ queryKey: ["referrals"], queryFn: () => base44.entities.Referral.list("-created_date", 200) });

  const save = useMutation({
    mutationFn: r => r.id ? base44.entities.Referral.update(r.id, r) : base44.entities.Referral.create(r),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["referrals"] })
  });

  const today = new Date().toISOString().split("T")[0];
  const newToday = referrals.filter(r => r.received_date === today);
  const urgent = referrals.filter(r => r.urgency === "urgent" && !["closed","declined","signposted_elsewhere"].includes(r.status));
  const uncontacted = referrals.filter(r => r.status === "received");
  const safeguarding = referrals.filter(r => r.safeguarding_concern && !["closed","declined"].includes(r.status));

  const filtered = referrals.filter(r => {
    const matchStatus = filter === "all" || r.status === filter;
    const matchSearch = !search ||
      `${r.client_first_name} ${r.client_last_name}`.toLowerCase().includes(search.toLowerCase()) ||
      r.referring_organisation?.toLowerCase().includes(search.toLowerCase()) ||
      r.ref_number?.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold">Referral Hub</h1>
          <p className="text-sm text-muted-foreground">Manage incoming referrals from GP social prescribing, council, hospital discharge & self-referrals</p>
        </div>
        <Button onClick={() => { setEditing(null); setDialog(true); }}><Plus className="w-4 h-4 mr-2" />New Referral</Button>
      </div>

      {/* Alerts */}
      {safeguarding.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2 text-sm text-red-800">
          <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span><strong>⚠ {safeguarding.length} active safeguarding concern(s)</strong> — {safeguarding.map(r => `${r.client_first_name} ${r.client_last_name}`).join(", ")}</span>
        </div>
      )}
      {urgent.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2 text-sm text-amber-800">
          <Clock className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span><strong>{urgent.length} urgent referral(s)</strong> require immediate action</span>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Received Today", value: newToday.length, icon: PhoneIncoming, color: "text-blue-600" },
          { label: "Awaiting Contact", value: uncontacted.length, icon: Clock, color: uncontacted.length > 0 ? "text-amber-600" : "text-emerald-600" },
          { label: "Urgent", value: urgent.length, icon: AlertTriangle, color: urgent.length > 0 ? "text-red-600" : "text-gray-400" },
          { label: "Active", value: referrals.filter(r => r.status === "active").length, icon: CheckCircle2, color: "text-emerald-600" },
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
        <Input placeholder="Search by name, organisation, ref..." value={search} onChange={e => setSearch(e.target.value)} className="max-w-xs" />
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-48"><SelectValue placeholder="All statuses" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {["received","contacted","assessment_booked","active","declined","signposted_elsewhere","closed"].map(s =>
              <SelectItem key={s} value={s}>{s.replace(/_/g," ").replace(/\b\w/g,c=>c.toUpperCase())}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* List */}
      {isLoading ? <div className="animate-pulse h-32 bg-muted rounded-xl" /> : (
        <div className="space-y-2">
          {filtered.length === 0 && <p className="text-center text-muted-foreground py-12 text-sm">No referrals found.</p>}
          {filtered.map(r => (
            <div key={r.id} className="bg-card border rounded-xl p-4 hover:shadow-sm cursor-pointer" onClick={() => { setEditing(r); setDialog(true); }}>
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    {r.safeguarding_concern && <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-semibold">⚠ Safeguarding</span>}
                    <span className="font-medium">{r.client_first_name} {r.client_last_name}</span>
                    <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", statusColors[r.status])}>{r.status?.replace(/_/g," ")}</span>
                    <span className={cn("text-xs capitalize", urgencyColors[r.urgency])}>{r.urgency}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{sourceLabels[r.referral_source_type]} · {r.referring_organisation}</p>
                  {r.reason_for_referral && <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{r.reason_for_referral}</p>}
                  {r.presenting_needs?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {r.presenting_needs.map(n => <span key={n} className="text-xs bg-accent text-accent-foreground px-1.5 py-0.5 rounded-full">{n}</span>)}
                    </div>
                  )}
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs text-muted-foreground">{r.received_date}</p>
                  {r.assigned_to && <p className="text-xs text-muted-foreground mt-1">→ {r.assigned_to}</p>}
                  {r.ref_number && <p className="text-xs text-muted-foreground font-mono">{r.ref_number}</p>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <ReferralFormDialog open={dialog} onOpenChange={setDialog} referral={editing}
        onSave={async r => { await save.mutateAsync(r); setEditing(null); }} />
    </div>
  );
}