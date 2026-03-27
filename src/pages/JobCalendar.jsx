import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Clock, User, Building2, Wrench, Phone, Calendar } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek, parseISO } from "date-fns";
import { cn } from "@/lib/utils";

const EVENT_TYPES = {
  job:      { colour: "bg-indigo-500",  label: "Job",     icon: Wrench },
  booking:  { colour: "bg-teal-500",    label: "Booking", icon: Building2 },
  work:     { colour: "bg-orange-500",  label: "Work Schedule", icon: Clock },
  referral: { colour: "bg-pink-500",    label: "Referral", icon: Phone },
};

const JOB_STATUS_COLOUR = {
  enquiry: "bg-blue-400", assessment_booked: "bg-amber-400", quoted: "bg-purple-400",
  scheduled: "bg-indigo-500", in_progress: "bg-orange-500", completed: "bg-emerald-500", paid: "bg-green-500",
};

function buildEvents(jobs, bookings, workSchedules, referrals) {
  const events = [];

  jobs.forEach(j => {
    if (j.scheduled_date) events.push({
      id: `job-${j.id}`, date: j.scheduled_date, type: "job",
      title: j.title, subtitle: j.client_name, time: j.scheduled_time,
      colour: JOB_STATUS_COLOUR[j.status] || "bg-indigo-400",
      status: j.status,
    });
  });

  bookings.forEach(b => {
    if (b.date && b.status !== "cancelled") events.push({
      id: `booking-${b.id}`, date: b.date, type: "booking",
      title: b.activity_name, subtitle: b.facility_name, time: b.start_time,
      colour: "bg-teal-500",
      status: b.status,
    });
  });

  workSchedules.forEach(w => {
    if (w.scheduled_date) events.push({
      id: `work-${w.id}`, date: w.scheduled_date, type: "work",
      title: w.job_title || "Work Schedule", subtitle: w.supplier_name, time: w.scheduled_time,
      colour: "bg-orange-500",
      status: w.status,
    });
  });

  referrals.forEach(r => {
    if (r.received_date && r.status === "assessment_booked") events.push({
      id: `ref-${r.id}`, date: r.received_date, type: "referral",
      title: `${r.client_first_name} ${r.client_last_name}`, subtitle: "Assessment", time: null,
      colour: "bg-pink-500",
      status: r.status,
    });
  });

  return events;
}

export default function JobCalendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [filter, setFilter] = useState("all");

  const { data: jobs = [] }          = useQuery({ queryKey: ["jobs"],          queryFn: () => base44.entities.Job.list("-scheduled_date", 500) });
  const { data: bookings = [] }      = useQuery({ queryKey: ["bookings"],      queryFn: () => base44.entities.RoomBooking.list("-date", 500) });
  const { data: workSchedules = [] } = useQuery({ queryKey: ["workSchedules"], queryFn: () => base44.entities.WorkSchedule.list("-scheduled_date", 500) });
  const { data: referrals = [] }     = useQuery({ queryKey: ["referrals"],     queryFn: () => base44.entities.Referral.list("-received_date", 200) });

  const allEvents = buildEvents(jobs, bookings, workSchedules, referrals);
  const filteredEvents = filter === "all" ? allEvents : allEvents.filter(e => e.type === filter);

  const monthStart  = startOfMonth(currentMonth);
  const monthEnd    = endOfMonth(currentMonth);
  const calStart    = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calEnd      = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days        = eachDayOfInterval({ start: calStart, end: calEnd });

  const getEventsForDate = (date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    return filteredEvents.filter(e => e.date === dateStr);
  };

  const selectedEvents = getEventsForDate(selectedDate);

  const typeCounts = { job: allEvents.filter(e=>e.type==="job").length, booking: allEvents.filter(e=>e.type==="booking").length, work: allEvents.filter(e=>e.type==="work").length, referral: allEvents.filter(e=>e.type==="referral").length };

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-heading font-bold">Calendar</h1>
          <p className="text-sm text-muted-foreground">All jobs, bookings, work schedules & assessments</p>
        </div>
        {/* Filter pills */}
        <div className="flex flex-wrap gap-2">
          {[["all","All Events","bg-primary text-white"], ...Object.entries(EVENT_TYPES).map(([k,v])=>[k,v.label,v.colour+" text-white"])].map(([val,label,cls])=>(
            <button key={val} onClick={()=>setFilter(val)}
              className={cn("px-3 py-1 rounded-full text-xs font-medium transition-all border", filter===val ? cls : "bg-muted text-muted-foreground border-border hover:bg-muted/80")}
            >{label}{val !== "all" && typeCounts[val] !== undefined ? ` (${typeCounts[val]})` : ""}</button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Grid */}
        <div className="lg:col-span-2 bg-card rounded-xl p-5 shadow-sm border border-border/50">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-heading font-semibold text-lg">{format(currentMonth, "MMMM yyyy")}</h2>
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}><ChevronLeft className="w-4 h-4" /></Button>
              <Button variant="ghost" size="sm" onClick={() => { setCurrentMonth(new Date()); setSelectedDate(new Date()); }}>Today</Button>
              <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}><ChevronRight className="w-4 h-4" /></Button>
            </div>
          </div>

          <div className="grid grid-cols-7 mb-2">
            {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map(d => (
              <div key={d} className="text-center text-xs font-medium text-muted-foreground py-2">{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {days.map((day) => {
              const dayEvents = getEventsForDate(day);
              const isToday    = isSameDay(day, new Date());
              const isSelected = isSameDay(day, selectedDate);
              const isCurrentMonth = isSameMonth(day, currentMonth);
              return (
                <button key={day.toISOString()} onClick={() => setSelectedDate(day)}
                  className={cn(
                    "p-1.5 rounded-lg text-sm min-h-[72px] flex flex-col items-start transition-colors",
                    !isCurrentMonth && "opacity-30",
                    isSelected ? "bg-primary text-primary-foreground" : "hover:bg-muted",
                    isToday && !isSelected && "ring-2 ring-primary/30"
                  )}
                >
                  <span className={cn("text-xs font-medium w-full text-left", isToday && !isSelected && "text-primary font-bold")}>
                    {format(day, "d")}
                  </span>
                  <div className="flex flex-wrap gap-0.5 mt-1">
                    {dayEvents.slice(0, 4).map(e => (
                      <div key={e.id} className={cn("w-1.5 h-1.5 rounded-full", isSelected ? "bg-white/70" : e.colour)} />
                    ))}
                    {dayEvents.length > 4 && (
                      <span className={cn("text-[10px]", isSelected ? "text-white/70" : "text-muted-foreground")}>+{dayEvents.length - 4}</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-border/50">
            {Object.entries(EVENT_TYPES).map(([k, v]) => (
              <div key={k} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <div className={cn("w-2.5 h-2.5 rounded-full", v.colour)} />
                {v.label}
              </div>
            ))}
          </div>
        </div>

        {/* Selected day details */}
        <div className="bg-card rounded-xl p-5 shadow-sm border border-border/50 overflow-y-auto max-h-[600px]">
          <h3 className="font-heading font-semibold mb-4">{format(selectedDate, "EEEE, d MMMM")}</h3>
          {selectedEvents.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">Nothing scheduled for this day.</p>
          ) : (
            <div className="space-y-3">
              {selectedEvents.map(ev => {
                const cfg = EVENT_TYPES[ev.type];
                const Icon = cfg?.icon || Calendar;
                return (
                  <div key={ev.id} className="p-3 rounded-lg bg-muted/50 border border-border/50">
                    <div className="flex items-center gap-2 mb-1">
                      <div className={cn("w-2 h-2 rounded-full flex-shrink-0", ev.colour)} />
                      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{cfg?.label}</span>
                    </div>
                    <p className="font-medium text-sm">{ev.title}</p>
                    {ev.subtitle && <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground"><Icon className="w-3 h-3" />{ev.subtitle}</div>}
                    {ev.time && <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground"><Clock className="w-3 h-3" />{ev.time}</div>}
                    <Badge variant="outline" className="mt-2 text-xs capitalize">{(ev.status||"").replace(/_/g," ")}</Badge>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}