import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const empty = { partner_id:"", partner_name:"", interaction_type:"meeting", date: new Date().toISOString().split("T")[0], attendees:"", summary:"", actions:"", next_steps:"", follow_up_date:"" };

export default function InteractionFormDialog({ open, onOpenChange, partners=[], preselectedPartner, onSave }) {
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (preselectedPartner) setForm({ ...empty, partner_id: preselectedPartner.id, partner_name: preselectedPartner.organisation_name });
    else setForm(empty);
  }, [preselectedPartner, open]);

  const set = (f, v) => setForm(p => ({ ...p, [f]: v }));
  const handleSubmit = async (e) => { e.preventDefault(); setSaving(true); await onSave(form); setSaving(false); onOpenChange(false); };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle className="font-heading">Log Interaction</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Label className="text-xs">Partner *</Label>
              <Select value={form.partner_id} onValueChange={v=>{ const p=partners.find(p=>p.id===v); set("partner_id",v); set("partner_name",p?.organisation_name||""); }}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select partner" /></SelectTrigger>
                <SelectContent>{partners.map(p=><SelectItem key={p.id} value={p.id}>{p.organisation_name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Type</Label>
              <Select value={form.interaction_type} onValueChange={v=>set("interaction_type",v)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["meeting","phone_call","email","report_submitted","contract_review","site_visit","event","other"].map(t=><SelectItem key={t} value={t}>{t.replace(/_/g," ").replace(/\b\w/g,c=>c.toUpperCase())}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label className="text-xs">Date *</Label><Input type="date" value={form.date} onChange={e=>set("date",e.target.value)} required className="mt-1" /></div>
            <div className="col-span-2"><Label className="text-xs">Attendees</Label><Input value={form.attendees||""} onChange={e=>set("attendees",e.target.value)} placeholder="Names of those present" className="mt-1" /></div>
          </div>
          <div><Label className="text-xs">Summary / Notes</Label><Textarea value={form.summary||""} onChange={e=>set("summary",e.target.value)} rows={4} className="mt-1" /></div>
          <div><Label className="text-xs">Action Points</Label><Textarea value={form.actions||""} onChange={e=>set("actions",e.target.value)} rows={2} className="mt-1" placeholder="Who does what by when..." /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-xs">Next Steps</Label><Input value={form.next_steps||""} onChange={e=>set("next_steps",e.target.value)} className="mt-1" /></div>
            <div><Label className="text-xs">Follow-Up Date</Label><Input type="date" value={form.follow_up_date||""} onChange={e=>set("follow_up_date",e.target.value)} className="mt-1" /></div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Save Interaction"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}