import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format, startOfMonth, endOfMonth, addMonths } from 'date-fns';

export default function PayPeriodDialog({ open, onClose, onSave }) {
  const next = addMonths(new Date(), 0);
  const [form, setForm] = useState({
    label: format(next, 'MMMM yyyy'),
    period_start: format(startOfMonth(next), 'yyyy-MM-dd'),
    period_end: format(endOfMonth(next), 'yyyy-MM-dd'),
    pay_date: '',
    frequency: 'monthly',
    status: 'open',
    notes: '',
  });

  useEffect(() => {
    if (open) {
      const m = addMonths(new Date(), 0);
      setForm({
        label: format(m, 'MMMM yyyy'),
        period_start: format(startOfMonth(m), 'yyyy-MM-dd'),
        period_end: format(endOfMonth(m), 'yyyy-MM-dd'),
        pay_date: '',
        frequency: 'monthly',
        status: 'open',
        notes: '',
      });
    }
  }, [open]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Create Pay Period</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Label</Label>
            <Input value={form.label} onChange={e => set('label', e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Period Start</Label>
              <Input type="date" value={form.period_start} onChange={e => set('period_start', e.target.value)} />
            </div>
            <div>
              <Label>Period End</Label>
              <Input type="date" value={form.period_end} onChange={e => set('period_end', e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Pay Date</Label>
              <Input type="date" value={form.pay_date} onChange={e => set('pay_date', e.target.value)} />
            </div>
            <div>
              <Label>Frequency</Label>
              <Select value={form.frequency} onValueChange={v => set('frequency', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="fortnightly">Fortnightly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => onSave(form)}>Create Period</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}