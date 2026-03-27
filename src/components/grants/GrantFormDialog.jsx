import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const empty = {
  title:"", funder_name:"", funder_type:"trust_foundation", funder_contact_name:"", funder_contact_email:"", funder_contact_phone:"",
  service_area:"general", status:"planning", amount_applied:0, amount_awarded:0, amount_spent:0,
  application_date:"", decision_date:"", start_date:"", end_date:"", next_report_due:"",
  report_frequency:"quarterly", kpi_targets:"", kpi_actuals:"", conditions:"", description:"", notes:"", restricted:true
};

export default function GrantFormDialog({ open, onOpenChange, grant, onSave }) {
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);

  useEffect(() => { setForm(grant ? { ...empty, ...grant } : empty); }, [grant, open]);
  const set = (f, v) => setForm(p => ({ ...p, [f]: v }));

  const handleSubmit = async (e) => { e.preventDefault(); setSaving(true); await onSave(form); setSaving(false); onOpenChange(false); };

  const F = ({ label, field, type="text", placeholder }) => (
    <div><Label className="text-xs">{label}</Label><Input type={type} value={form[field]??""} onChange={e=>set(field, type==="number"?parseFloat(e.target.value)||0:e.target.value)} placeholder={placeholder} className="mt-1" /></div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle className="font-heading">{grant ? "Edit Grant" : "Add Grant / Funding"}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit}>
          <Tabs defaultValue="details" className="space-y-4">
            <TabsList className="grid grid-cols-3 w-full">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="financials">Financials</TabsTrigger>
              <TabsTrigger value="kpis">KPIs & Reporting</TabsTrigger>
            </TabsList>
            <TabsContent value="details" className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2"><F label="Grant Title *" field="title" /></div>
                <div className="col-span-2"><F label="Funder Name *" field="funder_name" /></div>
                <div>
                  <Label className="text-xs">Funder Type</Label>
                  <Select value={form.funder_type} onValueChange={v=>set("funder_type",v)}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {[["bury_council","Bury Council"],["national_lottery","National Lottery"],["lloyds_foundation","Lloyds Foundation"],["nhs","NHS"],["age_uk_national","Age UK National"],["trust_foundation","Trust / Foundation"],["corporate","Corporate"],["other","Other"]].map(([v,l])=><SelectItem key={v} value={v}>{l}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Status</Label>
                  <Select value={form.status} onValueChange={v=>set("status",v)}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["planning","applied","under_review","awarded","declined","withdrawn","closed"].map(s=><SelectItem key={s} value={s}>{s.replace("_"," ").replace(/\b\w/g,c=>c.toUpperCase())}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Service Area</Label>
                  <Select value={form.service_area||"general"} onValueChange={v=>set("service_area",v)}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["handyperson","befriending","home_from_hospital","information_advice","jubilee_centre","dumers_lane","friends_together","social_prescribing","general","other"].map(s=><SelectItem key={s} value={s}>{s.replace(/_/g," ").replace(/\b\w/g,c=>c.toUpperCase())}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between pt-5">
                  <Label className="text-sm">Restricted Funding</Label>
                  <Switch checked={form.restricted} onCheckedChange={v=>set("restricted",v)} />
                </div>
                <F label="Funder Contact Name" field="funder_contact_name" />
                <F label="Contact Email" field="funder_contact_email" />
                <F label="Contact Phone" field="funder_contact_phone" />
                <F label="Application Date" field="application_date" type="date" />
                <F label="Decision Date" field="decision_date" type="date" />
                <F label="Grant Start Date" field="start_date" type="date" />
                <F label="Grant End Date" field="end_date" type="date" />
                <div className="col-span-2"><Label className="text-xs">Description / Purpose</Label><Textarea value={form.description||""} onChange={e=>set("description",e.target.value)} rows={2} className="mt-1" /></div>
                <div className="col-span-2"><Label className="text-xs">Grant Conditions</Label><Textarea value={form.conditions||""} onChange={e=>set("conditions",e.target.value)} rows={2} className="mt-1" /></div>
              </div>
            </TabsContent>
            <TabsContent value="financials" className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <F label="Amount Applied (£)" field="amount_applied" type="number" />
                <F label="Amount Awarded (£)" field="amount_awarded" type="number" />
                <F label="Amount Spent (£)" field="amount_spent" type="number" />
              </div>
            </TabsContent>
            <TabsContent value="kpis" className="space-y-3">
              <div>
                <Label className="text-xs">Next Report Due</Label>
                <Input type="date" value={form.next_report_due||""} onChange={e=>set("next_report_due",e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label className="text-xs">Report Frequency</Label>
                <Select value={form.report_frequency} onValueChange={v=>set("report_frequency",v)}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["monthly","quarterly","biannual","annual","end_of_grant","none"].map(s=><SelectItem key={s} value={s}>{s.replace("_"," ").replace(/\b\w/g,c=>c.toUpperCase())}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div><Label className="text-xs">KPI Targets (from funder)</Label><Textarea value={form.kpi_targets||""} onChange={e=>set("kpi_targets",e.target.value)} rows={3} className="mt-1" placeholder="e.g. 50 clients supported, 200 home visits completed..." /></div>
              <div><Label className="text-xs">KPI Actuals (current performance)</Label><Textarea value={form.kpi_actuals||""} onChange={e=>set("kpi_actuals",e.target.value)} rows={3} className="mt-1" placeholder="Enter current actuals against each KPI..." /></div>
              <div><Label className="text-xs">Notes</Label><Textarea value={form.notes||""} onChange={e=>set("notes",e.target.value)} rows={2} className="mt-1" /></div>
            </TabsContent>
          </Tabs>
          <div className="flex justify-end gap-2 pt-4 border-t mt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? "Saving..." : grant ? "Update" : "Add Grant"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}