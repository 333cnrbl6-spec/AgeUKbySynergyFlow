import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';

const ENTRY_TYPES = [
  { value: 'work', label: '✅ Work' },
  { value: 'holiday', label: '🌴 Annual Leave' },
  { value: 'sick', label: '🤒 Sick' },
  { value: 'bank_holiday', label: '🏛️ Bank Holiday' },
  { value: 'toil', label: '⏱️ TOIL' },
  { value: 'compassionate_leave', label: '💛 Compassionate Leave' },
  { value: 'maternity_paternity', label: '👶 Maternity/Paternity' },
  { value: 'unpaid_leave', label: '💸 Unpaid Leave' },
  { value: 'other_absence', label: '📋 Other Absence' },
];

function calcHours(start, end, breakMins) {
  if (!start || !end) return 0;
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  const totalMins = (eh * 60 + em) - (sh * 60 + sm) - (breakMins || 0);
  return Math.max(0, Math.round(totalMins / 60 * 100) / 100);
}

export default function TimesheetEntryDialog({ open, onClose, onSave, entry, staffList, payPeriodId }) {
  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    entry_type: 'work',
    staff_id: '',
    staff_name: '',
    start_time: '09:00',
    end_time: '17:00',
    break_minutes: 30,
    hours_worked: 7.5,
    overtime_hours: 0,
    hourly_rate: 0,
    notes: '',
    absence_reason: '',
    self_cert_submitted: false,
    fit_note_required: false,
    fit_note_received: false,
    status: 'draft',
  });

  useEffect(() => {
    if (entry) setForm({ ...form, ...entry });
    else setForm(f => ({ ...f, date: new Date().toISOString().split('T')[0], entry_type: 'work', status: 'draft' }));
  }, [entry, open]);

  const set = (k, v) => setForm(f => {
    const updated = { ...f, [k]: v };
    if (k === 'start_time' || k === 'end_time' || k === 'break_minutes') {
      updated.hours_worked = calcHours(updated.start_time, updated.end_time, updated.break_minutes);
    }
    if (k === 'staff_id') {
      const staff = staffList.find(s => s.id === v);
      updated.staff_name = staff?.name || '';
    }
    if (k === 'hours_worked' || k === 'hourly_rate') {
      updated.gross_pay = Math.round((updated.hours_worked + (updated.overtime_hours || 0) * 1.5) * updated.hourly_rate * 100) / 100;
    }
    return updated;
  });

  const isAbsence = ['sick', 'holiday', 'bank_holiday', 'compassionate_leave', 'maternity_paternity', 'unpaid_leave', 'toil', 'other_absence'].includes(form.entry_type);
  const isSick = form.entry_type === 'sick';

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{entry ? 'Edit Timesheet Entry' : 'New Timesheet Entry'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Staff Member</Label>
              <Select value={form.staff_id} onValueChange={v => set('staff_id', v)}>
                <SelectTrigger><SelectValue placeholder="Select staff..." /></SelectTrigger>
                <SelectContent>
                  {staffList.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Date</Label>
              <Input type="date" value={form.date} onChange={e => set('date', e.target.value)} />
            </div>
          </div>

          <div>
            <Label>Entry Type</Label>
            <Select value={form.entry_type} onValueChange={v => set('entry_type', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {ENTRY_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {!isAbsence && (
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Start Time</Label>
                <Input type="time" value={form.start_time} onChange={e => set('start_time', e.target.value)} />
              </div>
              <div>
                <Label>End Time</Label>
                <Input type="time" value={form.end_time} onChange={e => set('end_time', e.target.value)} />
              </div>
              <div>
                <Label>Break (mins)</Label>
                <Input type="number" value={form.break_minutes} onChange={e => set('break_minutes', Number(e.target.value))} />
              </div>
            </div>
          )}

          {!isAbsence && (
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Hours Worked</Label>
                <Input type="number" step="0.25" value={form.hours_worked} onChange={e => set('hours_worked', Number(e.target.value))} />
              </div>
              <div>
                <Label>Overtime Hrs (×1.5)</Label>
                <Input type="number" step="0.25" value={form.overtime_hours} onChange={e => set('overtime_hours', Number(e.target.value))} />
              </div>
              <div>
                <Label>Hourly Rate (£)</Label>
                <Input type="number" step="0.01" value={form.hourly_rate} onChange={e => set('hourly_rate', Number(e.target.value))} />
              </div>
            </div>
          )}

          {!isAbsence && form.gross_pay > 0 && (
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 text-sm">
              <span className="text-muted-foreground">Gross Pay: </span>
              <span className="font-bold text-primary text-lg">£{form.gross_pay.toFixed(2)}</span>
            </div>
          )}

          {isAbsence && (
            <div>
              <Label>Reason / Notes</Label>
              <Textarea value={form.absence_reason} onChange={e => set('absence_reason', e.target.value)} placeholder="Brief description..." rows={2} />
            </div>
          )}

          {isSick && (
            <div className="space-y-3 bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-xs font-semibold text-red-800 uppercase tracking-wide">Sickness Documentation</p>
              <div className="flex items-center justify-between">
                <Label className="text-sm">Self-cert submitted</Label>
                <Switch checked={form.self_cert_submitted} onCheckedChange={v => set('self_cert_submitted', v)} />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-sm">Fit note required (&gt;7 days)</Label>
                <Switch checked={form.fit_note_required} onCheckedChange={v => set('fit_note_required', v)} />
              </div>
              {form.fit_note_required && (
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Fit note received</Label>
                  <Switch checked={form.fit_note_received} onCheckedChange={v => set('fit_note_received', v)} />
                </div>
              )}
            </div>
          )}

          <div>
            <Label>Status</Label>
            <Select value={form.status} onValueChange={v => set('status', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="submitted">Submitted</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Notes</Label>
            <Textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={2} placeholder="Any additional notes..." />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => onSave({ ...form, pay_period_id: payPeriodId })}>
            {entry ? 'Save Changes' : 'Add Entry'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}