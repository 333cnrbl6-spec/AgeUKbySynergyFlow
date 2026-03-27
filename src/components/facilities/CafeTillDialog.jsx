import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";

const MENU_ITEMS = [
  { item: "Hot Meal (Daily Special)", category: "food", unit_price: 5.50 },
  { item: "Soup & Roll", category: "food", unit_price: 3.50 },
  { item: "Sandwich", category: "food", unit_price: 3.00 },
  { item: "Jacket Potato", category: "food", unit_price: 4.00 },
  { item: "Cake / Slice", category: "food", unit_price: 1.80 },
  { item: "Scone & Butter", category: "food", unit_price: 1.50 },
  { item: "Biscuits", category: "food", unit_price: 0.50 },
  { item: "Tea", category: "drinks", unit_price: 1.20 },
  { item: "Coffee", category: "drinks", unit_price: 1.50 },
  { item: "Cold Drink", category: "drinks", unit_price: 1.00 },
  { item: "Hot Chocolate", category: "drinks", unit_price: 1.80 },
];

export default function CafeTillDialog({ open, onOpenChange, onSave }) {
  const today = new Date().toISOString().split("T")[0];
  const [form, setForm] = useState({ sale_date: today, till_session: "all_day", cash_takings: "", card_takings: "", covers: "", staff_on_duty: "", notes: "", items_sold: [] });
  const [saving, setSaving] = useState(false);

  const addItem = (menuItem) => {
    setForm(p => {
      const existing = p.items_sold.findIndex(i => i.item === menuItem.item);
      let items;
      if (existing >= 0) {
        items = p.items_sold.map((i, idx) => idx === existing ? { ...i, quantity: i.quantity + 1, total: (i.quantity + 1) * i.unit_price } : i);
      } else {
        items = [...p.items_sold, { ...menuItem, quantity: 1, total: menuItem.unit_price }];
      }
      const gross = (parseFloat(p.cash_takings)||0) + (parseFloat(p.card_takings)||0);
      return { ...p, items_sold: items, gross_takings: gross };
    });
  };

  const removeItem = (idx) => setForm(p => ({ ...p, items_sold: p.items_sold.filter((_,i) => i !== idx) }));

  const set = (f, v) => {
    setForm(p => {
      const updated = { ...p, [f]: v };
      updated.gross_takings = (parseFloat(updated.cash_takings)||0) + (parseFloat(updated.card_takings)||0);
      return updated;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true);
    const gross = (parseFloat(form.cash_takings)||0) + (parseFloat(form.card_takings)||0);
    await onSave({ ...form, gross_takings: gross });
    setSaving(false); onOpenChange(false);
  };

  const itemsTotal = form.items_sold.reduce((s, i) => s + (i.total||0), 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle className="font-heading">Café Daily Till Entry</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div><Label className="text-xs">Date</Label><Input type="date" value={form.sale_date} onChange={e=>set("sale_date",e.target.value)} required className="mt-1" /></div>
            <div>
              <Label className="text-xs">Session</Label>
              <Select value={form.till_session} onValueChange={v=>set("till_session",v)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="morning">Morning</SelectItem>
                  <SelectItem value="afternoon">Afternoon</SelectItem>
                  <SelectItem value="all_day">All Day</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label className="text-xs">Staff on Duty</Label><Input value={form.staff_on_duty} onChange={e=>set("staff_on_duty",e.target.value)} className="mt-1" /></div>
          </div>

          {/* Quick add menu items */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Quick Add Items</p>
            <div className="flex flex-wrap gap-1.5">
              {MENU_ITEMS.map(m => (
                <button key={m.item} type="button" onClick={() => addItem(m)}
                  className="px-2.5 py-1 rounded-full text-xs border bg-background border-border hover:border-primary hover:text-primary transition-colors">
                  {m.item} £{m.unit_price.toFixed(2)}
                </button>
              ))}
            </div>
          </div>

          {/* Items sold */}
          {form.items_sold.length > 0 && (
            <div className="rounded-lg border overflow-hidden">
              <table className="w-full text-sm">
                <thead><tr className="bg-muted/40 text-xs text-muted-foreground"><th className="text-left p-2 pl-3">Item</th><th className="text-center p-2">Qty</th><th className="text-right p-2">Total</th><th className="p-2 w-8"></th></tr></thead>
                <tbody>
                  {form.items_sold.map((i, idx) => (
                    <tr key={idx} className="border-t">
                      <td className="p-2 pl-3 text-xs">{i.item}</td>
                      <td className="p-2 text-center"><Input type="number" value={i.quantity} min={1} onChange={e=>{const q=parseInt(e.target.value)||1; setForm(p=>({...p,items_sold:p.items_sold.map((x,xi)=>xi===idx?{...x,quantity:q,total:q*x.unit_price}:x)}));}} className="w-16 h-7 text-center text-xs mx-auto" /></td>
                      <td className="p-2 text-right text-xs font-medium">£{(i.total||0).toFixed(2)}</td>
                      <td className="p-2"><Button type="button" size="icon" variant="ghost" onClick={()=>removeItem(idx)}><Trash2 className="w-3 h-3 text-destructive" /></Button></td>
                    </tr>
                  ))}
                  <tr className="border-t bg-muted/20 font-semibold text-xs">
                    <td className="p-2 pl-3" colSpan={2}>Items Total</td>
                    <td className="p-2 text-right">£{itemsTotal.toFixed(2)}</td><td></td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* Takings */}
          <div className="border-t pt-3 grid grid-cols-3 gap-3">
            <div><Label className="text-xs">Cash Takings (£)</Label><Input type="number" step="0.01" value={form.cash_takings} onChange={e=>set("cash_takings",e.target.value)} className="mt-1" /></div>
            <div><Label className="text-xs">Card Takings (£)</Label><Input type="number" step="0.01" value={form.card_takings} onChange={e=>set("card_takings",e.target.value)} className="mt-1" /></div>
            <div><Label className="text-xs">Covers (customers)</Label><Input type="number" value={form.covers||""} onChange={e=>set("covers",e.target.value)} className="mt-1" /></div>
          </div>
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 flex justify-between items-center">
            <span className="text-sm font-medium">Gross Takings</span>
            <span className="text-xl font-bold font-heading text-primary">£{((parseFloat(form.cash_takings)||0)+(parseFloat(form.card_takings)||0)).toFixed(2)}</span>
          </div>
          <div><Label className="text-xs">Notes</Label><Input value={form.notes||""} onChange={e=>set("notes",e.target.value)} className="mt-1" /></div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={()=>onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving?"Saving...":"Record Sales"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}