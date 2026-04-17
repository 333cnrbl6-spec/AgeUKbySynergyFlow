import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, TrendingUp, Clock, MapPin, Zap } from 'lucide-react';
import VolunteerEngagementWidget from '../components/volunteers/VolunteerEngagementWidget';
import OpportunitySummaryModal from '../components/volunteers/OpportunitySummaryModal';

const engagementColors = {
  high: 'bg-green-100 text-green-800',
  medium: 'bg-blue-100 text-blue-800',
  low: 'bg-amber-100 text-amber-800',
  at_risk: 'bg-red-100 text-red-800'
};

export default function Volunteers() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedVolunteer, setSelectedVolunteer] = useState(null);
  const [summaryOpen, setSummaryOpen] = useState(false);

  const { data: volunteers = [] } = useQuery({
    queryKey: ['volunteers'],
    queryFn: () => base44.entities.Volunteer.list('-last_activity_date', 200)
  });

  const { data: jobs = [] } = useQuery({
    queryKey: ['jobs'],
    queryFn: () => base44.entities.Job.list('-created_date', 100)
  });

  const filtered = volunteers.filter(v => {
    const matchSearch = `${v.name} ${v.location}`.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || v.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleViewEngagement = (volunteer) => {
    setSelectedVolunteer(volunteer);
  };

  const handleSendOpportunity = (volunteer, job) => {
    setSelectedVolunteer(volunteer);
    setSummaryOpen(true);
  };

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold">Volunteers</h1>
          <p className="text-sm text-muted-foreground">{volunteers.length} total volunteers</p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" /> Add Volunteer
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search volunteers..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="dormant">Dormant</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Volunteers Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filtered.map(volunteer => (
          <Card key={volunteer.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{volunteer.name}</CardTitle>
                  <div className="flex gap-2 mt-2 flex-wrap">
                    <Badge variant="outline">{volunteer.location}</Badge>
                    <Badge className={engagementColors[volunteer.engagement_score > 70 ? 'high' : volunteer.engagement_score > 40 ? 'medium' : 'low']}>
                      {volunteer.engagement_score}% engaged
                    </Badge>
                    <Badge variant={volunteer.status === 'active' ? 'default' : 'secondary'}>
                      {volunteer.status}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Stats */}
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Zap className="w-3 h-3 text-primary" />
                    <span className="text-lg font-semibold">{volunteer.jobs_completed}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Jobs</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Clock className="w-3 h-3 text-blue-600" />
                    <span className="text-lg font-semibold">{volunteer.hours_volunteered}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Hours</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <TrendingUp className="w-3 h-3 text-green-600" />
                    <span className="text-lg font-semibold">{volunteer.experience_level}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Level</p>
                </div>
              </div>

              {/* Skills */}
              {volunteer.skills && volunteer.skills.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-1">SKILLS</p>
                  <div className="flex flex-wrap gap-1">
                    {volunteer.skills.slice(0, 3).map((skill, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">{skill}</Badge>
                    ))}
                    {volunteer.skills.length > 3 && (
                      <Badge variant="outline" className="text-xs">+{volunteer.skills.length - 3}</Badge>
                    )}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  onClick={() => handleViewEngagement(volunteer)}
                >
                  View Insights
                </Button>
                <Button
                  size="sm"
                  className="flex-1"
                  onClick={() => handleSendOpportunity(volunteer, jobs[0])}
                  disabled={jobs.length === 0}
                >
                  Send Opportunity
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          {search || statusFilter !== 'all' ? 'No volunteers match your filters' : 'No volunteers yet'}
        </div>
      )}

      {/* Engagement Widget Modal */}
      {selectedVolunteer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 hidden sm:flex">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader className="flex items-center justify-between">
              <CardTitle>{selectedVolunteer.name}</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedVolunteer(null)}
              >
                ✕
              </Button>
            </CardHeader>
            <CardContent>
              <VolunteerEngagementWidget
                volunteerId={selectedVolunteer.id}
                volunteerName={selectedVolunteer.name}
              />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Opportunity Summary Modal */}
      {selectedVolunteer && jobs.length > 0 && (
        <OpportunitySummaryModal
          isOpen={summaryOpen}
          onOpenChange={setSummaryOpen}
          volunteerId={selectedVolunteer.id}
          volunteerName={selectedVolunteer.name}
          jobId={jobs[0].id}
          jobTitle={jobs[0].title}
        />
      )}
    </div>
  );
}