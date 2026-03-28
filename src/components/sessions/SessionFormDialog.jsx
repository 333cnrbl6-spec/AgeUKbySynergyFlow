import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

export default function SessionFormDialog({ session, clients, onSave, onClose }) {
  const [form, setForm] = useState({
    activity_name: '',
    session_date: '',
    session_start_time: '',
    session_end_time: '',
    facility_name: '',
    session_theme: '',
    session_notes: '',
    incidents: '',
    status: 'planned',
    attendees: [],
  });

  useEffect(() => {
    if (session) setForm({ ...form, ...session });
  }, [session]);

  const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    const expected = form.attendees?.length || 0;
    onSave({ ...form, total_expected: expected });
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{session ? 'Edit Session' : 'New Session'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Activity Name *</Label>
            <Input value={form.activity_name} onChange={e => set('activity_name', e.target.value)} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Date *</Label>
              <Input type="date" value={form.session_date} onChange={e => set('session_date', e.target.value)} required />
            </div>
            <div>
              <Label>Status</Label>
              <Select value={form.status} onValueChange={v => set('status', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="planned">Planned</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Start Time</Label>
              <Input type="time" value={form.session_start_time} onChange={e => set('session_start_time', e.target.value)} />
            </div>
            <div>
              <Label>End Time</Label>
              <Input type="time" value={form.session_end_time} onChange={e => set('session_end_time', e.target.value)} />
            </div>
          </div>
          <div>
            <Label>Venue / Facility</Label>
            <Input value={form.facility_name} onChange={e => set('facility_name', e.target.value)} placeholder="e.g. Jubilee Centre, Room 2" />
          </div>
          <div>
            <Label>Session Theme (optional)</Label>
            <Input value={form.session_theme} onChange={e => set('session_theme', e.target.value)} placeholder="e.g. Reminiscence, Crafts, Music" />
          </div>
          <div>
            <Label>Session Notes</Label>
            <Textarea value={form.session_notes} onChange={e => set('session_notes', e.target.value)} rows={2} placeholder="General notes about how the session went..." />
          </div>
          <div>
            <Label>Incidents / Safeguarding</Label>
            <Textarea value={form.incidents} onChange={e => set('incidents', e.target.value)} rows={2} placeholder="Note any incidents or safeguarding concerns here..." />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit">{session ? 'Save Changes' : 'Create Session'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}