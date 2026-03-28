import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { CheckCircle2, XCircle, Clock, AlertCircle, Plus, Users } from 'lucide-react';

const statusConfig = {
  attended: { label: 'Attended', icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50' },
  no_show: { label: 'No Show', icon: XCircle, color: 'text-red-500', bg: 'bg-red-50' },
  cancelled: { label: 'Cancelled', icon: AlertCircle, color: 'text-amber-500', bg: 'bg-amber-50' },
  late: { label: 'Late', icon: Clock, color: 'text-blue-500', bg: 'bg-blue-50' },
};

export default function AttendanceSheet({ session, clients, onSave }) {
  const [attendees, setAttendees] = useState(session.attendees || []);
  const [search, setSearch] = useState('');
  const [showAddClient, setShowAddClient] = useState(false);

  const filteredClients = clients.filter(c => {
    const name = `${c.first_name} ${c.last_name}`.toLowerCase();
    return name.includes(search.toLowerCase()) && !attendees.find(a => a.client_id === c.id);
  });

  const addClient = (client) => {
    setAttendees(prev => [...prev, {
      client_id: client.id,
      client_name: `${client.first_name} ${client.last_name}`,
      attendance_status: 'attended',
      notes: '',
    }]);
    setSearch('');
    setShowAddClient(false);
  };

  const updateStatus = (clientId, status) => {
    setAttendees(prev => prev.map(a => a.client_id === clientId ? { ...a, attendance_status: status } : a));
  };

  const updateNotes = (clientId, notes) => {
    setAttendees(prev => prev.map(a => a.client_id === clientId ? { ...a, notes } : a));
  };

  const removeAttendee = (clientId) => {
    setAttendees(prev => prev.filter(a => a.client_id !== clientId));
  };

  const totalAttended = attendees.filter(a => a.attendance_status === 'attended' || a.attendance_status === 'late').length;

  const handleSave = () => {
    onSave({
      ...session,
      attendees,
      total_expected: attendees.length,
      total_attended: totalAttended,
      status: 'completed',
    });
  };

  return (
    <div className="mt-4 pt-4 border-t space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-muted-foreground" />
          <span className="font-medium text-sm">Attendance Register</span>
          <Badge className="bg-green-100 text-green-700">{totalAttended} attended</Badge>
        </div>
        <Button variant="outline" size="sm" onClick={() => setShowAddClient(!showAddClient)} className="gap-1">
          <Plus className="w-3.5 h-3.5" /> Add Client
        </Button>
      </div>

      {/* Add client search */}
      {showAddClient && (
        <div className="relative">
          <Input
            placeholder="Search clients to add..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            autoFocus
          />
          {search && filteredClients.length > 0 && (
            <div className="absolute top-full left-0 right-0 bg-white border rounded-md shadow-lg z-10 max-h-48 overflow-y-auto mt-1">
              {filteredClients.slice(0, 8).map(client => (
                <button
                  key={client.id}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors"
                  onClick={() => addClient(client)}
                >
                  {client.first_name} {client.last_name}
                  {client.town && <span className="text-muted-foreground ml-2">· {client.town}</span>}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Attendees */}
      {attendees.length === 0 ? (
        <p className="text-sm text-muted-foreground italic text-center py-3">No clients added yet. Click "Add Client" to start the register.</p>
      ) : (
        <div className="space-y-2">
          {attendees.map(attendee => {
            const cfg = statusConfig[attendee.attendance_status] || statusConfig.attended;
            const Icon = cfg.icon;
            return (
              <div key={attendee.client_id} className={`flex flex-col sm:flex-row sm:items-center gap-2 p-3 rounded-lg ${cfg.bg}`}>
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <Icon className={`w-4 h-4 flex-shrink-0 ${cfg.color}`} />
                  <span className="font-medium text-sm truncate">{attendee.client_name}</span>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Select value={attendee.attendance_status} onValueChange={v => updateStatus(attendee.client_id, v)}>
                    <SelectTrigger className="h-7 w-32 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="attended">Attended</SelectItem>
                      <SelectItem value="late">Late</SelectItem>
                      <SelectItem value="no_show">No Show</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    className="h-7 text-xs w-36"
                    placeholder="Notes..."
                    value={attendee.notes || ''}
                    onChange={e => updateNotes(attendee.client_id, e.target.value)}
                  />
                  <button
                    onClick={() => removeAttendee(attendee.client_id)}
                    className="text-muted-foreground hover:text-destructive text-xs px-1"
                  >✕</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="flex justify-end gap-2 pt-2">
        <Button size="sm" onClick={handleSave} className="gap-1">
          <CheckCircle2 className="w-3.5 h-3.5" />
          Save & Mark Completed
        </Button>
      </div>
    </div>
  );
}