import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, MapPin, Phone, MessageSquare, ArrowRight } from "lucide-react";
import ClientOnboardingDialog from "../components/clients/ClientOnboardingDialog";

const SOURCE_COLORS = {
  manual_entry: "bg-blue-100 text-blue-800",
  gp_list: "bg-purple-100 text-purple-800",
  council_data: "bg-green-100 text-green-800",
  event: "bg-orange-100 text-orange-800",
  referral_partner: "bg-pink-100 text-pink-800",
  other: "bg-gray-100 text-gray-800",
};

const STATUS_COLORS = {
  not_contacted: "bg-slate-100 text-slate-800",
  contacted: "bg-blue-100 text-blue-800",
  interested: "bg-green-100 text-green-800",
  not_interested: "bg-red-100 text-red-800",
  converted_to_client: "bg-purple-100 text-purple-800",
};

export default function Prospects() {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterSource, setFilterSource] = useState("");
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const [selectedProspect, setSelectedProspect] = useState(null);
  const queryClient = useQueryClient();

  const { data: prospects = [] } = useQuery({
    queryKey: ["prospects"],
    queryFn: () => base44.entities.Prospect.list("-created_date", 500),
  });

  const createClientMutation = useMutation({
    mutationFn: (clientData) => base44.entities.Client.create(clientData),
    onSuccess: (newClient) => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      if (selectedProspect) {
        base44.entities.Prospect.update(selectedProspect.id, {
          contact_status: "converted_to_client",
          converted_client_id: newClient.id,
        });
        queryClient.invalidateQueries({ queryKey: ["prospects"] });
      }
    },
  });

  const handleConvertToClient = async (formData) => {
    await createClientMutation.mutateAsync(formData);
    setOnboardingOpen(false);
    setSelectedProspect(null);
  };

  const filtered = useMemo(() => {
    return prospects.filter(p => {
      const matchSearch = `${p.first_name} ${p.last_name} ${p.phone} ${p.town}`.toLowerCase().includes(search.toLowerCase());
      const matchStatus = !filterStatus || p.contact_status === filterStatus;
      const matchSource = !filterSource || p.source === filterSource;
      return matchSearch && matchStatus && matchSource;
    });
  }, [prospects, search, filterStatus, filterSource]);

  const activeProspects = prospects.filter(p => p.contact_status !== "converted_to_client" && p.contact_status !== "not_interested");
  const converted = prospects.filter(p => p.contact_status === "converted_to_client");

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold">Prospects</h1>
          <p className="text-sm text-muted-foreground">
            {activeProspects.length} active prospects • {converted.length} converted to clients
          </p>
        </div>
        <Button onClick={() => { setSelectedProspect(null); setOnboardingOpen(true); }}>
          <Plus className="w-4 h-4 mr-2" /> New Prospect
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="bg-card p-4 rounded-lg border border-border">
          <p className="text-xs text-muted-foreground">Total Prospects</p>
          <p className="text-2xl font-bold">{prospects.length}</p>
        </div>
        <div className="bg-card p-4 rounded-lg border border-border">
          <p className="text-xs text-muted-foreground">Not Contacted</p>
          <p className="text-2xl font-bold">{prospects.filter(p => p.contact_status === "not_contacted").length}</p>
        </div>
        <div className="bg-card p-4 rounded-lg border border-border">
          <p className="text-xs text-muted-foreground">Interested</p>
          <p className="text-2xl font-bold">{prospects.filter(p => p.contact_status === "interested").length}</p>
        </div>
        <div className="bg-card p-4 rounded-lg border border-border">
          <p className="text-xs text-muted-foreground">Converted</p>
          <p className="text-2xl font-bold text-green-600">{converted.length}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="flex-1 min-w-64">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search prospects..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={null}>All Status</SelectItem>
            <SelectItem value="not_contacted">Not Contacted</SelectItem>
            <SelectItem value="contacted">Contacted</SelectItem>
            <SelectItem value="interested">Interested</SelectItem>
            <SelectItem value="not_interested">Not Interested</SelectItem>
            <SelectItem value="converted_to_client">Converted</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterSource} onValueChange={setFilterSource}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All Sources" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={null}>All Sources</SelectItem>
            <SelectItem value="manual_entry">Manual Entry</SelectItem>
            <SelectItem value="gp_list">GP List</SelectItem>
            <SelectItem value="council_data">Council Data</SelectItem>
            <SelectItem value="event">Event</SelectItem>
            <SelectItem value="referral_partner">Referral Partner</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-card rounded-lg p-8 text-center text-muted-foreground">
            {search || filterStatus || filterSource ? "No prospects match your filters" : "No prospects yet"}
          </div>
        ) : (
          filtered.map(prospect => (
            <div key={prospect.id} className="bg-card rounded-lg p-4 border border-border hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold">{prospect.first_name} {prospect.last_name}</h3>
                    <Badge className={SOURCE_COLORS[prospect.source] || SOURCE_COLORS.other} variant="secondary" className="text-xs">
                      {prospect.source?.replace("_", " ")}
                    </Badge>
                    <Badge className={STATUS_COLORS[prospect.contact_status] || "bg-gray-100"} variant="secondary" className="text-xs">
                      {prospect.contact_status?.replace("_", " ")}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" /> {prospect.town}
                    </span>
                    {prospect.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5" /> {prospect.phone}
                      </span>
                    )}
                    {prospect.likely_needs?.length > 0 && (
                      <span className="flex items-center gap-1">
                        <MessageSquare className="w-3.5 h-3.5" /> {prospect.likely_needs.join(", ")}
                      </span>
                    )}
                  </div>
                  {prospect.notes && (
                    <p className="text-xs text-muted-foreground mt-2 italic">{prospect.notes}</p>
                  )}
                </div>
                {prospect.contact_status !== "converted_to_client" && (
                  <Button
                    size="sm"
                    onClick={() => { setSelectedProspect(prospect); setOnboardingOpen(true); }}
                    className="gap-2"
                  >
                    <ArrowRight className="w-4 h-4" /> Convert
                  </Button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <ClientOnboardingDialog
        open={onboardingOpen}
        onOpenChange={setOnboardingOpen}
        prospect={selectedProspect}
        onComplete={handleConvertToClient}
      />
    </div>
  );
}