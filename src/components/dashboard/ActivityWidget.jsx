import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, FileUp, CheckCircle, AlertCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function ActivityWidget() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const logs = await base44.entities.AuditLog.list('-timestamp', 20);
        setActivities(logs);
      } catch (error) {
        console.error('Failed to fetch audit logs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();

    // Subscribe to real-time updates on AuditLog
    const unsubscribe = base44.entities.AuditLog.subscribe((event) => {
      if (event.type === 'create') {
        setActivities(prev => [event.data, ...prev].slice(0, 20));
      }
    });

    return unsubscribe;
  }, []);

  const getIcon = (action) => {
    switch (action) {
      case 'file_uploaded':
        return <FileUp className="w-4 h-4 text-blue-600" />;
      case 'updated':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'created':
        return <AlertCircle className="w-4 h-4 text-purple-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getBadgeVariant = (action) => {
    const variants = {
      file_uploaded: 'bg-blue-100 text-blue-800',
      updated: 'bg-green-100 text-green-800',
      created: 'bg-purple-100 text-purple-800',
      deleted: 'bg-red-100 text-red-800'
    };
    return variants[action] || 'bg-gray-100 text-gray-800';
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading activities...</p>
        ) : activities.length === 0 ? (
          <p className="text-sm text-muted-foreground">No recent activities</p>
        ) : (
          <div className="space-y-3">
            {activities.map((activity) => (
              <div key={activity.id} className="flex gap-3 pb-3 border-b last:border-b-0">
                <div className="mt-1">{getIcon(activity.action)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium truncate">
                        {activity.entity_type} {activity.action}
                      </p>
                      {activity.changes && (
                        <p className="text-xs text-muted-foreground truncate">
                          {activity.changes}
                        </p>
                      )}
                    </div>
                    <Badge className={`text-xs whitespace-nowrap ${getBadgeVariant(activity.action)}`}>
                      {activity.action}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-xs text-muted-foreground">
                      {activity.changed_by}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}