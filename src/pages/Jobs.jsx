import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Clock, MapPin, User, PoundSterling, Pencil } from "lucide-react";
import { format } from "date-fns";
import JobFormDialog from "../components/jobs/JobFormDialog";

const statusStyles = {
  enquiry: "bg-blue-50 text-blue-700 border-blue-200",
  assessment_booked: "bg-amber-50 text-amber-700 border-amber-200",
  quoted: "bg-purple-50 text-purple-700 border-purple-200",
  scheduled: "bg-indigo-50 text-indigo-700 border-indigo-200",
  in_progress: "bg-orange-50 text-orange-700 border-orange-200",
  completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  paid: "bg-green-50 text-green-700 border-green-200",
  cancelled: "bg-red-50 text-red-700 border-red-200",
  referred_out: "bg-gray-50 text-gray-600 border-gray-200",
};

const priorityStyles = {
  low: "bg-slate-100 text-slate-600",
  medium: "bg-blue-100 text-blue-700",
  high: "bg-orange-100 text-orange-700",
  urgent: "bg-red-100 text-red-700",
};

export default function Jobs() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const queryClient = useQueryClient();

  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ["jobs"],
    queryFn: () => base44.entities.Job.list("-created_date", 200),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Job.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["jobs"] }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Job.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["jobs"] }),
  });

  const handleSave = async (form) => {
    if (editingJob) {
      await updateMutation.mutateAsync({ id: editingJob.id, data: form });
    } else {
      await createMutation.mutateAsync(form);
    }
    setEditingJob(null);
  };

  const filtered = jobs.filter(j => {
    const matchSearch = `${j.title} ${j.client_name} ${j.address}`.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || j.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold">Jobs</h1>
          <p className="text-sm text-muted-foreground">{jobs.length} total jobs</p>
        </div>
        <Button onClick={() => { setEditingJob(null); setDialogOpen(true); }}>
          <Plus className="w-4 h-4 mr-2" /> New Job
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search jobs..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="enquiry">Enquiry</SelectItem>
            <SelectItem value="assessment_booked">Assessment Booked</SelectItem>
            <SelectItem value="quoted">Quoted</SelectItem>
            <SelectItem value="scheduled">Scheduled</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
            <SelectItem value="referred_out">Referred Out</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array(5).fill(0).map((_, i) => (
            <div key={i} className="bg-card rounded-xl p-5 border border-border/50 animate-pulse h-24" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(job => (
            <div key={job.id} className="bg-card rounded-xl p-5 border border-border/50 shadow-sm hover:shadow-md transition-shadow group">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-heading font-semibold">{job.title}</h3>
                    <Badge variant="outline" className={`text-xs border ${statusStyles[job.status] || ""}`}>
                      {(job.status || "").replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
                    </Badge>
                    <Badge className={`text-xs ${priorityStyles[job.priority] || ""}`}>
                      {job.priority}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5" /> {job.client_name}
                    </span>
                    {job.scheduled_date && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> {format(new Date(job.scheduled_date), "dd MMM yyyy")}
                        {job.scheduled_time && ` at ${job.scheduled_time}`}
                      </span>
                    )}
                    {job.address && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" /> <span className="truncate max-w-[200px]">{job.address}</span>
                      </span>
                    )}
                    {job.total_cost > 0 && (
                      <span className="flex items-center gap-1">
                        <PoundSterling className="w-3.5 h-3.5" /> £{job.total_cost.toFixed(2)}
                        {job.payment_status === "paid" && <Badge className="bg-green-100 text-green-700 text-xs ml-1">Paid</Badge>}
                      </span>
                    )}
                  </div>
                </div>
                <Button 
                  variant="ghost" size="icon"
                  className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                  onClick={() => { setEditingJob(job); setDialogOpen(true); }}
                >
                  <Pencil className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              {search || statusFilter !== "all" ? "No jobs match your filters" : "No jobs yet. Create your first job to get started."}
            </div>
          )}
        </div>
      )}

      <JobFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        job={editingJob}
        onSave={handleSave}
      />
    </div>
  );
}