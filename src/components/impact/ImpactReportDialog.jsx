import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const empty = { title:"", report_type:"grant_monitoring", period_from:"", period_to:"", funder_partner:"", grant_id:"", partner_id:"", status:"draft", submitted_date:"", due_date:"", headline_stats:"", narrative:"", notes:"" };

export default function ImpactReportDialog({ open, onOpenChange, report, onSave }) {
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);

  useEffect(() => { setForm(report ? { ...empty, ...report } : empty); }, [report, open]);
  const set = (f, v) => setForm(p => ({ ...p, [f]: v }));

  const handleSubmit = async (e) => { e.preventDefault(); setSaving(true); await onSave(form); setSaving(false); onOpenChange(false); };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle className="font-heading">{report ? "Edit Report" : "New Impact Report"}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div><Label className="text-xs">Report Title *</Label><Input value={form.title} onChange={e=>set("title",e.target.value)} required className="mt-1" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Report Type</Label>
              <Select value={form.report_type} onValueChange={v=>set("report_type",v)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["grant_monitoring","board_report","council_contract","annual_report","nhs_return","ad_hoc"].map(t=><SelectItem key={t} value={t}>{t.replace(/_/g," ").replace(/\b\w/g,c=>c.toUpperCase())}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Status</Label>
              <Select value={form.status} onValueChange={v=>set("status",v)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="submitted">Submitted</SelectItem>
                  <SelectItem value="accepted">Accepted</SelectItem>
                  <SelectItem value="queried">Queried</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label className="text-xs">Period From *</Label><Input type="date" value={form.period_from} onChange={e=>set("period_from",e.target.value)} required className="mt-1" /></div>
            <div><Label className="text-xs">Period To *</Label><Input type="date" value={form.period_to} onChange={e=>set("period_to",e.target.value)} required className="mt-1" /></div>
            <div><Label className="text-xs">Funder / Partner</Label><Input value={form.funder_partner||""} onChange={e=>set("funder_partner",e.target.value)} placeholder="e.g. Bury Council" className="mt-1" /></div>
            <div><Label className="text-xs">Due Date</Label><Input type="date" value={form.due_date||""} onChange={e=>set("due_date",e.target.value)} className="mt-1" /></div>
            <div><Label className="text-xs">Date Submitted</Label><Input type="date" value={form.submitted_date||""} onChange={e=>set("submitted_date",e.target.value)} className="mt-1" /></div>
          </div>
          <div><Label className="text-xs">Headline Stats</Label><Input value={form.headline_stats||""} onChange={e=>set("headline_stats",e.target.value)} className="mt-1" placeholder="Key numbers summary" /></div>
          <div><Label className="text-xs">Report Narrative</Label><Textarea value={form.narrative||""} onChange={e=>set("narrative",e.target.value)} rows={8} className="mt-1" /></div>
          <div><Label className="text-xs">Internal Notes</Label><Textarea value={form.notes||""} onChange={e=>set("notes",e.target.value)} rows={2} className="mt-1" /></div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? "Saving..." : report ? "Update" : "Save Report"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}