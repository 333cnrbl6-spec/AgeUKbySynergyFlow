import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, MapPin, Users, Clock, Search } from 'lucide-react';
import { format, parseISO } from 'date-fns';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const DAY_COLORS = {
  Monday: 'bg-blue-50 border-blue-200',
  Tuesday: 'bg-purple-50 border-purple-200',
  Wednesday: 'bg-pink-50 border-pink-200',
  Thursday: 'bg-green-50 border-green-200',
  Friday: 'bg-yellow-50 border-yellow-200',
  Saturday: 'bg-orange-50 border-orange-200',
  Sunday: 'bg-red-50 border-red-200',
};

export default function Activities() {
  const [search, setSearch] = useState('');
  const [selectedDay, setSelectedDay] = useState('');
  const [selectedFacility, setSelectedFacility] = useState('');

  const { data: activities = [] } = useQuery({
    queryKey: ['activities'],
    queryFn: () => base44.entities.RoomBooking.filter({ recurring: true }),
  });

  const facilities = useMemo(() => [...new Set(activities.map(a => a.facility_name))], [activities]);

  const filtered = useMemo(() => {
    return activities.filter(a => {
      const matchSearch = a.activity_name.toLowerCase().includes(search.toLowerCase()) ||
                         a.facility_name.toLowerCase().includes(search.toLowerCase());
      const matchDay = !selectedDay || getDayName(a.date) === selectedDay;
      const matchFacility = !selectedFacility || a.facility_name === selectedFacility;
      return matchSearch && matchDay && matchFacility;
    });
  }, [activities, search, selectedDay, selectedFacility]);

  const grouped = useMemo(() => {
    const result = {};
    DAYS.forEach(day => result[day] = []);
    filtered.forEach(a => {
      const day = getDayName(a.date);
      if (result[day]) result[day].push(a);
    });
    return Object.entries(result).filter(([_, activities]) => activities.length > 0);
  }, [filtered]);

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-3xl font-heading font-bold">Activities & Timetable</h1>
        <p className="text-muted-foreground mt-1">{activities.length} weekly activities and sessions</p>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="flex-1 min-w-64">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search activities..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Select value={selectedDay} onValueChange={setSelectedDay}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="All Days" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={null}>All Days</SelectItem>
            {DAYS.map(day => <SelectItem key={day} value={day}>{day}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={selectedFacility} onValueChange={setSelectedFacility}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All Venues" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={null}>All Venues</SelectItem>
            {facilities.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Grouped by day */}
      <div className="space-y-6">
        {grouped.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No activities match your filters.
            </CardContent>
          </Card>
        ) : (
          grouped.map(([day, dayActivities]) => (
            <div key={day}>
              <h2 className="text-xl font-heading font-semibold mb-3">{day}</h2>
              <div className="space-y-3">
                {dayActivities.sort((a, b) => a.start_time.localeCompare(b.start_time)).map(a => (
                  <Card key={a.id} className={`border ${DAY_COLORS[day]}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">{a.activity_name}</h3>
                          <div className="flex flex-wrap gap-3 mt-2 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {a.start_time} - {a.end_time}
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              {a.facility_name}
                            </span>
                            {a.organiser_name && (
                              <span className="flex items-center gap-1">
                                <Users className="w-4 h-4" />
                                {a.organiser_name}
                              </span>
                            )}
                          </div>
                          {a.notes && (
                            <p className="text-sm text-muted-foreground mt-2 italic">{a.notes}</p>
                          )}
                        </div>
                        <div className="flex flex-col gap-2 items-end">
                          <Badge variant="outline" className="whitespace-nowrap">
                            {a.rate_type === 'free' ? 'Free' : `£${a.agreed_rate || 0}`}
                          </Badge>
                          {a.recurrence_pattern && (
                            <Badge variant="secondary" className="whitespace-nowrap text-xs">
                              {a.recurrence_pattern}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function getDayName(dateStr) {
  try {
    const date = parseISO(dateStr);
    return DAYS[date.getDay()];
  } catch {
    return '';
  }
}