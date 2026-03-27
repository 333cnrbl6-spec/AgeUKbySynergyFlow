import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const empty = { title:"", category:"charity_commission", description:"", due_date:"", completed_date:"", responsible_person:"", status:"upcoming", recurrence:"annual", external_reference:"", evidence_url:"", notes:"", reminder_days_before:30 };

export default function ComplianceFormDialog({ open, onOpenChange, item, onSave }) {
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);

  useEffect(() => { setForm(item ? { ...empty, ...item } : empty); }, [item, open]);
  const set = (f, v) => setForm(p => ({ ...p, [f]: v }));

  const handleSubmit = async (e) => { e.preventDefault(); setSaving(true); await onSave(form); setSaving(false); onOpenChange(false); };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle className="font-heading">{item ? "Edit Compliance Item" : "Add Compliance Item"}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div><Label className="text-xs">Title *</Label><Input value={form.title} onChange={e=>set("title",e.target.value)} required className="mt-1" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Category</Label>
              <Select value={form.category} onValueChange={v=>set("category",v)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[["charity_commission","🏛️ Charity Commission"],["companies_house","🏢 Companies House"],["oqs_standard","⭐ OQS Standard"],["insurance","🛡️ Insurance"],["dbs","👤 DBS Checks"],["health_safety","⚕️ Health & Safety"],["gdpr","🔒 GDPR/Data"],["safeguarding","🤝 Safeguarding"],["trustee_governance","👥 Trustee Governance"],["contract_compliance","📋 Contract Compliance"],["other","📌 Other"]].map(([v,l])=><SelectItem key={v} value={v}>{l}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Status</Label>
              <Select value={form.status} onValueChange={v=>set("status",v)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="upcoming">Upcoming</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="not_applicable">Not Applicable</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label className="text-xs">Due Date *</Label><Input type="date" value={form.due_date} onChange={e=>set("due_date",e.target.value)} required className="mt-1" /></div>
            <div><Label className="text-xs">Completed Date</Label><Input type="date" value={form.completed_date||""} onChange={e=>set("completed_date",e.target.value)} className="mt-1" /></div>
            <div><Label className="text-xs">Responsible Person</Label><Input value={form.responsible_person||""} onChange={e=>set("responsible_person",e.target.value)} className="mt-1" /></div>
            <div>
              <Label className="text-xs">Recurrence</Label>
              <Select value={form.recurrence} onValueChange={v=>set("recurrence",v)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["one_off","monthly","quarterly","biannual","annual"].map(s=><SelectItem key={s} value={s}>{s.replace("_"," ").replace(/\b\w/g,c=>c.toUpperCase())}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label className="text-xs">Reminder (days before)</Label><Input type="number" value={form.reminder_days_before||30} onChange={e=>set("reminder_days_before",parseInt(e.target.value)||30)} className="mt-1" /></div>
            <div><Label className="text-xs">External Reference</Label><Input value={form.external_reference||""} onChange={e=>set("external_reference",e.target.value)} className="mt-1" /></div>
          </div>
          <div><Label className="text-xs">Description</Label><Textarea value={form.description||""} onChange={e=>set("description",e.target.value)} rows={2} className="mt-1" /></div>
          <div><Label className="text-xs">Notes</Label><Textarea value={form.notes||""} onChange={e=>set("notes",e.target.value)} rows={2} className="mt-1" /></div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? "Saving..." : item ? "Update" : "Add Item"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}