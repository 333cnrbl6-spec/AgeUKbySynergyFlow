import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, Plus, Pencil, Calendar, Wrench, Coffee, Users, MapPin, Phone, Clock, AlertTriangle, CheckCircle2, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import FacilityFormDialog from "../components/facilities/FacilityFormDialog";
import BookingFormDialog from "../components/facilities/BookingFormDialog";
import MaintenanceFormDialog from "../components/facilities/MaintenanceFormDialog";
import CafeTillDialog from "../components/facilities/CafeTillDialog";

const statusColors = {
  active:"bg-emerald-50 text-emerald-700 border-emerald-200", closed:"bg-gray-100 text-gray-600 border-gray-200", under_maintenance:"bg-amber-50 text-amber-700 border-amber-200",
  reported:"bg-red-50 text-red-700", assessed:"bg-amber-50 text-amber-700", scheduled:"bg-blue-50 text-blue-700", in_progress:"bg-purple-50 text-purple-700", completed:"bg-emerald-50 text-emerald-700", cancelled:"bg-gray-100 text-gray-500",
  enquiry:"bg-gray-100 text-gray-600", provisional:"bg-amber-50 text-amber-700", confirmed:"bg-emerald-50 text-emerald-700",
};
const priorityColors = { low:"text-gray-500", medium:"text-amber-600", high:"text-orange-600", urgent:"text-red-600 font-bold" };

export default function Facilities() {
  const [facilityDialog, setFacilityDialog] = useState(false);
  const [editingFacility, setEditingFacility] = useState(null);
  const [bookingDialog, setBookingDialog] = useState(false);
  const [editingBooking, setEditingBooking] = useState(null);
  const [maintenanceDialog, setMaintenanceDialog] = useState(false);
  const [editingMaint, setEditingMaint] = useState(null);
  const [cafeDialog, setCafeDialog] = useState(false);
  const [filterFacility, setFilterFacility] = useState("all");
  const [bookingSearch, setBookingSearch] = useState("");
  const qc = useQueryClient();

  const { data: facilities = [], isLoading: loadingFac } = useQuery({ queryKey:["facilities"], queryFn: () => base44.entities.Facility.list("name", 100) });
  const { data: bookings = [] } = useQuery({ queryKey:["bookings"], queryFn: () => base44.entities.RoomBooking.list("-date", 200) });
  const { data: maintenance = [] } = useQuery({ queryKey:["maintenance"], queryFn: () => base44.entities.MaintenanceRequest.list("-created_date", 200) });
  const { data: cafeSales = [] } = useQuery({ queryKey:["cafeSales"], queryFn: () => base44.entities.CafeSale.list("-sale_date", 90) });

  const saveFacility = useMutation({ mutationFn: f => f.id ? base44.entities.Facility.update(f.id, f) : base44.entities.Facility.create(f), onSuccess: () => qc.invalidateQueries({queryKey:["facilities"]}) });
  const saveBooking = useMutation({ mutationFn: b => b.id ? base44.entities.RoomBooking.update(b.id, b) : base44.entities.RoomBooking.create(b), onSuccess: () => qc.invalidateQueries({queryKey:["bookings"]}) });
  const saveMaint = useMutation({ mutationFn: m => m.id ? base44.entities.MaintenanceRequest.update(m.id, m) : base44.entities.MaintenanceRequest.create(m), onSuccess: () => qc.invalidateQueries({queryKey:["maintenance"]}) });
  const saveCafe = useMutation({ mutationFn: s => base44.entities.CafeSale.create(s), onSuccess: () => qc.invalidateQueries({queryKey:["cafeSales"]}) });

  // Stats
  const today = new Date().toISOString().split("T")[0];
  const todayBookings = bookings.filter(b => b.date === today && b.status !== "cancelled");
  const openMaint = maintenance.filter(m => !["completed","cancelled"].includes(m.status));
  const urgentMaint = openMaint.filter(m => m.priority === "urgent" || m.priority === "high");
  const thisMonthStr = today.slice(0,7);
  const monthRevenue = bookings.filter(b => b.date?.startsWith(thisMonthStr) && b.payment_status === "paid").reduce((s,b) => s+(b.total_charge||0), 0);
  const monthCafeRevenue = cafeSales.filter(s => s.sale_date?.startsWith(thisMonthStr)).reduce((s,c) => s+(c.gross_takings||0), 0);

  const centres = facilities.filter(f => f.type === "centre");
  const rooms = facilities.filter(f => f.type !== "centre");

  const filteredBookings = bookings.filter(b => {
    const matchFac = filterFacility === "all" || b.facility_id === filterFacility || b.facility_name?.includes(facilities.find(f=>f.id===filterFacility)?.name||"");
    const matchSearch = !bookingSearch || b.activity_name?.toLowerCase().includes(bookingSearch.toLowerCase()) || b.organiser_name?.toLowerCase().includes(bookingSearch.toLowerCase());
    return matchFac && matchSearch;
  });

  const upcomingBookings = filteredBookings.filter(b => b.date >= today && b.status !== "cancelled").sort((a,b) => a.date.localeCompare(b.date));
  const pastBookings = filteredBookings.filter(b => b.date < today || b.status === "cancelled").sort((a,b) => b.date.localeCompare(a.date));

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold">Facilities Management</h1>
          <p className="text-sm text-muted-foreground">Jubilee Centre & Dumers Lane Community Centre</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" onClick={() => setCafeDialog(true)}><Coffee className="w-4 h-4 mr-2" />Café Till</Button>
          <Button onClick={() => { setEditingFacility(null); setFacilityDialog(true); }}><Plus className="w-4 h-4 mr-2" />Add Facility</Button>
        </div>
      </div>

      {/* Alert banner */}
      {urgentMaint.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2 text-sm text-red-800">
          <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span><strong>{urgentMaint.length} urgent/high priority maintenance</strong> request(s) require attention: {urgentMaint.map(m=>m.title).join(", ")}</span>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label:"Today's Bookings", value: todayBookings.length, icon: Calendar, color:"text-blue-600" },
          { label:"Open Maintenance", value: openMaint.length, icon: Wrench, color: openMaint.length>0?"text-amber-600":"text-emerald-600" },
          { label:"Room Hire This Month", value: `£${monthRevenue.toFixed(0)}`, icon: Building2, color:"text-primary" },
          { label:"Café Takings (Month)", value: `£${monthCafeRevenue.toFixed(0)}`, icon: Coffee, color:"text-amber-600" },
        ].map(s => (
          <div key={s.label} className="bg-card rounded-xl p-4 border border-border/50 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <s.icon className={cn("w-4 h-4", s.color)} />
            </div>
            <p className={cn("text-2xl font-bold font-heading mt-1", s.color)}>{s.value}</p>
          </div>
        ))}
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="grid grid-cols-4 w-full max-w-xl">
          <TabsTrigger value="overview"><Building2 className="w-3.5 h-3.5 mr-1" />Centres</TabsTrigger>
          <TabsTrigger value="bookings"><Calendar className="w-3.5 h-3.5 mr-1" />Bookings</TabsTrigger>
          <TabsTrigger value="maintenance"><Wrench className="w-3.5 h-3.5 mr-1" />Maintenance</TabsTrigger>
          <TabsTrigger value="cafe"><Coffee className="w-3.5 h-3.5 mr-1" />Café</TabsTrigger>
        </TabsList>

        {/* CENTRES & ROOMS */}
        <TabsContent value="overview" className="space-y-6 mt-4">
          {loadingFac ? <div className="animate-pulse h-40 bg-muted rounded-xl" /> : centres.map(centre => (
            <div key={centre.id} className="bg-card rounded-xl border border-border/50 shadow-sm overflow-hidden">
              <div className="p-5 border-b flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-primary" />
                    <h2 className="font-heading font-bold text-lg">{centre.name}</h2>
                    <Badge variant="outline" className={cn("text-xs border", statusColors[centre.status])}>{centre.status.replace("_"," ")}</Badge>
                  </div>
                  <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    {centre.address_line_1 && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{centre.address_line_1}, {centre.town} {centre.postcode}</span>}
                    {centre.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{centre.phone}</span>}
                    {centre.opening_hours && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{centre.opening_hours}</span>}
                  </div>
                  {centre.description && <p className="text-sm text-muted-foreground mt-2 max-w-2xl">{centre.description}</p>}
                </div>
                <Button size="sm" variant="outline" onClick={()=>{ setEditingFacility(centre); setFacilityDialog(true); }}><Pencil className="w-3.5 h-3.5 mr-1" />Edit</Button>
              </div>
              <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {rooms.filter(r => r.parent_facility_id === centre.id).map(room => (
                  <div key={room.id} className="border rounded-lg p-3 hover:shadow-sm transition-shadow group">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-sm">{room.name}</p>
                        <p className="text-xs text-muted-foreground capitalize">{room.type.replace("_"," ")}</p>
                      </div>
                      <Button size="icon" variant="ghost" className="opacity-0 group-hover:opacity-100 h-7 w-7" onClick={()=>{ setEditingFacility(room); setFacilityDialog(true); }}><Pencil className="w-3 h-3" /></Button>
                    </div>
                    {room.capacity && <p className="text-xs mt-1 flex items-center gap-1 text-muted-foreground"><Users className="w-3 h-3" />Capacity: {room.capacity}</p>}
                    {room.hourly_rate && <p className="text-xs text-primary font-medium mt-1">£{room.hourly_rate}/hr · £{room.half_day_rate}/half · £{room.full_day_rate}/day</p>}
                    {room.amenities?.length > 0 && <div className="mt-2 flex flex-wrap gap-1">{room.amenities.slice(0,3).map(a=><span key={a} className="text-xs bg-accent text-accent-foreground px-1.5 py-0.5 rounded-full">{a}</span>)}{room.amenities.length>3 && <span className="text-xs text-muted-foreground">+{room.amenities.length-3}</span>}</div>}
                    <Button size="sm" variant="outline" className="mt-3 w-full h-7 text-xs" onClick={()=>{ setEditingBooking(null); setBookingDialog(true); }}>
                      <Calendar className="w-3 h-3 mr-1" />Book This Room
                    </Button>
                  </div>
                ))}
                <div className="border-2 border-dashed rounded-lg p-3 flex items-center justify-center cursor-pointer hover:border-primary hover:text-primary transition-colors text-muted-foreground text-sm" onClick={()=>{ setEditingFacility(null); setFacilityDialog(true); }}>
                  <Plus className="w-4 h-4 mr-1" />Add Room
                </div>
              </div>
            </div>
          ))}
        </TabsContent>

        {/* BOOKINGS */}
        <TabsContent value="bookings" className="space-y-4 mt-4">
          <div className="flex flex-col sm:flex-row gap-3 justify-between">
            <div className="flex gap-3 flex-1">
              <Input placeholder="Search bookings..." value={bookingSearch} onChange={e=>setBookingSearch(e.target.value)} className="max-w-sm" />
              <Select value={filterFacility} onValueChange={setFilterFacility}>
                <SelectTrigger className="w-52"><SelectValue placeholder="All facilities" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Facilities</SelectItem>
                  {facilities.filter(f=>f.type!=="centre"&&f.type!=="cafe").map(f=><SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={()=>{ setEditingBooking(null); setBookingDialog(true); }}><Plus className="w-4 h-4 mr-2" />New Booking</Button>
          </div>

          <div>
            <h3 className="font-heading font-semibold mb-3">Upcoming ({upcomingBookings.length})</h3>
            {upcomingBookings.length === 0 ? <p className="text-sm text-muted-foreground py-4">No upcoming bookings</p> : (
              <div className="space-y-2">
                {upcomingBookings.map(b => <BookingCard key={b.id} booking={b} onEdit={()=>{ setEditingBooking(b); setBookingDialog(true); }} />)}
              </div>
            )}
          </div>
          {pastBookings.length > 0 && (
            <div>
              <h3 className="font-heading font-semibold mb-3 text-muted-foreground">Past / Cancelled ({pastBookings.length})</h3>
              <div className="space-y-2">{pastBookings.slice(0,10).map(b=><BookingCard key={b.id} booking={b} onEdit={()=>{ setEditingBooking(b); setBookingDialog(true); }} />)}</div>
            </div>
          )}
        </TabsContent>

        {/* MAINTENANCE */}
        <TabsContent value="maintenance" className="space-y-4 mt-4">
          <div className="flex justify-between">
            <div className="flex gap-4 text-sm">
              <span className="text-muted-foreground">Open: <strong>{openMaint.length}</strong></span>
              <span className="text-destructive">Urgent/High: <strong>{urgentMaint.length}</strong></span>
            </div>
            <Button onClick={()=>{ setEditingMaint(null); setMaintenanceDialog(true); }}><Plus className="w-4 h-4 mr-2" />Report Issue</Button>
          </div>
          <div className="space-y-2">
            {maintenance.length === 0 ? <p className="text-sm text-muted-foreground py-6 text-center">No maintenance requests</p> : (
              maintenance.map(m => (
                <div key={m.id} className="bg-card border rounded-xl p-4 hover:shadow-sm cursor-pointer" onClick={()=>{ setEditingMaint(m); setMaintenanceDialog(true); }}>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={cn("text-xs font-semibold uppercase tracking-wide", priorityColors[m.priority])}>{m.priority}</span>
                        <span className="text-sm font-medium">{m.title}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{m.facility_name} · {m.category?.replace(/_/g," ")}</p>
                      {m.description && <p className="text-xs mt-1 text-muted-foreground">{m.description?.slice(0,80)}{m.description?.length>80?"...":""}</p>}
                    </div>
                    <div className="text-right flex flex-col items-end gap-1">
                      <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", statusColors[m.status])}>{m.status?.replace("_"," ")}</span>
                      {m.scheduled_date && <span className="text-xs text-muted-foreground">{m.scheduled_date}</span>}
                      {m.actual_cost && <span className="text-xs font-medium">£{m.actual_cost}</span>}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </TabsContent>

        {/* CAFÉ */}
        <TabsContent value="cafe" className="space-y-4 mt-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-heading font-semibold">Jubilee Café</h3>
              <p className="text-xs text-muted-foreground">Mon–Fri 09:30–16:00 · Mosley Avenue, Bury BL9 6NJ</p>
            </div>
            <Button onClick={()=>setCafeDialog(true)}><Plus className="w-4 h-4 mr-2" />Record Today's Sales</Button>
          </div>

          {/* Café summary */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-card rounded-xl p-4 border border-border/50">
              <p className="text-xs text-muted-foreground">This Month Takings</p>
              <p className="text-2xl font-bold font-heading text-amber-600">£{monthCafeRevenue.toFixed(2)}</p>
            </div>
            <div className="bg-card rounded-xl p-4 border border-border/50">
              <p className="text-xs text-muted-foreground">Days Recorded</p>
              <p className="text-2xl font-bold font-heading">{cafeSales.filter(s=>s.sale_date?.startsWith(thisMonthStr)).length}</p>
            </div>
            <div className="bg-card rounded-xl p-4 border border-border/50">
              <p className="text-xs text-muted-foreground">Avg Daily Takings</p>
              <p className="text-2xl font-bold font-heading">
                {(() => { const ms=cafeSales.filter(s=>s.sale_date?.startsWith(thisMonthStr)); return ms.length>0?`£${(ms.reduce((s,c)=>s+(c.gross_takings||0),0)/ms.length).toFixed(2)}`:"—"; })()}
              </p>
            </div>
          </div>

          {/* Daily sales log */}
          <div className="rounded-lg border overflow-hidden">
            <table className="w-full text-sm">
              <thead><tr className="bg-muted/40 text-xs text-muted-foreground border-b"><th className="text-left p-3">Date</th><th className="text-left p-3">Session</th><th className="text-left p-3">Staff</th><th className="text-right p-3">Cash</th><th className="text-right p-3">Card</th><th className="text-right p-3">Covers</th><th className="text-right p-3">Total</th></tr></thead>
              <tbody>
                {cafeSales.length === 0 ? <tr><td colSpan={7} className="p-4 text-center text-muted-foreground text-xs">No sales recorded yet. Click "Record Today's Sales" to start.</td></tr>
                : cafeSales.map(s=>(
                  <tr key={s.id} className="border-t hover:bg-muted/20">
                    <td className="p-3 text-xs">{s.sale_date}</td>
                    <td className="p-3 text-xs capitalize">{s.till_session?.replace("_"," ")}</td>
                    <td className="p-3 text-xs text-muted-foreground">{s.staff_on_duty}</td>
                    <td className="p-3 text-right text-xs">£{(s.cash_takings||0).toFixed(2)}</td>
                    <td className="p-3 text-right text-xs">£{(s.card_takings||0).toFixed(2)}</td>
                    <td className="p-3 text-right text-xs">{s.covers||"—"}</td>
                    <td className="p-3 text-right text-xs font-semibold text-amber-600">£{(s.gross_takings||0).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <FacilityFormDialog open={facilityDialog} onOpenChange={setFacilityDialog} facility={editingFacility}
        onSave={async f => { await saveFacility.mutateAsync(f); setEditingFacility(null); }} />
      <BookingFormDialog open={bookingDialog} onOpenChange={setBookingDialog} booking={editingBooking} facilities={facilities}
        onSave={async b => { await saveBooking.mutateAsync(b); setEditingBooking(null); }} />
      <MaintenanceFormDialog open={maintenanceDialog} onOpenChange={setMaintenanceDialog} request={editingMaint} facilities={facilities}
        onSave={async m => { await saveMaint.mutateAsync(m); setEditingMaint(null); }} />
      <CafeTillDialog open={cafeDialog} onOpenChange={setCafeDialog} onSave={async s => { await saveCafe.mutateAsync(s); }} />
    </div>
  );
}

function BookingCard({ booking, onEdit }) {
  const statusColors = { enquiry:"bg-gray-100 text-gray-600", provisional:"bg-amber-50 text-amber-700", confirmed:"bg-emerald-50 text-emerald-700", cancelled:"bg-red-50 text-red-600", completed:"bg-blue-50 text-blue-700" };
  const payColors = { not_invoiced:"text-amber-600", invoiced:"text-blue-600", paid:"text-emerald-600", waived:"text-gray-500" };
  return (
    <div className="bg-card border rounded-xl p-4 hover:shadow-sm cursor-pointer group" onClick={onEdit}>
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-sm">{booking.activity_name}</span>
            {booking.recurring && <span className="text-xs bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-full">Recurring</span>}
            <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", statusColors[booking.status])}>{booking.status}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">{booking.facility_name} · {booking.organiser_name}{booking.organiser_organisation ? ` (${booking.organiser_organisation})` : ""}</p>
          <p className="text-xs text-muted-foreground">{booking.date} {booking.start_time && `${booking.start_time}–${booking.end_time}`} · {booking.expected_attendees && `${booking.expected_attendees} attendees`}</p>
        </div>
        <div className="text-right">
          {booking.total_charge > 0 && <p className="font-semibold text-sm">£{booking.total_charge?.toFixed(2)}</p>}
          {booking.total_charge > 0 && <p className={cn("text-xs", payColors[booking.payment_status])}>{booking.payment_status?.replace("_"," ")}</p>}
          {booking.booking_ref && <p className="text-xs text-muted-foreground">{booking.booking_ref}</p>}
        </div>
      </div>
    </div>
  );
}