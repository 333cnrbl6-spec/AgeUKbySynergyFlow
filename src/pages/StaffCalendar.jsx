import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronLeft, ChevronRight, Users, Clock, MapPin, AlertCircle } from 'lucide-react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, parse } from 'date-fns';

export default function StaffCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedStaff, setSelectedStaff] = useState('all');
  const [viewMode, setViewMode] = useState('month');
  const queryClient = useQueryClient();

  // Fetch data
  const { data: jobs = [] } = useQuery({
    queryKey: ['jobs'],
    queryFn: () => base44.entities.Job.list(),
  });

  const { data: bookings = [] } = useQuery({
    queryKey: ['clientBookings'],
    queryFn: () => base44.entities.ClientBooking.list?.() || [],
  });

  const { data: staff = [] } = useQuery({
    queryKey: ['staff'],
    queryFn: () => base44.entities.StaffMember.list?.() || [],
  });

  const { data: workSchedules = [] } = useQuery({
    queryKey: ['workSchedules'],
    queryFn: () => base44.entities.WorkSchedule.list?.() || [],
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list(),
  });

  // Update job scheduled date
  const updateJobMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Job.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
    },
  });

  // Get calendar days
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Group events by staff and date
  const eventsByStaffAndDate = useMemo(() => {
    const grouped = {};

    // Initialize staff
    staff.forEach(s => {
      grouped[s.id] = {};
    });

    // Add jobs
    jobs.forEach(job => {
      if (job.assigned_to && job.scheduled_date) {
        const staffMember = staff.find(s => s.name === job.assigned_to);
        if (staffMember) {
          const dateKey = job.scheduled_date;
          if (!grouped[staffMember.id][dateKey]) {
            grouped[staffMember.id][dateKey] = [];
          }
          grouped[staffMember.id][dateKey].push({
            id: job.id,
            type: 'job',
            title: job.title,
            time: job.scheduled_time || 'All day',
            status: job.status,
            client: clients.find(c => c.id === job.client_id)?.first_name || 'Unknown',
            color: 'bg-blue-100 border-blue-300',
            icon: '🔧'
          });
        }
      }
    });

    // Add bookings
    bookings.forEach(booking => {
      if (booking.scheduled_date) {
        const dateKey = booking.scheduled_date;
        // Add to all staff for visibility
        staff.forEach(s => {
          if (!grouped[s.id][dateKey]) {
            grouped[s.id][dateKey] = [];
          }
          grouped[s.id][dateKey].push({
            id: booking.id,
            type: 'booking',
            title: booking.activity_name,
            time: booking.start_time || 'All day',
            client: booking.client_name,
            color: 'bg-green-100 border-green-300',
            icon: '📅'
          });
        });
      }
    });

    return grouped;
  }, [jobs, bookings, staff, clients]);

  // Get availability for each staff member
  const staffAvailability = useMemo(() => {
    const availability = {};
    
    staff.forEach(s => {
      const staffSchedules = workSchedules.filter(ws => ws.staff_id === s.id);
      const eventCount = Object.values(eventsByStaffAndDate[s.id] || {})
        .reduce((sum, events) => sum + events.length, 0);
      
      availability[s.id] = {
        name: s.name,
        role: s.role,
        status: s.status,
        eventCount,
        schedules: staffSchedules.length,
        available: eventCount < 5 // Simple availability metric
      };
    });

    return availability;
  }, [staff, eventsByStaffAndDate, workSchedules]);

  const handleDragEnd = (result) => {
    const { source, destination, draggableId } = result;
    
    if (!destination) return;

    const sourceDate = source.droppableId;
    const destDate = destination.droppableId;

    if (sourceDate === destDate) return;

    // Find the event being dragged
    const sourceEvents = eventsByStaffAndDate[selectedStaff]?.[sourceDate] || [];
    const [draggedEvent] = sourceEvents.splice(source.index, 1);

    if (draggedEvent.type === 'job') {
      updateJobMutation.mutate({
        id: draggedEvent.id,
        data: { scheduled_date: destDate }
      });
    }
  };

  const filteredStaffEvents = selectedStaff === 'all' 
    ? eventsByStaffAndDate 
    : { [selectedStaff]: eventsByStaffAndDate[selectedStaff] };

  const getStatusColor = (status) => {
    const colors = {
      'scheduled': 'bg-blue-100 text-blue-800',
      'in_progress': 'bg-yellow-100 text-yellow-800',
      'completed': 'bg-green-100 text-green-800',
      'confirmed': 'bg-purple-100 text-purple-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Staff Calendar</h1>
            <p className="text-muted-foreground mt-1">Manage handyperson visits, befriending sessions, and activities</p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => setCurrentDate(subMonths(currentDate, 1))}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="font-semibold min-w-48 text-center">{format(currentDate, 'MMMM yyyy')}</span>
            <Button variant="outline" size="icon" onClick={() => setCurrentDate(addMonths(currentDate, 1))}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          <Select value={selectedStaff} onValueChange={setSelectedStaff}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by staff" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Staff</SelectItem>
              {staff.map(s => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name} ({s.role})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Staff Availability Cards */}
        {selectedStaff === 'all' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {staff.map(s => {
              const avail = staffAvailability[s.id];
              return (
                <Card key={s.id} className={avail.available ? 'border-green-200' : 'border-amber-200'}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">{s.name}</CardTitle>
                    <CardDescription className="text-xs">{s.role}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Tasks</span>
                      <span className="font-bold">{avail.eventCount}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {avail.available ? (
                        <Badge className="bg-green-100 text-green-800">Available</Badge>
                      ) : (
                        <Badge className="bg-amber-100 text-amber-800">Busy</Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Calendar Grid */}
        <div className="bg-card rounded-lg border">
          {/* Day headers */}
          <div className="grid grid-cols-7 border-b">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="p-3 text-center font-semibold text-sm border-r last:border-r-0">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar days */}
          <DragDropContext onDragEnd={handleDragEnd}>
            <div className="grid grid-cols-7">
              {daysInMonth.map(day => {
                const dateStr = format(day, 'yyyy-MM-dd');
                const isCurrentMonth = isSameDay(day, currentDate) || 
                  (day >= monthStart && day <= monthEnd);

                return (
                  <div
                    key={dateStr}
                    className="min-h-40 border-r border-b last:border-r-0 p-2 bg-background hover:bg-muted/50 transition-colors"
                  >
                    <div className="font-semibold text-sm mb-2">{format(day, 'd')}</div>

                    {/* Events for selected staff */}
                    {selectedStaff === 'all' ? (
                      // Show summary for all staff
                      <div className="space-y-1 text-xs">
                        {Object.entries(filteredStaffEvents).map(([staffId, dates]) => {
                          const events = dates[dateStr] || [];
                          return events.length > 0 && (
                            <div key={staffId} className="text-muted-foreground">
                              <span className="font-medium">{staffAvailability[staffId]?.name}:</span>
                              <span className="text-xs"> {events.length} task{events.length !== 1 ? 's' : ''}</span>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      // Draggable events for specific staff
                      <Droppable droppableId={dateStr}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            className={`space-y-1 ${snapshot.isDraggingOver ? 'bg-primary/10 rounded p-1' : ''}`}
                          >
                            {(filteredStaffEvents[selectedStaff]?.[dateStr] || []).map((event, index) => (
                              <Draggable key={event.id} draggableId={event.id} index={index}>
                                {(provided, snapshot) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    className={`p-1.5 rounded text-xs border cursor-move ${event.color} ${
                                      snapshot.isDragging ? 'opacity-50 shadow-lg' : ''
                                    }`}
                                  >
                                    <div className="font-semibold truncate">{event.title}</div>
                                    <div className="text-xs opacity-75">{event.time}</div>
                                    {event.client && (
                                      <div className="text-xs opacity-75">👤 {event.client}</div>
                                    )}
                                    {event.status && (
                                      <Badge className={`text-xs mt-1 ${getStatusColor(event.status)}`}>
                                        {event.status}
                                      </Badge>
                                    )}
                                  </div>
                                )}
                              </Draggable>
                            ))}
                            {provided.placeholder}
                          </div>
                        )}
                      </Droppable>
                    )}
                  </div>
                );
              })}
            </div>
          </DragDropContext>
        </div>

        {/* Legend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Legend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-blue-100 border border-blue-300 rounded"></div>
                <span>Handyperson Job</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-green-100 border border-green-300 rounded"></div>
                <span>Activity/Booking</span>
              </div>
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                <span>Staff busy (5+ tasks)</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}