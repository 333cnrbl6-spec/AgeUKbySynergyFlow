import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Brain, Users } from 'lucide-react';

export default function DementiaSupportWidget() {
  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list(),
  });

  const dementiaClients = clients.filter(c => c.dementia_related && c.status === 'active');
  const { data: musicInMindBookings = [] } = useQuery({
    queryKey: ['room-bookings'],
    queryFn: () => base44.entities.RoomBooking.filter({ activity_name: 'Music in Mind – Dementia Music Session' }),
  });

  return (
    <Card className="bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-600" />
            Dementia Support
          </CardTitle>
          <Badge variant="outline" className="bg-purple-100 text-purple-700 border-purple-300">
            Active Partnership
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-lg p-3 border border-purple-100">
            <p className="text-sm text-muted-foreground">Dementia Clients</p>
            <p className="text-2xl font-bold text-purple-600">{dementiaClients.length}</p>
          </div>
          <div className="bg-white rounded-lg p-3 border border-blue-100">
            <p className="text-sm text-muted-foreground">Music in Mind</p>
            <p className="text-2xl font-bold text-blue-600">Weekly</p>
          </div>
        </div>
        
        <div className="bg-white rounded-lg p-3 border border-purple-100 text-sm space-y-2">
          <p className="font-semibold text-purple-900 flex items-center gap-2">
            <Users className="w-4 h-4" />
            Alzheimer's Society Partnership
          </p>
          <p className="text-xs text-muted-foreground">
            Joint referral pathway active. Music in Mind sessions Tuesdays 14:30-15:45 (free).
          </p>
        </div>
      </CardContent>
    </Card>
  );
}