import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Clock, User } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek } from "date-fns";
import { cn } from "@/lib/utils";

const statusColors = {
  enquiry: "bg-blue-500",
  assessment_booked: "bg-amber-500",
  quoted: "bg-purple-500",
  scheduled: "bg-indigo-500",
  in_progress: "bg-orange-500",
  completed: "bg-emerald-500",
  paid: "bg-green-500",
};

export default function JobCalendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  const { data: jobs = [] } = useQuery({
    queryKey: ["jobs"],
    queryFn: () => base44.entities.Job.list("-scheduled_date", 500),
  });

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: calStart, end: calEnd });

  const getJobsForDate = (date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    return jobs.filter(j => j.scheduled_date === dateStr);
  };

  const selectedJobs = getJobsForDate(selectedDate);

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-2xl font-heading font-bold">Calendar</h1>
        <p className="text-sm text-muted-foreground">Job schedule overview</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Grid */}
        <div className="lg:col-span-2 bg-card rounded-xl p-5 shadow-sm border border-border/50">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-heading font-semibold text-lg">{format(currentMonth, "MMMM yyyy")}</h2>
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => { setCurrentMonth(new Date()); setSelectedDate(new Date()); }}>
                Today
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Days header */}
          <div className="grid grid-cols-7 mb-2">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(day => (
              <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">{day}</div>
            ))}
          </div>

          {/* Days grid */}
          <div className="grid grid-cols-7 gap-1">
            {days.map((day) => {
              const dayJobs = getJobsForDate(day);
              const isToday = isSameDay(day, new Date());
              const isSelected = isSameDay(day, selectedDate);
              const isCurrentMonth = isSameMonth(day, currentMonth);

              return (
                <button
                  key={day.toISOString()}
                  onClick={() => setSelectedDate(day)}
                  className={cn(
                    "p-2 rounded-lg text-sm min-h-[72px] flex flex-col items-start transition-colors",
                    !isCurrentMonth && "opacity-40",
                    isSelected ? "bg-primary text-primary-foreground" : "hover:bg-muted",
                    isToday && !isSelected && "ring-2 ring-primary/30"
                  )}
                >
                  <span className={cn("text-xs font-medium", isToday && !isSelected && "text-primary font-bold")}>
                    {format(day, "d")}
                  </span>
                  <div className="flex flex-wrap gap-0.5 mt-1">
                    {dayJobs.slice(0, 3).map(j => (
                      <div key={j.id} className={cn("w-1.5 h-1.5 rounded-full", isSelected ? "bg-white/70" : statusColors[j.status] || "bg-gray-400")} />
                    ))}
                    {dayJobs.length > 3 && (
                      <span className={cn("text-[10px]", isSelected ? "text-white/70" : "text-muted-foreground")}>+{dayJobs.length - 3}</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected day details */}
        <div className="bg-card rounded-xl p-5 shadow-sm border border-border/50">
          <h3 className="font-heading font-semibold mb-4">
            {format(selectedDate, "EEEE, d MMMM")}
          </h3>
          {selectedJobs.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">No jobs scheduled for this day</p>
          ) : (
            <div className="space-y-3">
              {selectedJobs.map(job => (
                <div key={job.id} className="p-3 rounded-lg bg-muted/50 border border-border/50">
                  <p className="font-medium text-sm">{job.title}</p>
                  <div className="flex items-center gap-2 mt-1.5 text-xs text-muted-foreground">
                    <User className="w-3 h-3" /> {job.client_name}
                  </div>
                  {job.scheduled_time && (
                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" /> {job.scheduled_time}
                    </div>
                  )}
                  <Badge variant="outline" className="mt-2 text-xs">
                    {(job.status || "").replace(/_/g, " ")}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}