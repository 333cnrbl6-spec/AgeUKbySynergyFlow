import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Phone, Mail, Globe, MapPin, ShieldCheck, Star, Plus, Pencil, Calendar, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import PurchaseOrderDialog from "./PurchaseOrderDialog";
import SupplierLedgerView from "./SupplierLedgerView";

const statusStyles = {
  draft: "bg-gray-100 text-gray-700",
  sent: "bg-blue-100 text-blue-700",
  acknowledged: "bg-cyan-100 text-cyan-700",
  in_progress: "bg-amber-100 text-amber-700",
  completed: "bg-emerald-100 text-emerald-700",
  invoiced: "bg-purple-100 text-purple-700",
  paid: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

const scheduleStatusStyles = {
  confirmed: "bg-blue-100 text-blue-700",
  in_progress: "bg-amber-100 text-amber-700",
  completed: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-red-100 text-red-700",
  rescheduled: "bg-gray-100 text-gray-700",
};

export default function SupplierDetailPanel({ supplier, onEdit }) {
  const [poDialogOpen, setPoDialogOpen] = useState(false);
  const [editingPO, setEditingPO] = useState(null);
  const qc = useQueryClient();

  const { data: pos = [] } = useQuery({
    queryKey: ["pos", supplier.id],
    queryFn: () => base44.entities.PurchaseOrder.filter({ supplier_id: supplier.id }, "-issue_date", 50),
  });

  const { data: schedules = [] } = useQuery({
    queryKey: ["schedules", supplier.id],
    queryFn: () => base44.entities.WorkSchedule.filter({ supplier_id: supplier.id }, "-scheduled_date", 50),
  });

  const createPO = useMutation({
    mutationFn: (data) => base44.entities.PurchaseOrder.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["pos", supplier.id] }); },
  });

  const updatePO = useMutation({
    mutationFn: ({ id, data }) => base44.entities.PurchaseOrder.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["pos", supplier.id] }); },
  });

  const handleSavePO = async (form) => {
    if (editingPO) await updatePO.mutateAsync({ id: editingPO.id, data: form });
    else await createPO.mutateAsync(form);
    setEditingPO(null);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-heading font-bold">{supplier.company_name}</h2>
            {supplier.preferred && <Star className="w-4 h-4 fill-amber-400 text-amber-400" />}
          </div>
          {supplier.contact_name && <p className="text-sm text-muted-foreground">{supplier.contact_name}</p>}
          <div className="flex gap-2 mt-2 flex-wrap">
            <Badge variant="outline" className="text-xs capitalize">{supplier.supplier_type?.replace("_", " ")}</Badge>
            <Badge variant="outline" className={cn("text-xs", supplier.status === "active" ? "text-emerald-600 border-emerald-300" : "text-muted-foreground")}>{supplier.status}</Badge>
            {supplier.vat_registered && <Badge variant="outline" className="text-xs">VAT Reg</Badge>}
            {supplier.gas_safe_number && <Badge variant="outline" className="text-xs text-blue-600 border-blue-300">Gas Safe</Badge>}
          </div>
        </div>
        <Button size="sm" variant="outline" onClick={onEdit}><Pencil className="w-3.5 h-3.5 mr-1" />Edit</Button>
      </div>

      {/* Contact & Skills quick info */}
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="space-y-1.5">
          {supplier.phone && <div className="flex items-center gap-2 text-muted-foreground"><Phone className="w-3.5 h-3.5" />{supplier.phone}</div>}
          {supplier.mobile && <div className="flex items-center gap-2 text-muted-foreground"><Phone className="w-3.5 h-3.5" />{supplier.mobile} (mob)</div>}
          {supplier.email && <div className="flex items-center gap-2 text-muted-foreground"><Mail className="w-3.5 h-3.5" />{supplier.email}</div>}
          {supplier.website && <div className="flex items-center gap-2 text-muted-foreground"><Globe className="w-3.5 h-3.5" />{supplier.website}</div>}
          {supplier.address_line_1 && <div className="flex items-center gap-2 text-muted-foreground"><MapPin className="w-3.5 h-3.5" />{supplier.address_line_1}, {supplier.postcode}</div>}
        </div>
        <div>
          {supplier.skills?.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {supplier.skills.map(s => <span key={s} className="text-xs bg-accent text-accent-foreground px-2 py-0.5 rounded-full">{s}</span>)}
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="pos">
        <TabsList className="grid grid-cols-3 w-full">
          <TabsTrigger value="pos"><FileText className="w-3.5 h-3.5 mr-1" />Purchase Orders ({pos.length})</TabsTrigger>
          <TabsTrigger value="schedule"><Calendar className="w-3.5 h-3.5 mr-1" />Schedule ({schedules.length})</TabsTrigger>
          <TabsTrigger value="ledger">Ledger</TabsTrigger>
        </TabsList>

        <TabsContent value="pos" className="space-y-2 mt-3">
          <div className="flex justify-end">
            <Button size="sm" onClick={() => { setEditingPO(null); setPoDialogOpen(true); }}>
              <Plus className="w-3.5 h-3.5 mr-1" />New PO
            </Button>
          </div>
          {pos.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No purchase orders yet</p>
          ) : (
            <div className="space-y-2">
              {pos.map(po => (
                <div key={po.id} className="border rounded-lg p-3 hover:bg-muted/30 cursor-pointer" onClick={() => { setEditingPO(po); setPoDialogOpen(true); }}>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-sm">{po.po_number}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{po.description?.slice(0, 60)}...</p>
                      {po.job_title && <p className="text-xs text-muted-foreground">Job: {po.client_name} — {po.job_title}</p>}
                    </div>
                    <div className="text-right flex flex-col items-end gap-1">
                      <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", statusStyles[po.status])}>{po.status?.replace("_"," ")}</span>
                      <span className="font-semibold text-sm">£{(po.total_amount || 0).toFixed(2)}</span>
                      <span className={cn("text-xs", po.payment_status === "paid" ? "text-emerald-600" : "text-destructive")}>{po.payment_status}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="schedule" className="mt-3">
          {schedules.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No scheduled work</p>
          ) : (
            <div className="space-y-2">
              {schedules.map(s => (
                <div key={s.id} className="border rounded-lg p-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-sm">{s.scheduled_date} {s.scheduled_time && `at ${s.scheduled_time}`}</p>
                      {s.job_title && <p className="text-xs text-muted-foreground">{s.client_name} — {s.job_title}</p>}
                      {s.client_address && <p className="text-xs text-muted-foreground">{s.client_address}</p>}
                      {s.description && <p className="text-xs mt-1">{s.description}</p>}
                    </div>
                    <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", scheduleStatusStyles[s.status])}>{s.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="ledger" className="mt-3">
          <SupplierLedgerView supplier={supplier} />
        </TabsContent>
      </Tabs>

      <PurchaseOrderDialog
        open={poDialogOpen}
        onOpenChange={setPoDialogOpen}
        po={editingPO}
        supplierId={supplier.id}
        onSave={handleSavePO}
      />
    </div>
  );
}