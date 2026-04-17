import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const NEEDS = ["Loneliness / Isolation","Benefits / Financial","Housing","Mobility / Falls","Bereavement","Mental Health","Nutrition","Carer Support","Medical / Health","Transport","Dementia","End of Life"];
const SERVICES = ["Befriending","Home from Hospital","Information & Advice","Handyperson Service","Friends Together","Jubilee Centre Activities","Dumers Lane Activities","Keeping in Touch Calls","Legal Advice Clinic","Social Prescribing Support"];

const empty = {
  ref_number:"", referral_source_type:"gp_social_prescribing", referring_organisation:"", referring_person_name:"", referring_person_email:"", referring_person_phone:"",
  client_first_name:"", client_last_name:"", client_dob:"", client_phone:"", client_address:"", client_postcode:"", client_email:"",
  reason_for_referral:"", presenting_needs:[], services_requested:[], urgency:"routine", status:"received",
  received_date: new Date().toISOString().split("T")[0], contacted_date:"", assigned_to:"", outcome:"",
  consent_given:false, consent_date:"", safeguarding_concern:false, safeguarding_notes:"", notes:""
};

export default function ReferralFormDialog({ open, onOpenChange, referral, onSave }) {
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (referral) setForm({ ...empty, ...referral });
    else {
      const ref = `REF-${Date.now().toString().slice(-5)}`;
      setForm({ ...empty, ref_number: ref });
    }
  }, [referral, open]);

  const set = (f, v) => setForm(p => ({ ...p, [f]: v }));
  const toggleArr = (field, val) => set(field, form[field]?.includes(val) ? form[field].filter(x => x !== val) : [...(form[field]||[]), val]);

  const handleSubmit = async (e) => { e.preventDefault(); setSaving(true); await onSave(form); setSaving(false); onOpenChange(false); };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle className="font-heading">{referral ? `Edit Referral ${referral.ref_number}` : "New Referral"}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit}>
          <Tabs defaultValue="referrer" className="space-y-4">
            <TabsList className="grid grid-cols-3 w-full">
              <TabsTrigger value="referrer">Referrer</TabsTrigger>
              <TabsTrigger value="client">Client</TabsTrigger>
              <TabsTrigger value="needs">Needs & Services</TabsTrigger>
            </TabsList>

            <TabsContent value="referrer" className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-xs">Ref Number</Label><Input value={form.ref_number} onChange={e=>set("ref_number",e.target.value)} className="mt-1" /></div>
                <div>
                  <Label className="text-xs">Urgency</Label>
                  <Select value={form.urgency} onValueChange={v=>set("urgency",v)}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="routine">Routine</SelectItem>
                      <SelectItem value="soon">Soon</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Referral Source *</Label>
                  <Select value={form.referral_source_type} onValueChange={v=>set("referral_source_type",v)}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {[["gp_social_prescribing","GP / Social Prescribing"],["bolton_council_asc","Bolton Council ASC"],["hospital_discharge","Hospital Discharge"],["self_referral","Self-Referral"],["family_carer","Family / Carer"],["nhs_community","NHS Community"],["another_charity","Another Charity"],["other","Other"]].map(([v,l])=><SelectItem key={v} value={v}>{l}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div><Label className="text-xs">Status</Label>
                  <Select value={form.status} onValueChange={v=>set("status",v)}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["received","contacted","assessment_booked","active","declined","signposted_elsewhere","closed"].map(s=><SelectItem key={s} value={s}>{s.replace(/_/g," ").replace(/\b\w/g,c=>c.toUpperCase())}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div><Label className="text-xs">Referring Organisation</Label><Input value={form.referring_organisation||""} onChange={e=>set("referring_organisation",e.target.value)} placeholder="e.g. Bolton GP Federation" className="mt-1" /></div>
                <div><Label className="text-xs">Referring Person</Label><Input value={form.referring_person_name||""} onChange={e=>set("referring_person_name",e.target.value)} className="mt-1" /></div>
                <div><Label className="text-xs">Referrer Email</Label><Input type="email" value={form.referring_person_email||""} onChange={e=>set("referring_person_email",e.target.value)} className="mt-1" /></div>
                <div><Label className="text-xs">Referrer Phone</Label><Input value={form.referring_person_phone||""} onChange={e=>set("referring_person_phone",e.target.value)} className="mt-1" /></div>
                <div><Label className="text-xs">Date Received</Label><Input type="date" value={form.received_date||""} onChange={e=>set("received_date",e.target.value)} className="mt-1" /></div>
                <div><Label className="text-xs">Date Contacted</Label><Input type="date" value={form.contacted_date||""} onChange={e=>set("contacted_date",e.target.value)} className="mt-1" /></div>
                <div><Label className="text-xs">Assigned To</Label><Input value={form.assigned_to||""} onChange={e=>set("assigned_to",e.target.value)} className="mt-1" /></div>
              </div>
            </TabsContent>

            <TabsContent value="client" className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-xs">First Name *</Label><Input value={form.client_first_name} onChange={e=>set("client_first_name",e.target.value)} required className="mt-1" /></div>
                <div><Label className="text-xs">Last Name *</Label><Input value={form.client_last_name} onChange={e=>set("client_last_name",e.target.value)} required className="mt-1" /></div>
                <div><Label className="text-xs">Date of Birth</Label><Input type="date" value={form.client_dob||""} onChange={e=>set("client_dob",e.target.value)} className="mt-1" /></div>
                <div><Label className="text-xs">Phone</Label><Input value={form.client_phone||""} onChange={e=>set("client_phone",e.target.value)} className="mt-1" /></div>
                <div className="col-span-2"><Label className="text-xs">Address</Label><Input value={form.client_address||""} onChange={e=>set("client_address",e.target.value)} className="mt-1" /></div>
                <div><Label className="text-xs">Postcode</Label><Input value={form.client_postcode||""} onChange={e=>set("client_postcode",e.target.value)} className="mt-1" /></div>
                <div><Label className="text-xs">Email</Label><Input type="email" value={form.client_email||""} onChange={e=>set("client_email",e.target.value)} className="mt-1" /></div>
              </div>
              <div className="space-y-2 border-t pt-3">
                <div className="flex items-center justify-between"><Label className="text-sm">Consent Given</Label><Switch checked={form.consent_given} onCheckedChange={v=>set("consent_given",v)} /></div>
                {form.consent_given && <div><Label className="text-xs">Consent Date</Label><Input type="date" value={form.consent_date||""} onChange={e=>set("consent_date",e.target.value)} className="mt-1" /></div>}
                <div className="flex items-center justify-between pt-1"><Label className="text-sm font-semibold text-red-700">Safeguarding Concern</Label><Switch checked={form.safeguarding_concern} onCheckedChange={v=>set("safeguarding_concern",v)} /></div>
                {form.safeguarding_concern && <div><Label className="text-xs">Safeguarding Notes</Label><Textarea value={form.safeguarding_notes||""} onChange={e=>set("safeguarding_notes",e.target.value)} rows={2} className="mt-1 border-red-300" /></div>}
              </div>
            </TabsContent>

            <TabsContent value="needs" className="space-y-4">
              <div><Label className="text-xs font-semibold">Reason for Referral</Label><Textarea value={form.reason_for_referral||""} onChange={e=>set("reason_for_referral",e.target.value)} rows={3} className="mt-1" /></div>
              <div>
                <p className="text-xs font-semibold mb-2">Presenting Needs</p>
                <div className="flex flex-wrap gap-2">
                  {NEEDS.map(n => <button key={n} type="button" onClick={() => toggleArr("presenting_needs", n)}
                    className={`px-2.5 py-1 rounded-full text-xs border font-medium transition-colors ${form.presenting_needs?.includes(n) ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border hover:border-primary hover:text-primary"}`}>{n}</button>)}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold mb-2">Services Requested</p>
                <div className="flex flex-wrap gap-2">
                  {SERVICES.map(s => <button key={s} type="button" onClick={() => toggleArr("services_requested", s)}
                    className={`px-2.5 py-1 rounded-full text-xs border font-medium transition-colors ${form.services_requested?.includes(s) ? "bg-secondary text-secondary-foreground border-secondary" : "bg-background border-border hover:border-primary hover:text-primary"}`}>{s}</button>)}
                </div>
              </div>
              <div><Label className="text-xs">Outcome / Notes</Label><Textarea value={form.notes||""} onChange={e=>set("notes",e.target.value)} rows={2} className="mt-1" /></div>
            </TabsContent>
          </Tabs>
          <div className="flex justify-end gap-2 pt-4 border-t mt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? "Saving..." : referral ? "Update" : "Submit Referral"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}