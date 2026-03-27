import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const empty = {
  organisation_name:"", partner_type:"voluntary_sector", relationship_type:"referral_partner",
  primary_contact_name:"", primary_contact_role:"", primary_contact_email:"", primary_contact_phone:"",
  secondary_contact_name:"", secondary_contact_email:"", address:"", website:"",
  contract_reference:"", contract_start:"", contract_end:"", contract_value:"",
  next_meeting_date:"", meeting_frequency:"quarterly", status:"active", services_linked:[], notes:"", last_contact_date:""
};

const SERVICES = ["Handyperson","Befriending","Home from Hospital","Information & Advice","Friends Together","Jubilee Centre","Dumers Lane","Keeping in Touch","Legal Advice","Social Prescribing"];

export default function PartnerFormDialog({ open, onOpenChange, partner, onSave }) {
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);

  useEffect(() => { setForm(partner ? { ...empty, ...partner } : empty); }, [partner, open]);
  const set = (f, v) => setForm(p => ({ ...p, [f]: v }));
  const toggleService = s => set("services_linked", form.services_linked?.includes(s) ? form.services_linked.filter(x => x !== s) : [...(form.services_linked||[]), s]);

  const handleSubmit = async (e) => { e.preventDefault(); setSaving(true); await onSave(form); setSaving(false); onOpenChange(false); };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle className="font-heading">{partner ? "Edit Partner" : "Add Partner / Stakeholder"}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit}>
          <Tabs defaultValue="details" className="space-y-4">
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="contract">Contract & Meetings</TabsTrigger>
            </TabsList>
            <TabsContent value="details" className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2"><Label className="text-xs">Organisation Name *</Label><Input value={form.organisation_name} onChange={e=>set("organisation_name",e.target.value)} required className="mt-1" /></div>
                <div>
                  <Label className="text-xs">Type</Label>
                  <Select value={form.partner_type} onValueChange={v=>set("partner_type",v)}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {[["bury_council","Bury Council"],["nhs_icb","NHS ICB"],["gp_federation","GP Federation"],["hospital","Hospital"],["age_uk_national","Age UK National"],["age_uk_gm","Age UK GM"],["housing","Housing"],["police_fire","Police/Fire"],["voluntary_sector","Voluntary Sector"],["corporate_sponsor","Corporate Sponsor"],["faith_group","Faith Group"],["other","Other"]].map(([v,l])=><SelectItem key={v} value={v}>{l}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Relationship</Label>
                  <Select value={form.relationship_type} onValueChange={v=>set("relationship_type",v)}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["commissioner","funder","referral_partner","delivery_partner","peer_network","landlord","other"].map(s=><SelectItem key={s} value={s}>{s.replace(/_/g," ").replace(/\b\w/g,c=>c.toUpperCase())}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Status</Label>
                  <Select value={form.status} onValueChange={v=>set("status",v)}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="prospective">Prospective</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div><Label className="text-xs">Website</Label><Input value={form.website||""} onChange={e=>set("website",e.target.value)} className="mt-1" /></div>
                <div><Label className="text-xs">Primary Contact Name</Label><Input value={form.primary_contact_name||""} onChange={e=>set("primary_contact_name",e.target.value)} className="mt-1" /></div>
                <div><Label className="text-xs">Role / Title</Label><Input value={form.primary_contact_role||""} onChange={e=>set("primary_contact_role",e.target.value)} className="mt-1" /></div>
                <div><Label className="text-xs">Email</Label><Input type="email" value={form.primary_contact_email||""} onChange={e=>set("primary_contact_email",e.target.value)} className="mt-1" /></div>
                <div><Label className="text-xs">Phone</Label><Input value={form.primary_contact_phone||""} onChange={e=>set("primary_contact_phone",e.target.value)} className="mt-1" /></div>
                <div><Label className="text-xs">Secondary Contact</Label><Input value={form.secondary_contact_name||""} onChange={e=>set("secondary_contact_name",e.target.value)} className="mt-1" /></div>
                <div><Label className="text-xs">Secondary Email</Label><Input type="email" value={form.secondary_contact_email||""} onChange={e=>set("secondary_contact_email",e.target.value)} className="mt-1" /></div>
                <div className="col-span-2"><Label className="text-xs">Address</Label><Input value={form.address||""} onChange={e=>set("address",e.target.value)} className="mt-1" /></div>
                <div><Label className="text-xs">Last Contact Date</Label><Input type="date" value={form.last_contact_date||""} onChange={e=>set("last_contact_date",e.target.value)} className="mt-1" /></div>
              </div>
              <div>
                <p className="text-xs font-semibold mb-2">Linked Services</p>
                <div className="flex flex-wrap gap-1.5">
                  {SERVICES.map(s => <button key={s} type="button" onClick={() => toggleService(s)}
                    className={`px-2 py-0.5 rounded-full text-xs border transition-colors ${form.services_linked?.includes(s) ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border hover:border-primary"}`}>{s}</button>)}
                </div>
              </div>
              <div><Label className="text-xs">Notes</Label><Textarea value={form.notes||""} onChange={e=>set("notes",e.target.value)} rows={2} className="mt-1" /></div>
            </TabsContent>
            <TabsContent value="contract" className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-xs">Contract Reference</Label><Input value={form.contract_reference||""} onChange={e=>set("contract_reference",e.target.value)} className="mt-1" /></div>
                <div><Label className="text-xs">Contract Value (£)</Label><Input type="number" value={form.contract_value||""} onChange={e=>set("contract_value",e.target.value)} className="mt-1" /></div>
                <div><Label className="text-xs">Contract Start</Label><Input type="date" value={form.contract_start||""} onChange={e=>set("contract_start",e.target.value)} className="mt-1" /></div>
                <div><Label className="text-xs">Contract End</Label><Input type="date" value={form.contract_end||""} onChange={e=>set("contract_end",e.target.value)} className="mt-1" /></div>
                <div><Label className="text-xs">Next Meeting</Label><Input type="date" value={form.next_meeting_date||""} onChange={e=>set("next_meeting_date",e.target.value)} className="mt-1" /></div>
                <div>
                  <Label className="text-xs">Meeting Frequency</Label>
                  <Select value={form.meeting_frequency||"quarterly"} onValueChange={v=>set("meeting_frequency",v)}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["weekly","monthly","quarterly","biannual","annual","ad_hoc"].map(s=><SelectItem key={s} value={s}>{s.replace("_"," ").replace(/\b\w/g,c=>c.toUpperCase())}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>
          </Tabs>
          <div className="flex justify-end gap-2 pt-4 border-t mt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? "Saving..." : partner ? "Update" : "Add Partner"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}