import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { differenceInBusinessDays, parseISO } from 'date-fns';

const ABSENCE_TYPES = [
  { value: 'sick', label: '🤒 Sickness' },
  { value: 'unauthorised', label: '⚠️ Unauthorised' },
  { value: 'compassionate_leave', label: '💛 Compassionate Leave' },
  { value: 'unpaid_leave', label: '💸 Unpaid Leave' },
  { value: 'maternity_paternity', label: '👶 Maternity/Paternity' },
  { value: 'other', label: '📋 Other' },
];

export default function AbsenceFormDialog({ open, onClose, onSave, record, staffList }) {
  const [form, setForm] = useState({
    staff_id: '', staff_name: '',
    absence_type: 'sick',
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
    days: 1,
    reason: '',
    self_cert_submitted: false,
    fit_note_required: false,
    fit_note_received: false,
    return_to_work_interview: false,
    return_to_work_date: '',
    notes: '',
    status: 'open',
  });

  useEffect(() => {
    if (record) setForm({ ...form, ...record });
  }, [record, open]);

  const set = (k, v) => setForm(f => {
    const updated = { ...f, [k]: v };
    if (k === 'staff_id') {
      const staff = staffList.find(s => s.id === v);
      updated.staff_name = staff?.name || '';
    }
    if (k === 'start_date' || k === 'end_date') {
      try {
        const d = differenceInBusinessDays(parseISO(updated.end_date), parseISO(updated.start_date)) + 1;
        updated.days = Math.max(1, d);
        updated.fit_note_required = updated.days > 7;
      } catch {}
    }
    return updated;
  });

  const isSick = form.absence_type === 'sick';

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{record ? 'Edit Absence Record' : 'Log Absence'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Staff Member</Label>
              <Select value={form.staff_id} onValueChange={v => set('staff_id', v)}>
                <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                <SelectContent>
                  {staffList.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Absence Type</Label>
              <Select value={form.absence_type} onValueChange={v => set('absence_type', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ABSENCE_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>Start Date</Label>
              <Input type="date" value={form.start_date} onChange={e => set('start_date', e.target.value)} />
            </div>
            <div>
              <Label>End Date</Label>
              <Input type="date" value={form.end_date} onChange={e => set('end_date', e.target.value)} />
            </div>
            <div>
              <Label>Working Days</Label>
              <Input type="number" value={form.days} onChange={e => set('days', Number(e.target.value))} />
            </div>
          </div>

          <div>
            <Label>Reason</Label>
            <Textarea value={form.reason} onChange={e => set('reason', e.target.value)} rows={2} />
          </div>

          {isSick && (
            <div className="space-y-3 bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-xs font-semibold text-red-800 uppercase tracking-wide">Sickness Management</p>
              <div className="flex items-center justify-between">
                <Label className="text-sm">Self-cert submitted</Label>
                <Switch checked={form.self_cert_submitted} onCheckedChange={v => set('self_cert_submitted', v)} />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-sm">Fit note required</Label>
                <Switch checked={form.fit_note_required} onCheckedChange={v => set('fit_note_required', v)} />
              </div>
              {form.fit_note_required && (
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Fit note received</Label>
                  <Switch checked={form.fit_note_received} onCheckedChange={v => set('fit_note_received', v)} />
                </div>
              )}
              <div className="flex items-center justify-between">
                <Label className="text-sm">Return-to-work interview done</Label>
                <Switch checked={form.return_to_work_interview} onCheckedChange={v => set('return_to_work_interview', v)} />
              </div>
              {form.return_to_work_interview && (
                <div>
                  <Label className="text-sm">Return to work date</Label>
                  <Input type="date" value={form.return_to_work_date} onChange={e => set('return_to_work_date', e.target.value)} />
                </div>
              )}
            </div>
          )}

          <div>
            <Label>Status</Label>
            <Select value={form.status} onValueChange={v => set('status', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
                <SelectItem value="under_review">Under Review</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Notes</Label>
            <Textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={2} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => onSave(form)}>{record ? 'Save' : 'Log Absence'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}