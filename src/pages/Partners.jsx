import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Building2, Calendar, FileText, Phone, Mail, Globe, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import PartnerFormDialog from "../components/partners/PartnerFormDialog";
import InteractionFormDialog from "../components/partners/InteractionFormDialog";
import { differenceInDays, parseISO } from "date-fns";

const typeColors = {
  bury_council: "bg-purple-50 text-purple-700",
  nhs_icb: "bg-blue-50 text-blue-700",
  gp_federation: "bg-sky-50 text-sky-700",
  hospital: "bg-cyan-50 text-cyan-700",
  age_uk_national: "bg-primary/10 text-primary",
  age_uk_gm: "bg-primary/10 text-primary",
  voluntary_sector: "bg-emerald-50 text-emerald-700",
  housing: "bg-orange-50 text-orange-700",
  corporate_sponsor: "bg-amber-50 text-amber-700",
  other: "bg-gray-100 text-gray-600",
};

const typeLabels = {
  bury_council: "Bury Council", nhs_icb: "NHS ICB", gp_federation: "GP Federation",
  hospital: "Hospital", age_uk_national: "Age UK National", age_uk_gm: "Age UK GM",
  housing: "Housing", police_fire: "Police/Fire", voluntary_sector: "Voluntary Sector",
  corporate_sponsor: "Corporate Sponsor", faith_group: "Faith Group", other: "Other"
};

export default function Partners() {
  const [partnerDialog, setPartnerDialog] = useState(false);
  const [editingPartner, setEditingPartner] = useState(null);
  const [interactionDialog, setInteractionDialog] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState(null);
  const [search, setSearch] = useState("");
  const qc = useQueryClient();

  const { data: partners = [], isLoading } = useQuery({ queryKey: ["partners"], queryFn: () => base44.entities.Partner.list("organisation_name", 100) });
  const { data: interactions = [] } = useQuery({ queryKey: ["interactions"], queryFn: () => base44.entities.PartnerInteraction.list("-date", 200) });

  const savePartner = useMutation({ mutationFn: p => p.id ? base44.entities.Partner.update(p.id, p) : base44.entities.Partner.create(p), onSuccess: () => qc.invalidateQueries({ queryKey: ["partners"] }) });
  const saveInteraction = useMutation({ mutationFn: i => i.id ? base44.entities.PartnerInteraction.update(i.id, i) : base44.entities.PartnerInteraction.create(i), onSuccess: () => qc.invalidateQueries({ queryKey: ["interactions"] }) });

  const today = new Date().toISOString().split("T")[0];
  const meetingsSoon = partners.filter(p => p.next_meeting_date && differenceInDays(parseISO(p.next_meeting_date), new Date()) <= 14 && differenceInDays(parseISO(p.next_meeting_date), new Date()) >= 0);
  const contractsExpiring = partners.filter(p => p.contract_end && differenceInDays(parseISO(p.contract_end), new Date()) <= 60 && differenceInDays(parseISO(p.contract_end), new Date()) >= 0);

  const filtered = partners.filter(p => !search || p.organisation_name?.toLowerCase().includes(search.toLowerCase()) || p.primary_contact_name?.toLowerCase().includes(search.toLowerCase()));

  const recentInteractions = interactions.slice(0, 20);

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold">Partners & Stakeholders</h1>
          <p className="text-sm text-muted-foreground">Bury Council, NHS, Age UK National, GP Federation and all key relationships</p>
        </div>
        <Button onClick={() => { setEditingPartner(null); setPartnerDialog(true); }}><Plus className="w-4 h-4 mr-2" />Add Partner</Button>
      </div>

      {/* Alerts */}
      {meetingsSoon.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800 flex items-center gap-2">
          <Calendar className="w-4 h-4 flex-shrink-0" />
          <span>Meetings in next 14 days: <strong>{meetingsSoon.map(p => `${p.organisation_name} (${p.next_meeting_date})`).join(", ")}</strong></span>
        </div>
      )}
      {contractsExpiring.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-sm text-orange-800 flex items-center gap-2">
          <FileText className="w-4 h-4 flex-shrink-0" />
          <span>Contracts expiring within 60 days: <strong>{contractsExpiring.map(p => p.organisation_name).join(", ")}</strong></span>
        </div>
      )}

      <Tabs defaultValue="partners">
        <TabsList className="grid grid-cols-2 w-64">
          <TabsTrigger value="partners">Partners ({partners.length})</TabsTrigger>
          <TabsTrigger value="log">Interaction Log</TabsTrigger>
        </TabsList>

        <TabsContent value="partners" className="space-y-4 mt-4">
          <Input placeholder="Search partners..." value={search} onChange={e => setSearch(e.target.value)} className="max-w-sm" />
          {isLoading ? <div className="animate-pulse h-32 bg-muted rounded-xl" /> : (
            <div className="grid gap-3 md:grid-cols-2">
              {filtered.map(p => (
                <div key={p.id} className="bg-card border rounded-xl p-4 hover:shadow-sm group">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-medium text-sm">{p.organisation_name}</span>
                        <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", typeColors[p.partner_type])}>{typeLabels[p.partner_type]}</span>
                        {p.status !== "active" && <Badge variant="outline" className="text-xs capitalize">{p.status}</Badge>}
                      </div>
                      {p.relationship_type && <p className="text-xs text-muted-foreground capitalize mb-2">{p.relationship_type.replace(/_/g," ")}</p>}
                      {p.primary_contact_name && <p className="text-xs font-medium">{p.primary_contact_name}{p.primary_contact_role ? ` — ${p.primary_contact_role}` : ""}</p>}
                      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1">
                        {p.primary_contact_phone && <a href={`tel:${p.primary_contact_phone}`} onClick={e=>e.stopPropagation()} className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1"><Phone className="w-3 h-3" />{p.primary_contact_phone}</a>}
                        {p.primary_contact_email && <a href={`mailto:${p.primary_contact_email}`} onClick={e=>e.stopPropagation()} className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1"><Mail className="w-3 h-3" />{p.primary_contact_email}</a>}
                        {p.website && <a href={p.website} target="_blank" rel="noopener noreferrer" onClick={e=>e.stopPropagation()} className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1"><Globe className="w-3 h-3" />Website</a>}
                      </div>
                      {p.contract_end && <p className="text-xs mt-2 text-muted-foreground">Contract ends: {p.contract_end}{p.contract_value ? ` · £${p.contract_value.toLocaleString()}` : ""}</p>}
                      {p.next_meeting_date && <p className="text-xs text-amber-600 mt-1 flex items-center gap-1"><Calendar className="w-3 h-3" />Next meeting: {p.next_meeting_date}</p>}
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setEditingPartner(p); setPartnerDialog(true); }}><Pencil className="w-3.5 h-3.5" /></Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setSelectedPartner(p); setInteractionDialog(true); }}><Plus className="w-3.5 h-3.5" /></Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="log" className="space-y-3 mt-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">Recent interactions and meeting notes</p>
            <Button variant="outline" size="sm" onClick={() => { setSelectedPartner(null); setInteractionDialog(true); }}><Plus className="w-3.5 h-3.5 mr-1" />Log Interaction</Button>
          </div>
          <div className="space-y-2">
            {recentInteractions.length === 0 && <p className="text-center text-muted-foreground py-8 text-sm">No interactions logged yet.</p>}
            {recentInteractions.map(i => (
              <div key={i.id} className="bg-card border rounded-xl p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs bg-muted px-2 py-0.5 rounded-full capitalize">{i.interaction_type?.replace(/_/g," ")}</span>
                      <span className="font-medium text-sm">{i.partner_name}</span>
                    </div>
                    {i.summary && <p className="text-sm text-foreground/80 mt-1">{i.summary}</p>}
                    {i.actions && <p className="text-xs text-amber-700 mt-1 font-medium">Actions: {i.actions}</p>}
                    {i.attendees && <p className="text-xs text-muted-foreground mt-1">Attendees: {i.attendees}</p>}
                  </div>
                  <div className="text-right flex-shrink-0 ml-3">
                    <p className="text-xs text-muted-foreground">{i.date}</p>
                    {i.follow_up_date && <p className="text-xs text-amber-600 mt-1">Follow up: {i.follow_up_date}</p>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <PartnerFormDialog open={partnerDialog} onOpenChange={setPartnerDialog} partner={editingPartner}
        onSave={async p => { await savePartner.mutateAsync(p); setEditingPartner(null); }} />
      <InteractionFormDialog open={interactionDialog} onOpenChange={setInteractionDialog} partners={partners} preselectedPartner={selectedPartner}
        onSave={async i => { await saveInteraction.mutateAsync(i); setSelectedPartner(null); }} />
    </div>
  );
}