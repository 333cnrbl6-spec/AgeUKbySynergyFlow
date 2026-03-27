import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { PoundSterling, Search, Check, CreditCard, Banknote, FileText } from "lucide-react";
import { format } from "date-fns";

export default function Invoices() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const queryClient = useQueryClient();

  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ["jobs"],
    queryFn: () => base44.entities.Job.list("-created_date", 500),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Job.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["jobs"] }),
  });

  const invoiceJobs = jobs.filter(j => 
    ["completed", "paid"].includes(j.status) || j.total_cost > 0
  );

  const filtered = invoiceJobs.filter(j => {
    const matchSearch = `${j.title} ${j.client_name}`.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all" || j.payment_status === filter;
    return matchSearch && matchFilter;
  });

  const totalOutstanding = invoiceJobs.filter(j => j.payment_status === "unpaid").reduce((s, j) => s + (j.total_cost || 0), 0);
  const totalCollected = invoiceJobs.filter(j => j.payment_status === "paid").reduce((s, j) => s + (j.total_cost || 0), 0);

  const markAsPaid = async (job, method) => {
    await updateMutation.mutateAsync({
      id: job.id,
      data: { payment_status: "paid", payment_method: method, status: "paid" }
    });
  };

  const paymentIcons = { card: CreditCard, cash: Banknote, cheque: FileText };

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-2xl font-heading font-bold">Invoices & Payments</h1>
        <p className="text-sm text-muted-foreground">Track payments for completed jobs</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card rounded-xl p-5 border border-border/50 shadow-sm">
          <p className="text-sm text-muted-foreground">Total Collected</p>
          <p className="text-2xl font-heading font-bold text-emerald-600 mt-1">£{totalCollected.toFixed(2)}</p>
        </div>
        <div className="bg-card rounded-xl p-5 border border-border/50 shadow-sm">
          <p className="text-sm text-muted-foreground">Outstanding</p>
          <p className="text-2xl font-heading font-bold text-amber-600 mt-1">£{totalOutstanding.toFixed(2)}</p>
        </div>
        <div className="bg-card rounded-xl p-5 border border-border/50 shadow-sm">
          <p className="text-sm text-muted-foreground">Total Jobs</p>
          <p className="text-2xl font-heading font-bold mt-1">{invoiceJobs.length}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="unpaid">Unpaid</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="waived">Waived</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Invoice list */}
      <div className="space-y-2">
        {isLoading ? (
          Array(4).fill(0).map((_, i) => <div key={i} className="bg-card rounded-xl h-20 animate-pulse border border-border/50" />)
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">No invoices to display</div>
        ) : (
          filtered.map(job => (
            <div key={job.id} className="bg-card rounded-xl p-4 border border-border/50 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-sm">{job.title}</h3>
                  <Badge variant="outline" className={job.payment_status === "paid" ? "bg-green-50 text-green-700 border-green-200" : job.payment_status === "waived" ? "bg-gray-50 text-gray-600 border-gray-200" : "bg-amber-50 text-amber-700 border-amber-200"}>
                    {job.payment_status}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {job.client_name} • {job.created_date ? format(new Date(job.created_date), "dd MMM yyyy") : ""}
                  {job.actual_hours ? ` • ${job.actual_hours}h` : ""}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="font-heading font-bold">£{(job.total_cost || 0).toFixed(2)}</p>
                  {job.materials_cost > 0 && <p className="text-xs text-muted-foreground">incl. £{job.materials_cost.toFixed(2)} materials</p>}
                </div>
                {job.payment_status === "unpaid" && (
                  <div className="flex gap-1">
                    {["card", "cash", "cheque"].map(method => {
                      const Icon = paymentIcons[method];
                      return (
                        <Button key={method} variant="outline" size="sm" onClick={() => markAsPaid(job, method)} title={`Mark paid by ${method}`}>
                          <Icon className="w-3.5 h-3.5 mr-1" /> {method}
                        </Button>
                      );
                    })}
                  </div>
                )}
                {job.payment_status === "paid" && job.payment_method && job.payment_method !== "unpaid" && (
                  <Badge variant="secondary" className="text-xs">
                    via {job.payment_method}
                  </Badge>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}