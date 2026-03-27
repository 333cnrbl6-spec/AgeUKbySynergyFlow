import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const empty = {
  title:"", facility_id:"", facility_name:"", asset_id:"", asset_name:"",
  category:"other", priority:"medium", status:"reported", description:"",
  reported_by:"", assigned_to:"", supplier_id:"", scheduled_date:"", completed_date:"",
  estimated_cost:"", actual_cost:"", notes:""
};

export default function MaintenanceFormDialog({ open, onOpenChange, request, facilities=[], onSave }) {
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const { data: suppliers = [] } = useQuery({ queryKey:["suppliers"], queryFn: () => base44.entities.Supplier.list("company_name",100) });

  useEffect(() => { setForm(request ? { ...empty, ...request } : empty); }, [request, open]);

  const set = (f, v) => setForm(p => ({ ...p, [f]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true);
    await onSave(form); setSaving(false); onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle className="font-heading">{request ? "Edit Maintenance Request" : "New Maintenance Request"}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div><Label className="text-xs">Title *</Label><Input value={form.title} onChange={e=>set("title",e.target.value)} required className="mt-1" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Facility *</Label>
              <Select value={form.facility_id} onValueChange={v=>{ const f=facilities.find(f=>f.id===v); set("facility_id",v); set("facility_name",f?.name||""); }}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select facility" /></SelectTrigger>
                <SelectContent>{facilities.map(f=><SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Category</Label>
              <Select value={form.category} onValueChange={v=>set("category",v)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["plumbing","electrical","heating_cooling","structural","cleaning","equipment_repair","decoration","grounds","it","security","other"].map(c=><SelectItem key={c} value={c}>{c.replace(/_/g," ").replace(/\b\w/g,x=>x.toUpperCase())}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Priority</Label>
              <Select value={form.priority} onValueChange={v=>set("priority",v)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Status</Label>
              <Select value={form.status} onValueChange={v=>set("status",v)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["reported","assessed","scheduled","in_progress","completed","cancelled"].map(s=><SelectItem key={s} value={s}>{s.replace("_"," ").replace(/\b\w/g,x=>x.toUpperCase())}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div><Label className="text-xs">Description</Label><Textarea value={form.description||""} onChange={e=>set("description",e.target.value)} rows={3} className="mt-1" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-xs">Reported By</Label><Input value={form.reported_by||""} onChange={e=>set("reported_by",e.target.value)} className="mt-1" /></div>
            <div><Label className="text-xs">Assigned To</Label><Input value={form.assigned_to||""} onChange={e=>set("assigned_to",e.target.value)} className="mt-1" /></div>
            <div>
              <Label className="text-xs">Supplier / Contractor</Label>
              <Select value={form.supplier_id||""} onValueChange={v=>{ const s=suppliers.find(s=>s.id===v); set("supplier_id",v); set("assigned_to",s?.company_name||form.assigned_to); }}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select (optional)" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>None</SelectItem>
                  {suppliers.map(s=><SelectItem key={s.id} value={s.id}>{s.company_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label className="text-xs">Scheduled Date</Label><Input type="date" value={form.scheduled_date||""} onChange={e=>set("scheduled_date",e.target.value)} className="mt-1" /></div>
            <div><Label className="text-xs">Estimated Cost (£)</Label><Input type="number" value={form.estimated_cost||""} onChange={e=>set("estimated_cost",e.target.value)} className="mt-1" /></div>
            <div><Label className="text-xs">Actual Cost (£)</Label><Input type="number" value={form.actual_cost||""} onChange={e=>set("actual_cost",e.target.value)} className="mt-1" /></div>
            {form.status === "completed" && <div><Label className="text-xs">Completed Date</Label><Input type="date" value={form.completed_date||""} onChange={e=>set("completed_date",e.target.value)} className="mt-1" /></div>}
          </div>
          <div><Label className="text-xs">Notes</Label><Textarea value={form.notes||""} onChange={e=>set("notes",e.target.value)} rows={2} className="mt-1" /></div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={()=>onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving?"Saving...":request?"Update":"Submit Request"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}