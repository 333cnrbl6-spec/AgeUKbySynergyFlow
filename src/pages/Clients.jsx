import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Phone, Mail, MapPin, Pencil, ChevronRight } from "lucide-react";
import ClientFormDialog from "../components/clients/ClientFormDialog";
import ClientOnboardingDialog from "../components/clients/ClientOnboardingDialog";

export default function Clients() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const queryClient = useQueryClient();

  const { data: clients = [], isLoading } = useQuery({
    queryKey: ["clients"],
    queryFn: () => base44.entities.Client.list("-created_date", 200),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Client.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["clients"] }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Client.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["clients"] }),
  });

  const handleSave = async (form) => {
    if (editingClient) {
      await updateMutation.mutateAsync({ id: editingClient.id, data: form });
    } else {
      await createMutation.mutateAsync(form);
    }
    setEditingClient(null);
  };

  const filtered = clients.filter(c => {
    const term = search.toLowerCase();
    return `${c.first_name} ${c.last_name} ${c.phone} ${c.postcode}`.toLowerCase().includes(term);
  });

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold">Clients</h1>
          <p className="text-sm text-muted-foreground">{clients.length} registered clients</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => { setEditingClient(null); setOnboardingOpen(true); }}>
            <Plus className="w-4 h-4 mr-2" /> Guided Onboarding
          </Button>
          <Button onClick={() => { setEditingClient(null); setDialogOpen(true); }}>
            <Plus className="w-4 h-4 mr-2" /> Quick Add
          </Button>
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input 
          placeholder="Search clients..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array(6).fill(0).map((_, i) => (
            <div key={i} className="bg-card rounded-xl p-5 border border-border/50 animate-pulse h-40" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
           {filtered.map(client => (
            <div key={client.id} className="bg-card rounded-xl p-5 border border-border/50 shadow-sm hover:shadow-md transition-shadow group cursor-pointer" onClick={() => navigate(`/clients/${client.id}`)}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-heading font-semibold">{client.first_name} {client.last_name}</h3>
                  <Badge variant="outline" className="text-xs mt-1">
                    {client.status === "active" ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
              </div>
              <div className="mt-3 space-y-1.5 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5" /> {client.phone}
                </div>
                {client.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5" /> <span className="truncate">{client.email}</span>
                  </div>
                )}
                {(client.town || client.postcode) && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5" /> {[client.town, client.postcode].filter(Boolean).join(", ")}
                  </div>
                )}
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              {search ? "No clients match your search" : "No clients yet. Add your first client to get started."}
            </div>
          )}
        </div>
      )}

      <ClientFormDialog 
        open={dialogOpen} 
        onOpenChange={setDialogOpen} 
        client={editingClient}
        onSave={handleSave}
      />

      <ClientOnboardingDialog
        open={onboardingOpen}
        onOpenChange={setOnboardingOpen}
        prospect={null}
        onComplete={handleSave}
      />
    </div>
  );
}