import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const TOWNS = ["Bury", "Ramsbottom", "Tottington", "Prestwich", "Radcliffe", "Whitefield"];
const REFERRAL_SOURCES = [
  { value: "self_referral", label: "Self Referral" },
  { value: "gp", label: "GP" },
  { value: "social_services", label: "Social Services" },
  { value: "hospital", label: "Hospital" },
  { value: "family_friend", label: "Family/Friend" },
  { value: "age_uk_service", label: "Age UK Service" },
  { value: "other", label: "Other" },
];

const emptyClient = {
  first_name: "", last_name: "", phone: "", email: "",
  address_line_1: "", address_line_2: "", town: "", postcode: "",
  date_of_birth: "", notes: "", referral_source: "", status: "active",
  dementia_related: false,
};

export default function ClientFormDialog({ open, onOpenChange, client, onSave }) {
  const [form, setForm] = useState(emptyClient);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(client ? { ...emptyClient, ...client } : emptyClient);
  }, [client, open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    await onSave(form);
    setSaving(false);
    onOpenChange(false);
  };

  const update = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading">{client ? "Edit Client" : "New Client"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>First Name *</Label>
              <Input value={form.first_name} onChange={(e) => update("first_name", e.target.value)} required />
            </div>
            <div>
              <Label>Last Name *</Label>
              <Input value={form.last_name} onChange={(e) => update("last_name", e.target.value)} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Phone *</Label>
              <Input value={form.phone} onChange={(e) => update("phone", e.target.value)} required />
            </div>
            <div>
              <Label>Email</Label>
              <Input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} />
            </div>
          </div>
          <div>
            <Label>Address Line 1</Label>
            <Input value={form.address_line_1} onChange={(e) => update("address_line_1", e.target.value)} />
          </div>
          <div>
            <Label>Address Line 2</Label>
            <Input value={form.address_line_2} onChange={(e) => update("address_line_2", e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Town</Label>
              <Select value={form.town} onValueChange={(v) => update("town", v)}>
                <SelectTrigger><SelectValue placeholder="Select town" /></SelectTrigger>
                <SelectContent>
                  {TOWNS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Postcode</Label>
              <Input value={form.postcode} onChange={(e) => update("postcode", e.target.value)} placeholder="BL9 ..." />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Date of Birth</Label>
              <Input type="date" value={form.date_of_birth} onChange={(e) => update("date_of_birth", e.target.value)} />
            </div>
            <div>
              <Label>Referral Source</Label>
              <Select value={form.referral_source} onValueChange={(v) => update("referral_source", v)}>
                <SelectTrigger><SelectValue placeholder="How found us?" /></SelectTrigger>
                <SelectContent>
                  {REFERRAL_SOURCES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.dementia_related}
                onChange={(e) => update("dementia_related", e.target.checked)}
                className="rounded"
              />
              Requires dementia-related support
            </Label>
          </div>
          <div>
            <Label>Notes</Label>
            <Textarea value={form.notes} onChange={(e) => update("notes", e.target.value)} rows={3} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? "Saving..." : client ? "Update" : "Add Client"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}