import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertCircle, Zap, CheckCircle2, AlertTriangle, Mail, Phone } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';

export default function VolunteerMatchingPanel({ jobId, jobType, clientName, clientLocation }) {
  const [matches, setMatches] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (jobId) {
      loadMatches();
    }
  }, [jobId]);

  const loadMatches = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await base44.functions.invoke('matchVolunteersForJob', { job_id: jobId });
      setMatches(result.data);
    } catch (err) {
      setError(err.message || 'Failed to load volunteer matches');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Zap className="w-4 h-4" /> Smart Volunteer Matching
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!matches) return null;

  const getScoreBadgeClass = (score) => {
    if (score >= 80) return 'bg-green-100 text-green-800';
    if (score >= 60) return 'bg-blue-100 text-blue-800';
    if (score >= 40) return 'bg-yellow-100 text-yellow-800';
    return 'bg-orange-100 text-orange-800';
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary" /> Recommended Volunteers
          </CardTitle>
          <Button size="sm" variant="outline" onClick={loadMatches}>Refresh</Button>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {matches.total_volunteers} active volunteers available · {matches.top_matches.length} strong matches found
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {matches.matches.length === 0 ? (
          <Alert className="bg-amber-50 border-amber-200">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800">No volunteers available for this job.</AlertDescription>
          </Alert>
        ) : (
          <>
            {/* Top 3 Matches */}
            <div className="space-y-2">
              {matches.matches.slice(0, 3).map((volunteer, idx) => (
                <div key={volunteer.volunteer_id} className="border rounded-lg p-3 hover:bg-muted/50 transition-colors">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{volunteer.name}</span>
                        <Badge className={getScoreBadgeClass(volunteer.score)} variant="secondary">
                          {volunteer.score}%
                        </Badge>
                      </div>
                      {volunteer.dbs_valid && (
                        <div className="flex items-center gap-1 text-xs text-green-700 mt-1">
                          <CheckCircle2 className="w-3 h-3" /> Valid DBS check
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {volunteer.phone && (
                        <a href={`tel:${volunteer.phone}`} className="text-xs text-primary hover:underline flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                        </a>
                      )}
                      {volunteer.email && (
                        <a href={`mailto:${volunteer.email}`} className="text-xs text-primary hover:underline flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                  
                  {/* Match Reasons */}
                  <div className="flex flex-wrap gap-1">
                    {volunteer.reasons.map((reason, i) => (
                      <Badge key={i} variant="outline" className="text-xs bg-blue-50">
                        {reason}
                      </Badge>
                    ))}
                  </div>

                  {volunteer.notes && (
                    <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{volunteer.notes}</p>
                  )}
                </div>
              ))}
            </div>

            {/* Show more link */}
            {matches.matches.length > 3 && (
              <button className="text-xs text-primary hover:underline w-full text-center py-2">
                Show all {matches.matches.length} matches
              </button>
            )}

            {/* Match Confidence */}
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-900">
              <p className="font-semibold mb-1">How we matched these volunteers:</p>
              <ul className="space-y-1">
                <li>• Skills relevant to {jobType?.replace(/_/g, ' ')}</li>
                <li>• Location proximity to {clientLocation || 'client location'}</li>
                <li>• Valid DBS checks and availability</li>
                <li>• Service type preferences</li>
              </ul>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}