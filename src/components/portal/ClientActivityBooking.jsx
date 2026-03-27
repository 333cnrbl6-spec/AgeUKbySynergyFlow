import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, MapPin, Clock, Users, CheckCircle2 } from 'lucide-react';

export default function ClientActivityBooking({ client }) {
  const [search, setSearch] = useState('');
  const [townFilter, setTownFilter] = useState('all');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const queryClient = useQueryClient();

  const { data: facilities = [] } = useQuery({
    queryKey: ['clientPortalFacilities'],
    queryFn: () => base44.entities.Facility.list()
  });

  const { data: activities = [] } = useQuery({
    queryKey: ['clientPortalActivities'],
    queryFn: () => base44.entities.Activity.list()
  });

  const { data: userBookings = [] } = useQuery({
    queryKey: ['clientUserBookings', client.id],
    queryFn: async () => {
      const bookings = await base44.entities.ClientBooking.list();
      return bookings.filter(b => b.client_id === client.id);
    }
  });

  const bookMutation = useMutation({
    mutationFn: async (activity) => {
      const booking = {
        client_id: client.id,
        client_name: `${client.first_name} ${client.last_name}`,
        activity_type: 'group_activity',
        activity_name: activity.name,
        facility_id: activity.facility_id,
        facility_name: activity.facility_name,
        scheduled_date: activity.date,
        start_time: activity.start_time,
        end_time: activity.end_time,
        booking_date: new Date().toISOString().split('T')[0],
        status: 'confirmed'
      };
      return base44.entities.ClientBooking.create(booking);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientUserBookings'] });
      setSelectedBooking(null);
    }
  });

  const filteredActivities = useMemo(() => {
    return activities.filter(activity => {
      const matchSearch = activity.name.toLowerCase().includes(search.toLowerCase());
      const matchTown = townFilter === 'all' || activity.town === townFilter;
      const upcomingDate = new Date(activity.date) > new Date();
      const notBooked = !userBookings.some(b => b.activity_name === activity.name && new Date(b.scheduled_date) > new Date());
      return matchSearch && matchTown && upcomingDate && notBooked;
    });
  }, [activities, search, townFilter, userBookings]);

  const towns = [...new Set(activities.map(a => a.town).filter(Boolean))];

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Find Activities</CardTitle>
          <CardDescription>Browse and book upcoming activities</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold block mb-2">Search Activity</label>
              <Input
                placeholder="Search by name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-semibold block mb-2">Location</label>
              <Select value={townFilter} onValueChange={setTownFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Locations</SelectItem>
                  {towns.map(town => (
                    <SelectItem key={town} value={town}>{town}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Activities List */}
      <div className="space-y-4">
        {filteredActivities.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <p>No activities available matching your filters.</p>
            </CardContent>
          </Card>
        ) : (
          filteredActivities.map(activity => (
            <Card key={activity.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div className="flex-1 space-y-3">
                    <h3 className="font-semibold text-lg">{activity.name}</h3>
                    
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        {new Date(activity.date).toLocaleDateString('en-GB', { 
                          weekday: 'short',
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        {activity.start_time} – {activity.end_time}
                      </div>
                      {activity.facility_name && (
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          {activity.facility_name}
                        </div>
                      )}
                      {activity.description && (
                        <p className="text-sm pt-2">{activity.description}</p>
                      )}
                    </div>

                    {activity.cost && (
                      <Badge variant="secondary">£{activity.cost}</Badge>
                    )}
                  </div>

                  <Button 
                    onClick={() => bookMutation.mutate(activity)}
                    disabled={bookMutation.isPending}
                    className="whitespace-nowrap"
                  >
                    Book Now
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Booking Confirmation */}
      {bookMutation.isSuccess && (
        <Card className="bg-green-50 border-green-200">
          <CardContent className="pt-6 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-green-900">Booking Confirmed!</p>
              <p className="text-sm text-green-800 mt-1">Your activity booking has been confirmed. You'll receive a reminder before the activity.</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}