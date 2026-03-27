import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

const empty = {
  booking_ref:"", facility_id:"", facility_name:"", booking_type:"external_hire",
  activity_name:"", organiser_name:"", organiser_phone:"", organiser_email:"", organiser_organisation:"",
  date:"", start_time:"", end_time:"", duration_hours:"", expected_attendees:"",
  recurring:false, recurrence_pattern:"", recurrence_end_date:"",
  setup_requirements:"", rate_type:"hourly", agreed_rate:"", total_charge:"",
  payment_status:"not_invoiced", deposit_paid:false, deposit_amount:"", status:"enquiry", notes:""
};

export default function BookingFormDialog({ open, onOpenChange, booking, facilities = [], onSave }) {
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (booking) setForm({ ...empty, ...booking });
    else {
      const ref = `BK-${Date.now().toString().slice(-5)}`;
      setForm({ ...empty, booking_ref: ref });
    }
  }, [booking, open]);

  const set = (f, v) => setForm(p => ({ ...p, [f]: v }));

  const handleFacility = (id) => {
    const f = facilities.find(f => f.id === id);
    set("facility_id", id);
    set("facility_name", f ? `${f.name}${f.parent_facility_name ? " - " + f.parent_facility_name : ""}` : "");
    if (f?.hourly_rate) set("agreed_rate", f.hourly_rate);
  };

  const calcTotal = () => {
    const hours = parseFloat(form.duration_hours) || 0;
    const rate = parseFloat(form.agreed_rate) || 0;
    let total = 0;
    if (form.rate_type === "hourly") total = hours * rate;
    else if (form.rate_type === "half_day") total = rate;
    else if (form.rate_type === "full_day") total = rate;
    set("total_charge", total);
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true);
    await onSave(form); setSaving(false); onOpenChange(false);
  };

  const bookableRooms = facilities.filter(f => f.type !== "centre" && f.type !== "cafe");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle className="font-heading">{booking ? `Edit Booking ${booking.booking_ref}` : "New Room Booking"}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-xs">Booking Ref</Label><Input value={form.booking_ref} onChange={e=>set("booking_ref",e.target.value)} className="mt-1" /></div>
            <div>
              <Label className="text-xs">Status</Label>
              <Select value={form.status} onValueChange={v=>set("status",v)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["enquiry","provisional","confirmed","cancelled","completed"].map(s=><SelectItem key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-2">
              <Label className="text-xs">Room / Space *</Label>
              <Select value={form.facility_id} onValueChange={handleFacility}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select room" /></SelectTrigger>
                <SelectContent>
                  {bookableRooms.map(f=><SelectItem key={f.id} value={f.id}>{f.name}{f.parent_facility_name ? ` — ${f.parent_facility_name}` : ""}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs">Booking Type</Label>
              <Select value={form.booking_type} onValueChange={v=>set("booking_type",v)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="external_hire">External Hire</SelectItem>
                  <SelectItem value="internal_activity">Internal Activity</SelectItem>
                  <SelectItem value="one_off_event">One-Off Event</SelectItem>
                  <SelectItem value="regular_session">Regular Session</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label className="text-xs">Activity / Event Name *</Label><Input value={form.activity_name} onChange={e=>set("activity_name",e.target.value)} required className="mt-1" /></div>

            <div><Label className="text-xs">Organiser Name</Label><Input value={form.organiser_name} onChange={e=>set("organiser_name",e.target.value)} className="mt-1" /></div>
            <div><Label className="text-xs">Organisation</Label><Input value={form.organiser_organisation||""} onChange={e=>set("organiser_organisation",e.target.value)} className="mt-1" /></div>
            <div><Label className="text-xs">Phone</Label><Input value={form.organiser_phone||""} onChange={e=>set("organiser_phone",e.target.value)} className="mt-1" /></div>
            <div><Label className="text-xs">Email</Label><Input type="email" value={form.organiser_email||""} onChange={e=>set("organiser_email",e.target.value)} className="mt-1" /></div>

            <div><Label className="text-xs">Date *</Label><Input type="date" value={form.date} onChange={e=>set("date",e.target.value)} required className="mt-1" /></div>
            <div><Label className="text-xs">Expected Attendees</Label><Input type="number" value={form.expected_attendees||""} onChange={e=>set("expected_attendees",e.target.value)} className="mt-1" /></div>
            <div><Label className="text-xs">Start Time</Label><Input type="time" value={form.start_time||""} onChange={e=>set("start_time",e.target.value)} className="mt-1" /></div>
            <div><Label className="text-xs">End Time</Label><Input type="time" value={form.end_time||""} onChange={e=>set("end_time",e.target.value)} className="mt-1" /></div>
            <div><Label className="text-xs">Duration (hours)</Label><Input type="number" step="0.5" value={form.duration_hours||""} onChange={e=>set("duration_hours",e.target.value)} onBlur={calcTotal} className="mt-1" /></div>
          </div>

          <div className="flex items-center justify-between py-2 border-t">
            <Label className="text-sm font-medium">Recurring Booking</Label>
            <Switch checked={form.recurring} onCheckedChange={v=>set("recurring",v)} />
          </div>
          {form.recurring && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Pattern</Label>
                <Select value={form.recurrence_pattern} onValueChange={v=>set("recurrence_pattern",v)}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="fortnightly">Fortnightly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label className="text-xs">End Date</Label><Input type="date" value={form.recurrence_end_date||""} onChange={e=>set("recurrence_end_date",e.target.value)} className="mt-1" /></div>
            </div>
          )}

          <div className="grid grid-cols-3 gap-3 border-t pt-3">
            <div>
              <Label className="text-xs">Rate Type</Label>
              <Select value={form.rate_type} onValueChange={v=>{set("rate_type",v);}} >
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="hourly">Hourly</SelectItem>
                  <SelectItem value="half_day">Half Day</SelectItem>
                  <SelectItem value="full_day">Full Day</SelectItem>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="donation">Donation</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {form.rate_type !== "free" && form.rate_type !== "donation" && (
              <div><Label className="text-xs">Rate (£)</Label><Input type="number" value={form.agreed_rate||""} onChange={e=>set("agreed_rate",e.target.value)} onBlur={calcTotal} className="mt-1" /></div>
            )}
            <div><Label className="text-xs">Total Charge (£)</Label><Input type="number" value={form.total_charge||""} onChange={e=>set("total_charge",e.target.value)} className="mt-1" /></div>
            <div>
              <Label className="text-xs">Payment Status</Label>
              <Select value={form.payment_status} onValueChange={v=>set("payment_status",v)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="not_invoiced">Not Invoiced</SelectItem>
                  <SelectItem value="invoiced">Invoiced</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="waived">Waived</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center justify-between py-2">
            <Label className="text-sm font-medium">Deposit Paid</Label>
            <Switch checked={form.deposit_paid} onCheckedChange={v=>set("deposit_paid",v)} />
          </div>
          {form.deposit_paid && <div><Label className="text-xs">Deposit Amount (£)</Label><Input type="number" value={form.deposit_amount||""} onChange={e=>set("deposit_amount",e.target.value)} className="mt-1" /></div>}

          <div><Label className="text-xs">Setup Requirements</Label><Textarea value={form.setup_requirements||""} onChange={e=>set("setup_requirements",e.target.value)} rows={2} className="mt-1" /></div>
          <div><Label className="text-xs">Notes</Label><Textarea value={form.notes||""} onChange={e=>set("notes",e.target.value)} rows={2} className="mt-1" /></div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? "Saving..." : booking ? "Update Booking" : "Create Booking"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}