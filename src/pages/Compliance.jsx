import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, AlertTriangle, CheckCircle2, Clock, Shield, ExternalLink, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import ComplianceFormDialog from "../components/compliance/ComplianceFormDialog";
import { differenceInDays, parseISO } from "date-fns";

const categoryIcons = {
  charity_commission: "🏛️", companies_house: "🏢", oqs_standard: "⭐", insurance: "🛡️",
  dbs: "👤", health_safety: "⚕️", gdpr: "🔒", safeguarding: "🤝",
  trustee_governance: "👥", contract_compliance: "📋", other: "📌"
};
const categoryLabels = {
  charity_commission: "Charity Commission", companies_house: "Companies House", oqs_standard: "OQS Standard",
  insurance: "Insurance", dbs: "DBS Checks", health_safety: "Health & Safety", gdpr: "GDPR/Data",
  safeguarding: "Safeguarding", trustee_governance: "Trustee Governance", contract_compliance: "Contract Compliance", other: "Other"
};

// Charity Commission API integration
async function fetchCharityData() {
  const res = await fetch("https://api.charitycommission.gov.uk/register/api/allcharitydownload/v1/charity?registeredNumber=1141901", {
    headers: { "Ocp-Apim-Subscription-Key": "" } // placeholder — would need CC API key from secrets
  });
  return res.ok ? res.json() : null;
}

export default function Compliance() {
  const [dialog, setDialog] = useState(false);
  const [editing, setEditing] = useState(null);
  const [ccData, setCcData] = useState(null);
  const [ccLoading, setCcLoading] = useState(false);
  const qc = useQueryClient();

  const { data: items = [], isLoading } = useQuery({ queryKey: ["compliance"], queryFn: () => base44.entities.ComplianceItem.list("due_date", 200) });

  const save = useMutation({ mutationFn: i => i.id ? base44.entities.ComplianceItem.update(i.id, i) : base44.entities.ComplianceItem.create(i), onSuccess: () => qc.invalidateQueries({ queryKey: ["compliance"] }) });
  const markComplete = useMutation({
    mutationFn: i => base44.entities.ComplianceItem.update(i.id, { ...i, status: "completed", completed_date: new Date().toISOString().split("T")[0] }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["compliance"] })
  });

  const today = new Date().toISOString().split("T")[0];
  const overdue = items.filter(i => i.status !== "completed" && i.status !== "not_applicable" && i.due_date < today);
  const dueSoon = items.filter(i => {
    if (i.status === "completed" || i.status === "not_applicable") return false;
    const days = differenceInDays(parseISO(i.due_date), new Date());
    return days >= 0 && days <= (i.reminder_days_before || 30);
  });
  const upcoming = items.filter(i => {
    if (i.status === "completed" || i.status === "not_applicable") return false;
    const days = differenceInDays(parseISO(i.due_date), new Date());
    return days > (i.reminder_days_before || 30);
  });
  const completed = items.filter(i => i.status === "completed");

  const ItemCard = ({ item }) => {
    const days = differenceInDays(parseISO(item.due_date), new Date());
    const isOver = item.due_date < today && item.status !== "completed";
    const isSoon = days >= 0 && days <= (item.reminder_days_before || 30);
    return (
      <div className={cn("bg-card border rounded-xl p-4 hover:shadow-sm group", isOver && "border-red-200 bg-red-50/30")}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1">
            <span className="text-xl flex-shrink-0 mt-0.5">{categoryIcons[item.category]}</span>
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="font-medium text-sm">{item.title}</span>
                <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{categoryLabels[item.category]}</span>
              </div>
              {item.description && <p className="text-xs text-muted-foreground mb-1">{item.description}</p>}
              <div className="flex flex-wrap items-center gap-3 text-xs">
                <span className={cn("font-medium", isOver ? "text-red-600" : isSoon ? "text-amber-600" : "text-muted-foreground")}>
                  {isOver ? `⚠ Overdue (${item.due_date})` : `Due: ${item.due_date}${isSoon ? ` (${days} days)` : ""}`}
                </span>
                {item.responsible_person && <span className="text-muted-foreground">→ {item.responsible_person}</span>}
                {item.recurrence !== "one_off" && <span className="text-muted-foreground capitalize">↻ {item.recurrence}</span>}
              </div>
            </div>
          </div>
          <div className="flex gap-1 flex-shrink-0">
            {item.status !== "completed" && (
              <Button size="sm" variant="outline" className="h-7 text-xs opacity-0 group-hover:opacity-100" onClick={e => { e.stopPropagation(); markComplete.mutate(item); }}>
                <CheckCircle2 className="w-3 h-3 mr-1" />Done
              </Button>
            )}
            <Button size="icon" variant="ghost" className="h-7 w-7 opacity-0 group-hover:opacity-100" onClick={() => { setEditing(item); setDialog(true); }}>
              <Shield className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold">Compliance & Governance</h1>
          <p className="text-sm text-muted-foreground">Charity Commission, Companies House, OQS, DBS, Insurance & more</p>
        </div>
        <Button onClick={() => { setEditing(null); setDialog(true); }}><Plus className="w-4 h-4 mr-2" />Add Item</Button>
      </div>

      {/* Alerts */}
      {overdue.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2 text-sm text-red-800">
          <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span><strong>{overdue.length} item(s) overdue:</strong> {overdue.map(i => i.title).join(" · ")}</span>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Overdue", value: overdue.length, color: overdue.length > 0 ? "text-red-600" : "text-gray-400", icon: AlertTriangle },
          { label: "Due Within 30 Days", value: dueSoon.length, color: dueSoon.length > 0 ? "text-amber-600" : "text-gray-400", icon: Clock },
          { label: "Upcoming", value: upcoming.length, color: "text-blue-600", icon: Shield },
          { label: "Completed", value: completed.length, color: "text-emerald-600", icon: CheckCircle2 },
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

      {/* Charity Commission Panel */}
      <div className="bg-card border rounded-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-heading font-semibold">Charity Commission Register</h3>
            <p className="text-xs text-muted-foreground">Age UK Bury — Charity No. 1141901 · Company No. 07506866</p>
          </div>
          <div className="flex gap-2">
            <a href="https://register-of-charities.charitycommission.gov.uk/charity-search/-/charity-details/1141901" target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm"><ExternalLink className="w-3.5 h-3.5 mr-1" />View Register</Button>
            </a>
            <a href="https://find-and-update.company-information.service.gov.uk/company/07506866" target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm"><ExternalLink className="w-3.5 h-3.5 mr-1" />Companies House</Button>
            </a>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          {[
            { label: "Charity No.", value: "1141901" },
            { label: "Company No.", value: "07506866" },
            { label: "Annual Return Due", value: "31 March (annual)" },
            { label: "OQS Last Assessed", value: "2024 (SGS)" },
          ].map(f => (
            <div key={f.label} className="bg-muted/40 rounded-lg p-3">
              <p className="text-xs text-muted-foreground">{f.label}</p>
              <p className="font-medium mt-0.5">{f.value}</p>
            </div>
          ))}
        </div>
      </div>

      <Tabs defaultValue="overdue">
        <TabsList className="grid grid-cols-4 w-full max-w-lg">
          <TabsTrigger value="overdue" className={overdue.length > 0 ? "text-red-600" : ""}>Overdue ({overdue.length})</TabsTrigger>
          <TabsTrigger value="soon">Due Soon ({dueSoon.length})</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming ({upcoming.length})</TabsTrigger>
          <TabsTrigger value="completed">Done ({completed.length})</TabsTrigger>
        </TabsList>
        {[
          { key: "overdue", list: overdue },
          { key: "soon", list: dueSoon },
          { key: "upcoming", list: upcoming },
          { key: "completed", list: completed },
        ].map(({ key, list }) => (
          <TabsContent key={key} value={key} className="space-y-2 mt-4">
            {isLoading && <div className="animate-pulse h-20 bg-muted rounded-xl" />}
            {!isLoading && list.length === 0 && <p className="text-center text-muted-foreground py-8 text-sm">Nothing here.</p>}
            {list.map(i => <ItemCard key={i.id} item={i} />)}
          </TabsContent>
        ))}
      </Tabs>

      <ComplianceFormDialog open={dialog} onOpenChange={setDialog} item={editing}
        onSave={async i => { await save.mutateAsync(i); setEditing(null); }} />
    </div>
  );
}