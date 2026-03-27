import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";

const JOB_TYPES = [
  { value: "handrails", label: "Handrails" },
  { value: "security_locks", label: "Security Locks" },
  { value: "shelves", label: "Shelves" },
  { value: "curtain_rails", label: "Curtain Rails" },
  { value: "wall_decorations", label: "Wall Decorations" },
  { value: "minor_plumbing", label: "Minor Plumbing" },
  { value: "painting_decorating", label: "Painting & Decorating" },
  { value: "light_bulbs", label: "Light Bulbs" },
  { value: "flat_pack", label: "Flat Pack Assembly" },
  { value: "smoke_alarms", label: "Smoke Alarms / CO Detectors" },
  { value: "key_safes", label: "Key Safes" },
  { value: "draught_excluders", label: "Draught Excluders / Energy" },
  { value: "carpet_cleaning", label: "Carpet Cleaning" },
  { value: "minor_gardening", label: "Minor Gardening" },
  { value: "fence_painting", label: "Fence Painting" },
  { value: "furniture_moving", label: "Furniture Moving" },
  { value: "other", label: "Other" },
];

const STATUSES = [
  "enquiry", "assessment_booked", "quoted", "scheduled", 
  "in_progress", "completed", "paid", "cancelled", "referred_out"
];

const emptyJob = {
  client_id: "", client_name: "", title: "", description: "",
  job_type: "", status: "enquiry", assigned_to: "", scheduled_date: "",
  scheduled_time: "", estimated_hours: "", actual_hours: "",
  materials_cost: "", labour_cost: "", total_cost: "",
  payment_method: "unpaid", payment_status: "unpaid",
  referral_notes: "", address: "", priority: "medium",
};

export default function JobFormDialog({ open, onOpenChange, job, onSave }) {
  const [form, setForm] = useState(emptyJob);
  const [saving, setSaving] = useState(false);

  const { data: clients = [] } = useQuery({
    queryKey: ["clients"],
    queryFn: () => base44.entities.Client.list("last_name", 500),
  });

  const { data: staff = [] } = useQuery({
    queryKey: ["staff"],
    queryFn: () => base44.entities.StaffMember.list("name", 50),
  });

  useEffect(() => {
    setForm(job ? { ...emptyJob, ...job } : emptyJob);
  }, [job, open]);

  const handleClientChange = (clientId) => {
    const client = clients.find(c => c.id === clientId);
    if (client) {
      const address = [client.address_line_1, client.address_line_2, client.town, client.postcode].filter(Boolean).join(", ");
      setForm(prev => ({
        ...prev,
        client_id: clientId,
        client_name: `${client.first_name} ${client.last_name}`,
        address: prev.address || address,
      }));
    }
  };

  const calcLabour = (hours) => {
    if (!hours || hours <= 0) return 0;
    return 35 + Math.max(0, hours - 1) * 25;
  };

  const handleHoursChange = (field, value) => {
    const hours = parseFloat(value) || 0;
    const labour = calcLabour(hours);
    const materials = parseFloat(form.materials_cost) || 0;
    setForm(prev => ({
      ...prev,
      [field]: value,
      labour_cost: labour,
      total_cost: labour + materials,
    }));
  };

  const handleMaterialsChange = (value) => {
    const materials = parseFloat(value) || 0;
    const labour = parseFloat(form.labour_cost) || 0;
    setForm(prev => ({
      ...prev,
      materials_cost: value,
      total_cost: labour + materials,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const data = {
      ...form,
      estimated_hours: parseFloat(form.estimated_hours) || 0,
      actual_hours: parseFloat(form.actual_hours) || 0,
      materials_cost: parseFloat(form.materials_cost) || 0,
      labour_cost: parseFloat(form.labour_cost) || 0,
      total_cost: parseFloat(form.total_cost) || 0,
    };
    await onSave(data);
    setSaving(false);
    onOpenChange(false);
  };

  const update = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading">{job ? "Edit Job" : "New Job"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Client & Type */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Client *</Label>
              <Select value={form.client_id} onValueChange={handleClientChange}>
                <SelectTrigger><SelectValue placeholder="Select client" /></SelectTrigger>
                <SelectContent>
                  {clients.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.first_name} {c.last_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Job Type *</Label>
              <Select value={form.job_type} onValueChange={(v) => update("job_type", v)}>
                <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>
                  {JOB_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Job Title *</Label>
            <Input value={form.title} onChange={(e) => update("title", e.target.value)} required placeholder="Brief description of the job" />
          </div>

          <div>
            <Label>Description</Label>
            <Textarea value={form.description} onChange={(e) => update("description", e.target.value)} rows={3} placeholder="Detailed description of work..." />
          </div>

          <div>
            <Label>Job Address</Label>
            <Input value={form.address} onChange={(e) => update("address", e.target.value)} />
          </div>

          {/* Status & Assignment */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => update("status", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUSES.map(s => (
                    <SelectItem key={s} value={s}>{s.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Assigned To</Label>
              <Select value={form.assigned_to} onValueChange={(v) => update("assigned_to", v)}>
                <SelectTrigger><SelectValue placeholder="Assign staff" /></SelectTrigger>
                <SelectContent>
                  {staff.filter(s => s.status === "active").map(s => (
                    <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Priority</Label>
              <Select value={form.priority} onValueChange={(v) => update("priority", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Schedule */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Scheduled Date</Label>
              <Input type="date" value={form.scheduled_date} onChange={(e) => update("scheduled_date", e.target.value)} />
            </div>
            <div>
              <Label>Scheduled Time</Label>
              <Input type="time" value={form.scheduled_time} onChange={(e) => update("scheduled_time", e.target.value)} />
            </div>
          </div>

          {/* Costs */}
          <div className="grid grid-cols-4 gap-3">
            <div>
              <Label>Est. Hours</Label>
              <Input type="number" step="0.5" value={form.estimated_hours} onChange={(e) => handleHoursChange("estimated_hours", e.target.value)} />
            </div>
            <div>
              <Label>Actual Hours</Label>
              <Input type="number" step="0.5" value={form.actual_hours} onChange={(e) => handleHoursChange("actual_hours", e.target.value)} />
            </div>
            <div>
              <Label>Materials £</Label>
              <Input type="number" step="0.01" value={form.materials_cost} onChange={(e) => handleMaterialsChange(e.target.value)} />
            </div>
            <div>
              <Label>Total £</Label>
              <Input type="number" step="0.01" value={form.total_cost} onChange={(e) => update("total_cost", e.target.value)} />
            </div>
          </div>

          {/* Payment */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Payment Method</Label>
              <Select value={form.payment_method} onValueChange={(v) => update("payment_method", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="unpaid">Not Paid</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="cheque">Cheque</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Payment Status</Label>
              <Select value={form.payment_status} onValueChange={(v) => update("payment_status", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="unpaid">Unpaid</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="waived">Waived</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {form.status === "referred_out" && (
            <div>
              <Label>Referral Notes</Label>
              <Textarea value={form.referral_notes} onChange={(e) => update("referral_notes", e.target.value)} placeholder="Referred to..." rows={2} />
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? "Saving..." : job ? "Update Job" : "Create Job"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}