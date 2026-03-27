import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, Calendar, User } from 'lucide-react';

export default function ReferralHistory({ referrals = [] }) {
  if (!referrals || referrals.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Referral History</CardTitle>
          <CardDescription>No referrals made yet</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            When services are recommended for this client, they will appear here.
          </p>
        </CardContent>
      </Card>
    );
  }

  const getServiceColor = (serviceType) => {
    const colors = {
      befriending: 'bg-pink-100 text-pink-800',
      day_centre: 'bg-blue-100 text-blue-800',
      activities: 'bg-green-100 text-green-800',
      home_help: 'bg-purple-100 text-purple-800',
      foot_care: 'bg-amber-100 text-amber-800',
      it_training: 'bg-cyan-100 text-cyan-800',
      health_referral: 'bg-red-100 text-red-800',
      other: 'bg-gray-100 text-gray-800'
    };
    return colors[serviceType] || colors.other;
  };

  const getStatusIcon = (status) => {
    const icons = {
      pending: '⏳',
      accepted: '✓',
      in_progress: '🔄',
      completed: '✅',
      declined: '✗',
      withdrawn: '⌫'
    };
    return icons[status] || '•';
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-gray-100 text-gray-800',
      accepted: 'bg-blue-100 text-blue-800',
      in_progress: 'bg-amber-100 text-amber-800',
      completed: 'bg-green-100 text-green-800',
      declined: 'bg-red-100 text-red-800',
      withdrawn: 'bg-gray-100 text-gray-800'
    };
    return colors[status] || colors.pending;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Referral History</CardTitle>
        <CardDescription>{referrals.length} referral{referrals.length !== 1 ? 's' : ''} on record</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {[...referrals].reverse().map((referral, idx) => (
            <div key={referral.id || idx} className="p-4 border rounded-lg hover:bg-muted/50 transition">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge className={getServiceColor(referral.service_type)}>
                      {referral.service_type.replace(/_/g, ' ')}
                    </Badge>
                    <Badge className={getStatusColor(referral.status)} variant="outline">
                      {getStatusIcon(referral.status)} {referral.status}
                    </Badge>
                  </div>
                  <p className="text-sm font-semibold text-foreground">{referral.trigger_event}</p>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  <span>{new Date(referral.referred_date).toLocaleDateString('en-GB')}</span>
                </div>

                {referral.referred_by && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <User className="w-4 h-4" />
                    <span>{referral.referred_by}</span>
                  </div>
                )}

                {referral.notes && (
                  <div className="p-2 bg-muted rounded text-sm text-foreground">
                    <p className="font-medium text-xs text-muted-foreground mb-1">Notes:</p>
                    {referral.notes}
                  </div>
                )}

                {referral.outcome && (
                  <div className="p-2 bg-green-50 border border-green-200 rounded text-sm text-green-900">
                    <p className="font-medium text-xs mb-1">Outcome:</p>
                    {referral.outcome}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}