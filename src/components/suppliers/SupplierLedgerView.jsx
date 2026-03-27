import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

const typeLabels = { invoice: "Invoice", payment: "Payment", credit_note: "Credit Note", adjustment: "Adjustment" };
const typeColors = {
  invoice: "text-destructive",
  payment: "text-emerald-600",
  credit_note: "text-blue-600",
  adjustment: "text-amber-600",
};

export default function SupplierLedgerView({ supplier }) {
  const [addOpen, setAddOpen] = useState(false);
  const [entry, setEntry] = useState({});
  const qc = useQueryClient();

  const { data: ledger = [] } = useQuery({
    queryKey: ["ledger", supplier.id],
    queryFn: () => base44.entities.SupplierLedger.filter({ supplier_id: supplier.id }, "transaction_date", 200),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.SupplierLedger.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["ledger", supplier.id] }); setAddOpen(false); },
  });

  const runningBalance = ledger.reduce((acc, t) => acc + (t.debit || 0) - (t.credit || 0), 0);

  const handleAdd = (e) => {
    e.preventDefault();
    const isPayment = entry.transaction_type === "payment" || entry.transaction_type === "credit_note";
    createMutation.mutate({
      ...entry,
      supplier_id: supplier.id,
      supplier_name: supplier.company_name,
      debit: isPayment ? 0 : parseFloat(entry.amount || 0),
      credit: isPayment ? parseFloat(entry.amount || 0) : 0,
      balance: 0,
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Outstanding Balance</p>
          <p className={cn("text-2xl font-bold font-heading", runningBalance > 0 ? "text-destructive" : "text-emerald-600")}>
            £{Math.abs(runningBalance).toFixed(2)}
            <span className="text-sm font-normal ml-1 text-muted-foreground">{runningBalance > 0 ? "owed to supplier" : runningBalance < 0 ? "credit" : "clear"}</span>
          </p>
        </div>
        <Button size="sm" onClick={() => { setEntry({ transaction_date: new Date().toISOString().split("T")[0], transaction_type: "invoice" }); setAddOpen(true); }}>
          <Plus className="w-3.5 h-3.5 mr-1" /> Add Entry
        </Button>
      </div>

      {/* Ledger Table */}
      <div className="rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50 border-b text-xs text-muted-foreground">
              <th className="text-left p-2 pl-3">Date</th>
              <th className="text-left p-2">Type</th>
              <th className="text-left p-2">Reference</th>
              <th className="text-left p-2">Description</th>
              <th className="text-right p-2">Debit (owed)</th>
              <th className="text-right p-2">Credit (paid)</th>
            </tr>
          </thead>
          <tbody>
            {ledger.length === 0 ? (
              <tr><td colSpan={6} className="p-4 text-center text-muted-foreground text-xs">No ledger entries yet</td></tr>
            ) : (
              ledger.map(t => (
                <tr key={t.id} className="border-b last:border-0 hover:bg-muted/20">
                  <td className="p-2 pl-3 text-xs">{t.transaction_date}</td>
                  <td className="p-2"><span className={cn("text-xs font-medium", typeColors[t.transaction_type])}>{typeLabels[t.transaction_type]}</span></td>
                  <td className="p-2 text-xs text-muted-foreground">{t.reference}</td>
                  <td className="p-2 text-xs">{t.description}</td>
                  <td className="p-2 text-right text-xs text-destructive">{t.debit > 0 ? `£${t.debit.toFixed(2)}` : ""}</td>
                  <td className="p-2 text-right text-xs text-emerald-600">{t.credit > 0 ? `£${t.credit.toFixed(2)}` : ""}</td>
                </tr>
              ))
            )}
          </tbody>
          {ledger.length > 0 && (
            <tfoot>
              <tr className="bg-muted/50 font-semibold text-xs border-t">
                <td colSpan={4} className="p-2 pl-3">Totals</td>
                <td className="p-2 text-right text-destructive">£{ledger.reduce((s, t) => s + (t.debit || 0), 0).toFixed(2)}</td>
                <td className="p-2 text-right text-emerald-600">£{ledger.reduce((s, t) => s + (t.credit || 0), 0).toFixed(2)}</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* Add Entry Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="font-heading">Add Ledger Entry</DialogTitle></DialogHeader>
          <form onSubmit={handleAdd} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Date</Label>
                <Input type="date" value={entry.transaction_date || ""} onChange={e => setEntry(p => ({ ...p, transaction_date: e.target.value }))} className="mt-1" required />
              </div>
              <div>
                <Label className="text-xs">Type</Label>
                <Select value={entry.transaction_type || ""} onValueChange={v => setEntry(p => ({ ...p, transaction_type: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="invoice">Invoice (owed to supplier)</SelectItem>
                    <SelectItem value="payment">Payment (paid to supplier)</SelectItem>
                    <SelectItem value="credit_note">Credit Note</SelectItem>
                    <SelectItem value="adjustment">Adjustment</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-xs">Amount (£)</Label>
              <Input type="number" step="0.01" value={entry.amount || ""} onChange={e => setEntry(p => ({ ...p, amount: e.target.value }))} className="mt-1" required />
            </div>
            <div>
              <Label className="text-xs">Reference (PO / Invoice number)</Label>
              <Input value={entry.reference || ""} onChange={e => setEntry(p => ({ ...p, reference: e.target.value }))} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Description</Label>
              <Input value={entry.description || ""} onChange={e => setEntry(p => ({ ...p, description: e.target.value }))} className="mt-1" />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
              <Button type="submit">Add Entry</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}