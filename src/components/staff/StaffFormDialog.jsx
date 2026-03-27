import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

const emptyStaff = {
  name: "", role: "", phone: "", email: "",
  dbs_checked: true, dbs_expiry: "", status: "active", notes: "",
};

export default function StaffFormDialog({ open, onOpenChange, staff, onSave }) {
  const [form, setForm] = useState(emptyStaff);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(staff ? { ...emptyStaff, ...staff } : emptyStaff);
  }, [staff, open]);

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
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading">{staff ? "Edit Staff" : "Add Staff Member"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Full Name *</Label>
            <Input value={form.name} onChange={(e) => update("name", e.target.value)} required />
          </div>
          <div>
            <Label>Role *</Label>
            <Select value={form.role} onValueChange={(v) => update("role", v)}>
              <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="handyperson">Handyperson</SelectItem>
                <SelectItem value="manager">Manager</SelectItem>
                <SelectItem value="volunteer">Volunteer</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Phone</Label>
              <Input value={form.phone} onChange={(e) => update("phone", e.target.value)} />
            </div>
            <div>
              <Label>Email</Label>
              <Input value={form.email} onChange={(e) => update("email", e.target.value)} />
            </div>
          </div>
          <div className="flex items-center justify-between py-2">
            <Label>DBS Checked</Label>
            <Switch checked={form.dbs_checked} onCheckedChange={(v) => update("dbs_checked", v)} />
          </div>
          {form.dbs_checked && (
            <div>
              <Label>DBS Expiry Date</Label>
              <Input type="date" value={form.dbs_expiry} onChange={(e) => update("dbs_expiry", e.target.value)} />
            </div>
          )}
          <div>
            <Label>Notes</Label>
            <Textarea value={form.notes} onChange={(e) => update("notes", e.target.value)} rows={2} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? "Saving..." : staff ? "Update" : "Add Staff"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}