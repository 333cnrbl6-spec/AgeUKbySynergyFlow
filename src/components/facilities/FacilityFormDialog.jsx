import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const AMENITIES = ["Tables & Chairs","Stage Area","Sound System","Kitchen Access","Accessible Entrance","Parking","Projector","Whiteboard","Tea & Coffee Facilities","Sprung Floor","Mirrors","Natural Light","Outdoor Seating Area","WiFi","Disabled Toilet","Baby Changing"];

const empty = { name:"", type:"room", parent_facility_id:"", parent_facility_name:"", address_line_1:"", town:"", postcode:"", phone:"", email:"", capacity:"", hourly_rate:"", half_day_rate:"", full_day_rate:"", description:"", amenities:[], opening_hours:"", status:"active", notes:"" };

export default function FacilityFormDialog({ open, onOpenChange, facility, onSave }) {
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const { data: centres = [] } = useQuery({ queryKey: ["facilities"], queryFn: () => base44.entities.Facility.filter({ type: "centre" }, "name", 50) });

  useEffect(() => { setForm(facility ? { ...empty, ...facility } : empty); }, [facility, open]);

  const set = (f, v) => setForm(p => ({ ...p, [f]: v }));
  const toggleAmenity = (a) => set("amenities", form.amenities?.includes(a) ? form.amenities.filter(x => x !== a) : [...(form.amenities || []), a]);

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true);
    await onSave(form); setSaving(false); onOpenChange(false);
  };

  const F = ({ label, field, type = "text", placeholder }) => (
    <div><Label className="text-xs">{label}</Label><Input type={type} value={form[field] || ""} onChange={e => set(field, e.target.value)} placeholder={placeholder} className="mt-1" /></div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle className="font-heading">{facility ? "Edit Facility" : "Add Facility / Room"}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit}>
          <Tabs defaultValue="details" className="space-y-4">
            <TabsList className="grid grid-cols-3 w-full">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="rates">Rates & Capacity</TabsTrigger>
              <TabsTrigger value="amenities">Amenities</TabsTrigger>
            </TabsList>
            <TabsContent value="details" className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2"><F label="Name *" field="name" /></div>
                <div>
                  <Label className="text-xs">Type</Label>
                  <Select value={form.type} onValueChange={v => set("type", v)}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["centre","room","outdoor_area","kitchen","cafe","storage"].map(t => <SelectItem key={t} value={t}>{t.replace("_"," ").replace(/\b\w/g,c=>c.toUpperCase())}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Parent Centre (if room/space)</Label>
                  <Select value={form.parent_facility_id || ""} onValueChange={v => { const c = centres.find(c=>c.id===v); set("parent_facility_id", v); set("parent_facility_name", c?.name||""); }}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="None (top-level)" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value={null}>None</SelectItem>
                      {centres.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2"><F label="Address" field="address_line_1" /></div>
                <F label="Town" field="town" />
                <F label="Postcode" field="postcode" />
                <F label="Phone" field="phone" />
                <F label="Email" field="email" type="email" />
                <F label="Opening Hours" field="opening_hours" placeholder="e.g. Mon-Fri 09:00-17:00" />
                <div>
                  <Label className="text-xs">Status</Label>
                  <Select value={form.status} onValueChange={v => set("status", v)}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                      <SelectItem value="under_maintenance">Under Maintenance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2"><Label className="text-xs">Description</Label><Textarea value={form.description||""} onChange={e=>set("description",e.target.value)} rows={2} className="mt-1" /></div>
                <div className="col-span-2"><F label="Notes" field="notes" /></div>
              </div>
            </TabsContent>
            <TabsContent value="rates" className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <F label="Capacity (persons)" field="capacity" type="number" />
                <div />
                <F label="Hourly Rate (£)" field="hourly_rate" type="number" />
                <F label="Half Day Rate (£)" field="half_day_rate" type="number" />
                <F label="Full Day Rate (£)" field="full_day_rate" type="number" />
              </div>
            </TabsContent>
            <TabsContent value="amenities">
              <p className="text-xs text-muted-foreground mb-3">Select all amenities available in this space:</p>
              <div className="flex flex-wrap gap-2">
                {AMENITIES.map(a => (
                  <button key={a} type="button" onClick={() => toggleAmenity(a)}
                    className={`px-2.5 py-1 rounded-full text-xs border font-medium transition-colors ${form.amenities?.includes(a) ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border hover:border-primary hover:text-primary"}`}>
                    {a}
                  </button>
                ))}
              </div>
            </TabsContent>
          </Tabs>
          <div className="flex justify-end gap-2 pt-4 border-t mt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? "Saving..." : facility ? "Update" : "Add Facility"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}