import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Star, Phone, Mail, ShieldCheck, AlertTriangle, X } from "lucide-react";
import { cn } from "@/lib/utils";
import SupplierFormDialog from "../components/suppliers/SupplierFormDialog";
import SupplierDetailPanel from "../components/suppliers/SupplierDetailPanel";

const typeLabels = {
  subcontractor: "Subcontractor",
  direct_referral: "Direct Referral",
  materials_supplier: "Materials",
  specialist_contractor: "Specialist",
  other: "Other",
};

const typeColors = {
  subcontractor: "bg-purple-50 text-purple-700 border-purple-200",
  direct_referral: "bg-blue-50 text-blue-700 border-blue-200",
  materials_supplier: "bg-amber-50 text-amber-700 border-amber-200",
  specialist_contractor: "bg-teal-50 text-teal-700 border-teal-200",
  other: "bg-gray-50 text-gray-700 border-gray-200",
};

export default function Suppliers() {
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterSkill, setFilterSkill] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const qc = useQueryClient();

  const { data: suppliers = [], isLoading } = useQuery({
    queryKey: ["suppliers"],
    queryFn: () => base44.entities.Supplier.list("company_name", 200),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Supplier.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["suppliers"] }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Supplier.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["suppliers"] }); },
  });

  const handleSave = async (form) => {
    if (editingSupplier) {
      const updated = await updateMutation.mutateAsync({ id: editingSupplier.id, data: form });
      if (selectedSupplier?.id === editingSupplier.id) setSelectedSupplier({ ...editingSupplier, ...form });
    } else {
      await createMutation.mutateAsync(form);
    }
    setEditingSupplier(null);
  };

  // All unique skills for filter
  const allSkills = [...new Set(suppliers.flatMap(s => s.skills || []))].sort();

  const filtered = suppliers.filter(s => {
    const q = search.toLowerCase();
    const matchSearch = !q || s.company_name?.toLowerCase().includes(q) || s.contact_name?.toLowerCase().includes(q) || (s.skills || []).some(sk => sk.toLowerCase().includes(q));
    const matchType = filterType === "all" || s.supplier_type === filterType;
    const matchSkill = !filterSkill || (s.skills || []).includes(filterSkill);
    return matchSearch && matchType && matchSkill;
  });

  // Today's insurance/gas safe expiry warnings
  const today = new Date().toISOString().split("T")[0];
  const expiringSoon = suppliers.filter(s => {
    const ins = s.insurance_expiry;
    const gas = s.gas_safe_expiry;
    const inSixty = new Date(today);
    inSixty.setDate(inSixty.getDate() + 60);
    const limit = inSixty.toISOString().split("T")[0];
    return (ins && ins <= limit && ins >= today) || (gas && gas <= limit && gas >= today);
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold">Suppliers</h1>
          <p className="text-sm text-muted-foreground">Subcontractors, referrals & trade partners</p>
        </div>
        <Button onClick={() => { setEditingSupplier(null); setFormOpen(true); }}>
          <Plus className="w-4 h-4 mr-2" />Add Supplier
        </Button>
      </div>

      {/* Expiry warnings */}
      {expiringSoon.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2 text-sm text-amber-800">
          <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span><strong>{expiringSoon.length} supplier(s)</strong> have insurance or Gas Safe certificates expiring within 60 days: {expiringSoon.map(s => s.company_name).join(", ")}</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search by name, contact or skill..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-44"><SelectValue placeholder="All types" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {Object.entries(typeLabels).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterSkill} onValueChange={setFilterSkill}>
          <SelectTrigger className="w-44"><SelectValue placeholder="Filter by skill" /></SelectTrigger>
          <SelectContent>
            <SelectItem value={null}>All Skills</SelectItem>
            {allSkills.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Supplier List */}
        <div className={cn("space-y-2", selectedSupplier ? "lg:col-span-1" : "lg:col-span-3")}>
          <p className="text-xs text-muted-foreground">{filtered.length} supplier{filtered.length !== 1 ? "s" : ""}</p>
          {isLoading ? (
            Array(4).fill(0).map((_, i) => <div key={i} className="bg-card rounded-xl h-24 animate-pulse border border-border/50" />)
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">No suppliers found.</div>
          ) : (
            filtered.map(supplier => (
              <div
                key={supplier.id}
                onClick={() => setSelectedSupplier(selectedSupplier?.id === supplier.id ? null : supplier)}
                className={cn(
                  "bg-card rounded-xl p-4 border cursor-pointer transition-all hover:shadow-md",
                  selectedSupplier?.id === supplier.id ? "border-primary shadow-md" : "border-border/50"
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold font-heading truncate">{supplier.company_name}</p>
                      {supplier.preferred && <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 flex-shrink-0" />}
                    </div>
                    {supplier.contact_name && <p className="text-xs text-muted-foreground">{supplier.contact_name}</p>}
                  </div>
                  <Badge variant="outline" className={cn("text-xs flex-shrink-0 border", typeColors[supplier.supplier_type])}>
                    {typeLabels[supplier.supplier_type] || supplier.supplier_type}
                  </Badge>
                </div>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  {supplier.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{supplier.phone}</span>}
                  {supplier.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{supplier.email}</span>}
                </div>
                {supplier.skills?.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {supplier.skills.slice(0, selectedSupplier ? 3 : 6).map(s => (
                      <span key={s} className="text-xs bg-accent text-accent-foreground px-1.5 py-0.5 rounded-full">{s}</span>
                    ))}
                    {supplier.skills.length > (selectedSupplier ? 3 : 6) && (
                      <span className="text-xs text-muted-foreground">+{supplier.skills.length - (selectedSupplier ? 3 : 6)} more</span>
                    )}
                  </div>
                )}
                <div className="mt-2 flex gap-2">
                  {supplier.gas_safe_number && <span className="text-xs flex items-center gap-1 text-blue-600"><ShieldCheck className="w-3 h-3" />Gas Safe</span>}
                  {supplier.insurance_expiry && new Date(supplier.insurance_expiry) < new Date(today) && (
                    <span className="text-xs flex items-center gap-1 text-destructive"><AlertTriangle className="w-3 h-3" />Insurance Expired</span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Detail Panel */}
        {selectedSupplier && (
          <div className="lg:col-span-2 bg-card rounded-xl border border-border/50 p-5 shadow-sm">
            <div className="flex justify-end mb-2">
              <Button variant="ghost" size="icon" onClick={() => setSelectedSupplier(null)}><X className="w-4 h-4" /></Button>
            </div>
            <SupplierDetailPanel
              supplier={selectedSupplier}
              onEdit={() => { setEditingSupplier(selectedSupplier); setFormOpen(true); }}
            />
          </div>
        )}
      </div>

      <SupplierFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        supplier={editingSupplier}
        onSave={handleSave}
      />
    </div>
  );
}