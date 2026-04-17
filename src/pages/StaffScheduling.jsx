import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Calendar, Users, Send, Loader2 } from 'lucide-react';
import { format, addDays } from 'date-fns';

export default function StaffScheduling() {
  const [weekStart, setWeekStart] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [generating, setGenerating] = useState(false);
  const [notifying, setNotifying] = useState(false);

  const queryClient = useQueryClient();
  const weekEnd = format(addDays(new Date(weekStart), 6), 'yyyy-MM-dd');

  const { data: jobs = [] } = useQuery({
    queryKey: ['jobs', weekStart, weekEnd],
    queryFn: () => base44.entities.Job.filter({
      scheduled_date: { $gte: weekStart, $lte: weekEnd }
    })
  });

  const { data: holidays = [] } = useQuery({
    queryKey: ['holidays', weekStart, weekEnd],
    queryFn: () => base44.entities.HolidayRequest.filter({ status: 'approved' })
  });

  const { data: staff = [] } = useQuery({
    queryKey: ['staff'],
    queryFn: () => base44.entities.StaffMember.filter({ status: 'active' })
  });

  const handleGenerateSchedule = async () => {
    setGenerating(true);
    try {
      await base44.functions.invoke('autoScheduleStaff', {
        start_date: weekStart,
        end_date: weekEnd
      });
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
    } catch (error) {
      console.error('Schedule generation failed:', error);
    } finally {
      setGenerating(false);
    }
  };

  const handleNotifyStaff = async () => {
    setNotifying(true);
    try {
      await base44.functions.invoke('notifyScheduleUpdates', {
        start_date: weekStart,
        end_date: weekEnd
      });
      alert('Notifications sent to all staff');
    } catch (error) {
      console.error('Notification failed:', error);
    } finally {
      setNotifying(false);
    }
  };

  const assignedJobs = jobs.filter(j => j.assigned_to);
  const unassignedJobs = jobs.filter(j => !j.assigned_to);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold">Staff Scheduling</h1>
          <p className="text-muted-foreground mt-1">Auto-assign shifts based on availability and skills</p>
        </div>
      </div>

      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Schedule Week
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Week Starting</label>
              <Input
                type="date"
                value={weekStart}
                onChange={(e) => setWeekStart(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Week Ending</label>
              <Input type="date" value={weekEnd} disabled />
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={handleGenerateSchedule}
              disabled={generating}
              className="gap-2"
            >
              {generating && <Loader2 className="w-4 h-4 animate-spin" />}
              Generate Schedule
            </Button>
            <Button
              onClick={handleNotifyStaff}
              disabled={notifying}
              variant="outline"
              className="gap-2"
            >
              {notifying && <Loader2 className="w-4 h-4 animate-spin" />}
              <Send className="w-4 h-4" />
              Notify Staff
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">{assignedJobs.length}</div>
              <p className="text-sm text-muted-foreground mt-1">Assigned Jobs</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600">{unassignedJobs.length}</div>
              <p className="text-sm text-muted-foreground mt-1">Unassigned Jobs</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">{staff.length}</div>
              <p className="text-sm text-muted-foreground mt-1">Active Staff</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Holiday Requests */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Approved Holidays
          </CardTitle>
        </CardHeader>
        <CardContent>
          {holidays.length === 0 ? (
            <p className="text-sm text-muted-foreground">No approved holidays</p>
          ) : (
            <div className="space-y-2">
              {holidays.map((h) => (
                <div key={h.id} className="flex justify-between items-center p-3 bg-muted rounded-lg">
                  <div>
                    <p className="font-medium">{h.staff_name}</p>
                    <p className="text-xs text-muted-foreground">{h.start_date} to {h.end_date}</p>
                  </div>
                  <Badge>{h.reason}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Jobs Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Jobs Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {jobs.map((job) => (
              <div key={job.id} className="flex justify-between items-center p-3 bg-muted rounded-lg">
                <div>
                  <p className="font-medium">{job.title}</p>
                  <p className="text-xs text-muted-foreground">{job.scheduled_date} · {job.client_name}</p>
                </div>
                <Badge variant={job.assigned_to ? 'default' : 'outline'}>
                  {job.assigned_to || 'Unassigned'}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}