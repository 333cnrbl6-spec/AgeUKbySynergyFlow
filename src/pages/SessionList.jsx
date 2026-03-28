import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, Users, CheckCircle2, XCircle, Clock, 
  Plus, ChevronDown, ChevronUp, ClipboardList, AlertTriangle
} from 'lucide-react';
import { format, isToday, isFuture, isPast } from 'date-fns';
import SessionFormDialog from '@/components/sessions/SessionFormDialog';
import AttendanceSheet from '@/components/sessions/AttendanceSheet';

const statusColors = {
  planned: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-yellow-100 text-yellow-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

export default function SessionList() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [showAttendance, setShowAttendance] = useState(null);
  const [filter, setFilter] = useState('upcoming');

  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ['sessions'],
    queryFn: () => base44.entities.SessionAttendance.list('-session_date', 100),
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.SessionAttendance.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['sessions'] }); setShowForm(false); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.SessionAttendance.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['sessions'] }); },
  });

  const isVolunteer = user?.role === 'activity_volunteer';

  const filteredSessions = useMemo(() => {
    let list = sessions;
    // Volunteers only see their own sessions
    if (isVolunteer && user?.email) {
      list = list.filter(s => s.created_by === user.email || s.volunteer_id === user.id);
    }
    if (filter === 'upcoming') return list.filter(s => isFuture(new Date(s.session_date)) || isToday(new Date(s.session_date)));
    if (filter === 'past') return list.filter(s => isPast(new Date(s.session_date)) && !isToday(new Date(s.session_date)));
    if (filter === 'today') return list.filter(s => isToday(new Date(s.session_date)));
    return list;
  }, [sessions, filter, isVolunteer, user]);

  const stats = useMemo(() => {
    const completed = sessions.filter(s => s.status === 'completed');
    const totalAttended = completed.reduce((sum, s) => sum + (s.total_attended || 0), 0);
    const totalExpected = completed.reduce((sum, s) => sum + (s.total_expected || 0), 0);
    return {
      upcoming: sessions.filter(s => isFuture(new Date(s.session_date)) || isToday(new Date(s.session_date))).length,
      completedCount: completed.length,
      attendanceRate: totalExpected > 0 ? Math.round((totalAttended / totalExpected) * 100) : 0,
      totalAttended,
    };
  }, [sessions]);

  const handleSaveSession = (data) => {
    const sessionData = {
      ...data,
      volunteer_name: user?.full_name || 'Unknown',
      volunteer_id: user?.id,
    };
    if (selectedSession) {
      updateMutation.mutate({ id: selectedSession.id, data: sessionData });
    } else {
      createMutation.mutate(sessionData);
    }
    setSelectedSession(null);
    setShowForm(false);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Session Register</h1>
          <p className="text-muted-foreground mt-1">Record attendance and notes for your activity sessions</p>
        </div>
        <Button onClick={() => { setSelectedSession(null); setShowForm(true); }} className="gap-2">
          <Plus className="w-4 h-4" />
          New Session
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Upcoming Sessions', value: stats.upcoming, icon: Calendar, color: 'text-blue-600' },
          { label: 'Sessions Completed', value: stats.completedCount, icon: CheckCircle2, color: 'text-green-600' },
          { label: 'Attendance Rate', value: `${stats.attendanceRate}%`, icon: Users, color: 'text-purple-600' },
          { label: 'Total Attendances', value: stats.totalAttended, icon: ClipboardList, color: 'text-amber-600' },
        ].map(stat => (
          <Card key={stat.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <stat.icon className={`w-8 h-8 ${stat.color}`} />
              <div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {['upcoming', 'today', 'past', 'all'].map(f => (
          <Button
            key={f}
            variant={filter === f ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter(f)}
            className="capitalize"
          >
            {f === 'all' ? 'All Sessions' : f === 'today' ? 'Today' : f.charAt(0).toUpperCase() + f.slice(1)}
          </Button>
        ))}
      </div>

      {/* Sessions List */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading sessions...</div>
      ) : filteredSessions.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <ClipboardList className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No sessions found. Create your first session to get started.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredSessions.map(session => (
            <Card key={session.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-foreground">{session.activity_name}</h3>
                      <Badge className={statusColors[session.status] || 'bg-gray-100 text-gray-700'}>
                        {session.status?.replace('_', ' ')}
                      </Badge>
                      {session.incidents && (
                        <Badge className="bg-red-100 text-red-700 gap-1">
                          <AlertTriangle className="w-3 h-3" /> Incident noted
                        </Badge>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-4 mt-2 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {format(new Date(session.session_date), 'EEE d MMM yyyy')}
                      </span>
                      {session.session_start_time && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {session.session_start_time}{session.session_end_time ? ` – ${session.session_end_time}` : ''}
                        </span>
                      )}
                      {session.facility_name && (
                        <span className="flex items-center gap-1">
                          📍 {session.facility_name}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" />
                        {session.total_attended ?? 0} / {session.total_expected ?? (session.attendees?.length ?? 0)} attended
                      </span>
                    </div>
                    {session.session_notes && (
                      <p className="text-sm text-muted-foreground mt-2 italic">"{session.session_notes}"</p>
                    )}
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowAttendance(showAttendance === session.id ? null : session.id)}
                      className="gap-1"
                    >
                      {showAttendance === session.id ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      Attendance
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => { setSelectedSession(session); setShowForm(true); }}
                    >
                      Edit
                    </Button>
                  </div>
                </div>

                {/* Inline Attendance Sheet */}
                {showAttendance === session.id && (
                  <AttendanceSheet
                    session={session}
                    clients={clients}
                    onSave={(updatedSession) => {
                      updateMutation.mutate({ id: session.id, data: updatedSession });
                      setShowAttendance(null);
                    }}
                  />
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {showForm && (
        <SessionFormDialog
          session={selectedSession}
          clients={clients}
          onSave={handleSaveSession}
          onClose={() => { setShowForm(false); setSelectedSession(null); }}
        />
      )}
    </div>
  );
}