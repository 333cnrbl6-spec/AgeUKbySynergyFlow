import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SkillsSelector from "./SkillsSelector";

const empty = {
  company_name: "", contact_name: "", supplier_type: "", skills: [],
  phone: "", mobile: "", email: "", website: "",
  address_line_1: "", address_line_2: "", town: "", county: "", postcode: "",
  bank_name: "", bank_account_name: "", bank_sort_code: "", bank_account_number: "",
  vat_registered: false, vat_number: "", company_number: "",
  insurance_expiry: "", gas_safe_number: "", gas_safe_expiry: "",
  status: "active", preferred: false, notes: "",
};

export default function SupplierFormDialog({ open, onOpenChange, supplier, onSave }) {
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(supplier ? { ...empty, ...supplier } : empty);
  }, [supplier, open]);

  const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    await onSave(form);
    setSaving(false);
    onOpenChange(false);
  };

  const F = ({ label, field, type = "text", placeholder }) => (
    <div>
      <Label className="text-xs">{label}</Label>
      <Input type={type} value={form[field] || ""} onChange={e => set(field, e.target.value)} placeholder={placeholder} className="mt-1" />
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading">{supplier ? "Edit Supplier" : "Add Supplier"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <Tabs defaultValue="details" className="space-y-4">
            <TabsList className="grid grid-cols-4 w-full">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="skills">Skills</TabsTrigger>
              <TabsTrigger value="address">Address</TabsTrigger>
              <TabsTrigger value="banking">Banking</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <Label className="text-xs">Company / Trading Name *</Label>
                  <Input value={form.company_name} onChange={e => set("company_name", e.target.value)} required className="mt-1" />
                </div>
                <F label="Contact Name" field="contact_name" />
                <div>
                  <Label className="text-xs">Supplier Type *</Label>
                  <Select value={form.supplier_type} onValueChange={v => set("supplier_type", v)}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Select type" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="subcontractor">Subcontractor</SelectItem>
                      <SelectItem value="direct_referral">Direct Referral</SelectItem>
                      <SelectItem value="materials_supplier">Materials Supplier</SelectItem>
                      <SelectItem value="specialist_contractor">Specialist Contractor</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <F label="Phone" field="phone" />
                <F label="Mobile" field="mobile" />
                <F label="Email" field="email" type="email" />
                <F label="Website" field="website" />
                <F label="Company Number" field="company_number" />
                <F label="Insurance Expiry" field="insurance_expiry" type="date" />
                <F label="Gas Safe Number" field="gas_safe_number" />
                <F label="Gas Safe Expiry" field="gas_safe_expiry" type="date" />
              </div>
              <div className="flex items-center justify-between py-2 border-t">
                <div>
                  <Label className="text-xs font-medium">VAT Registered</Label>
                </div>
                <Switch checked={form.vat_registered} onCheckedChange={v => set("vat_registered", v)} />
              </div>
              {form.vat_registered && <F label="VAT Number" field="vat_number" />}
              <div className="flex items-center justify-between py-2 border-t">
                <Label className="text-xs font-medium">Preferred Supplier</Label>
                <Switch checked={form.preferred} onCheckedChange={v => set("preferred", v)} />
              </div>
              <div>
                <Label className="text-xs">Status</Label>
                <Select value={form.status} onValueChange={v => set("status", v)}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Notes</Label>
                <Textarea value={form.notes || ""} onChange={e => set("notes", e.target.value)} rows={2} className="mt-1" />
              </div>
            </TabsContent>

            <TabsContent value="skills">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Select all trades and skills this supplier offers:</p>
                {form.skills?.length > 0 && (
                  <p className="text-xs font-medium text-primary">{form.skills.length} selected: {form.skills.join(", ")}</p>
                )}
                <SkillsSelector selected={form.skills || []} onChange={v => set("skills", v)} />
              </div>
            </TabsContent>

            <TabsContent value="address" className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2"><F label="Address Line 1" field="address_line_1" /></div>
                <div className="col-span-2"><F label="Address Line 2" field="address_line_2" /></div>
                <F label="Town / City" field="town" />
                <F label="County" field="county" />
                <F label="Postcode" field="postcode" />
              </div>
            </TabsContent>

            <TabsContent value="banking" className="space-y-3">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
                Banking details are stored securely and used for BACS payment processing only.
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2"><F label="Bank Name" field="bank_name" /></div>
                <div className="col-span-2"><F label="Account Name" field="bank_account_name" /></div>
                <F label="Sort Code" field="bank_sort_code" placeholder="00-00-00" />
                <F label="Account Number" field="bank_account_number" placeholder="12345678" />
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-2 pt-4 border-t mt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? "Saving..." : supplier ? "Update" : "Add Supplier"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}