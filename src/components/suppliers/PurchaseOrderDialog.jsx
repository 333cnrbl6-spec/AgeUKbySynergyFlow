import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";

const emptyPO = {
  po_number: "", supplier_id: "", supplier_name: "", job_id: "", job_title: "", client_name: "",
  description: "", status: "draft", issue_date: new Date().toISOString().split("T")[0],
  required_by: "", line_items: [], net_amount: 0, vat_amount: 0, total_amount: 0,
  payment_status: "unpaid", payment_method: "bacs", invoice_reference: "", notes: "",
};

const emptyLine = { description: "", quantity: 1, unit_price: 0, total: 0 };

export default function PurchaseOrderDialog({ open, onOpenChange, po, supplierId, onSave }) {
  const [form, setForm] = useState(emptyPO);
  const [saving, setSaving] = useState(false);

  const { data: suppliers = [] } = useQuery({ queryKey: ["suppliers"], queryFn: () => base44.entities.Supplier.list("company_name", 100) });
  const { data: jobs = [] } = useQuery({ queryKey: ["jobs"], queryFn: () => base44.entities.Job.list("-created_date", 100) });

  useEffect(() => {
    if (po) {
      setForm({ ...emptyPO, ...po, line_items: po.line_items || [] });
    } else {
      const poNumber = `PO-${Date.now().toString().slice(-6)}`;
      setForm({ ...emptyPO, po_number: poNumber, supplier_id: supplierId || "", supplier_name: "" });
    }
  }, [po, supplierId, open]);

  const set = (field, val) => setForm(prev => ({ ...prev, [field]: val }));

  const setLine = (idx, field, val) => {
    const items = [...(form.line_items || [])];
    items[idx] = { ...items[idx], [field]: val };
    if (field === "quantity" || field === "unit_price") {
      items[idx].total = (parseFloat(items[idx].quantity) || 0) * (parseFloat(items[idx].unit_price) || 0);
    }
    const net = items.reduce((s, i) => s + (i.total || 0), 0);
    const vat = form.vat_amount || 0;
    setForm(prev => ({ ...prev, line_items: items, net_amount: net, total_amount: net + vat }));
  };

  const addLine = () => setForm(prev => ({ ...prev, line_items: [...(prev.line_items || []), { ...emptyLine }] }));
  const removeLine = (idx) => {
    const items = form.line_items.filter((_, i) => i !== idx);
    const net = items.reduce((s, i) => s + (i.total || 0), 0);
    setForm(prev => ({ ...prev, line_items: items, net_amount: net, total_amount: net + (prev.vat_amount || 0) }));
  };

  const handleVat = (val) => {
    const vat = parseFloat(val) || 0;
    setForm(prev => ({ ...prev, vat_amount: vat, total_amount: (prev.net_amount || 0) + vat }));
  };

  const handleSupplier = (id) => {
    const s = suppliers.find(s => s.id === id);
    setForm(prev => ({ ...prev, supplier_id: id, supplier_name: s?.company_name || "" }));
  };

  const handleJob = (id) => {
    const j = jobs.find(j => j.id === id);
    setForm(prev => ({ ...prev, job_id: id, job_title: j?.title || "", client_name: j?.client_name || "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    await onSave(form);
    setSaving(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading">{po ? `Edit ${po.po_number}` : "New Purchase Order"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">PO Number</Label>
              <Input value={form.po_number} onChange={e => set("po_number", e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Status</Label>
              <Select value={form.status} onValueChange={v => set("status", v)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["draft","sent","acknowledged","in_progress","completed","invoiced","paid","cancelled"].map(s => (
                    <SelectItem key={s} value={s}>{s.replace("_"," ").replace(/\b\w/g, c => c.toUpperCase())}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Supplier *</Label>
              <Select value={form.supplier_id} onValueChange={handleSupplier}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select supplier" /></SelectTrigger>
                <SelectContent>
                  {suppliers.map(s => <SelectItem key={s.id} value={s.id}>{s.company_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Linked Job (optional)</Label>
              <Select value={form.job_id} onValueChange={handleJob}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select job" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>None</SelectItem>
                  {jobs.map(j => <SelectItem key={j.id} value={j.id}>{j.client_name} — {j.title}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Issue Date</Label>
              <Input type="date" value={form.issue_date} onChange={e => set("issue_date", e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Required By</Label>
              <Input type="date" value={form.required_by} onChange={e => set("required_by", e.target.value)} className="mt-1" />
            </div>
            <div className="col-span-2">
              <Label className="text-xs">Work / Goods Description *</Label>
              <Textarea value={form.description} onChange={e => set("description", e.target.value)} rows={2} required className="mt-1" />
            </div>
          </div>

          {/* Line Items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-xs font-semibold">Line Items</Label>
              <Button type="button" size="sm" variant="outline" onClick={addLine}><Plus className="w-3 h-3 mr-1" />Add Line</Button>
            </div>
            <div className="space-y-2">
              {(form.line_items || []).map((line, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 items-center bg-muted/40 rounded-lg p-2">
                  <div className="col-span-5">
                    <Input placeholder="Description" value={line.description} onChange={e => setLine(idx, "description", e.target.value)} className="text-sm" />
                  </div>
                  <div className="col-span-2">
                    <Input type="number" placeholder="Qty" value={line.quantity} onChange={e => setLine(idx, "quantity", e.target.value)} className="text-sm" />
                  </div>
                  <div className="col-span-2">
                    <Input type="number" placeholder="Price" value={line.unit_price} onChange={e => setLine(idx, "unit_price", e.target.value)} className="text-sm" />
                  </div>
                  <div className="col-span-2 text-sm font-medium text-right pr-1">£{(line.total || 0).toFixed(2)}</div>
                  <div className="col-span-1 flex justify-end">
                    <Button type="button" size="icon" variant="ghost" onClick={() => removeLine(idx)}><Trash2 className="w-3.5 h-3.5 text-destructive" /></Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Totals */}
          <div className="border-t pt-3 space-y-1.5 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Net</span><span>£{(form.net_amount || 0).toFixed(2)}</span></div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">VAT</span>
              <Input type="number" value={form.vat_amount || 0} onChange={e => handleVat(e.target.value)} className="w-28 h-7 text-sm text-right" />
            </div>
            <div className="flex justify-between font-bold border-t pt-1"><span>Total</span><span>£{(form.total_amount || 0).toFixed(2)}</span></div>
          </div>

          {/* Payment */}
          <div className="grid grid-cols-3 gap-3 border-t pt-3">
            <div>
              <Label className="text-xs">Payment Status</Label>
              <Select value={form.payment_status} onValueChange={v => set("payment_status", v)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="unpaid">Unpaid</SelectItem>
                  <SelectItem value="partial">Partial</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Payment Method</Label>
              <Select value={form.payment_method} onValueChange={v => set("payment_method", v)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="bacs">BACS</SelectItem>
                  <SelectItem value="cheque">Cheque</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Supplier Invoice Ref</Label>
              <Input value={form.invoice_reference || ""} onChange={e => set("invoice_reference", e.target.value)} className="mt-1" />
            </div>
          </div>

          <div>
            <Label className="text-xs">Notes</Label>
            <Textarea value={form.notes || ""} onChange={e => set("notes", e.target.value)} rows={2} className="mt-1" />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? "Saving..." : po ? "Update PO" : "Create PO"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}