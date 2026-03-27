import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle2, Clock, AlertCircle, Users, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const statusConfig = {
  not_started: { icon: AlertCircle, color: 'bg-slate-50 border-slate-200', badge: 'bg-slate-100 text-slate-700', label: 'Not Started' },
  in_progress: { icon: Clock, color: 'bg-blue-50 border-blue-200', badge: 'bg-blue-100 text-blue-700', label: 'In Progress' },
  pending_response: { icon: Clock, color: 'bg-amber-50 border-amber-200', badge: 'bg-amber-100 text-amber-700', label: 'Awaiting Response' },
  agreement_drafted: { icon: Clock, color: 'bg-purple-50 border-purple-200', badge: 'bg-purple-100 text-purple-700', label: 'Agreement Drafted' },
  active: { icon: CheckCircle2, color: 'bg-green-50 border-green-200', badge: 'bg-green-100 text-green-700', label: 'Active' },
  completed: { icon: CheckCircle2, color: 'bg-emerald-50 border-emerald-200', badge: 'bg-emerald-100 text-emerald-700', label: 'Completed' },
};

export default function DataPartnershipWidget() {
  const { data: tasks = [] } = useQuery({
    queryKey: ['dataPartnershipTasks'],
    queryFn: () => base44.entities.DataPartnershipTask.list('-created_date', 50),
  });

  const activeCount = tasks.filter(t => !['completed', 'active'].includes(t.status)).length;
  const completedCount = tasks.filter(t => t.status === 'active' || t.status === 'completed').length;
  const immediateCount = tasks.filter(t => t.priority === 'immediate' && t.status !== 'active').length;

  const immediateItems = tasks
    .filter(t => t.priority === 'immediate')
    .sort((a, b) => {
      const statusOrder = ['not_started', 'in_progress', 'pending_response', 'agreement_drafted', 'active', 'completed'];
      return statusOrder.indexOf(a.status) - statusOrder.indexOf(b.status);
    })
    .slice(0, 3);

  return (
    <div className="bg-card rounded-xl p-5 shadow-sm border border-border/50">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" />
          <h2 className="font-heading font-semibold text-lg">Data Partnerships</h2>
        </div>
        <Link to="/partnerships">
          <Button variant="outline" size="sm">
            <Plus className="w-3.5 h-3.5 mr-1" />
            Manage
          </Button>
        </Link>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-2 mb-4 pb-4 border-b border-border/50">
        <div className="text-center">
          <p className="text-xs text-muted-foreground">Active</p>
          <p className="text-2xl font-bold text-primary">{completedCount}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-muted-foreground">In Progress</p>
          <p className="text-2xl font-bold text-amber-600">{activeCount}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-muted-foreground">Immediate</p>
          <p className="text-2xl font-bold text-red-600">{immediateCount}</p>
        </div>
      </div>

      {/* Immediate priority items */}
      {immediateItems.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4">All partnership tasks on track!</p>
      ) : (
        <div className="space-y-2">
          {immediateItems.map(task => {
            const cfg = statusConfig[task.status];
            const StatusIcon = cfg?.icon || AlertCircle;
            return (
              <div key={task.id} className={`p-3 rounded-lg border ${cfg?.color}`}>
                <div className="flex items-start gap-2">
                  <StatusIcon className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-sm">{task.partner_name}</h3>
                    <p className="text-xs text-muted-foreground truncate">{task.title}</p>
                    <div className="flex gap-1 mt-1.5">
                      <Badge variant="outline" className={`text-xs ${cfg?.badge}`}>
                        {cfg?.label}
                      </Badge>
                      {task.estimated_volume && (
                        <Badge variant="outline" className="text-xs">
                          {task.estimated_volume}/month
                        </Badge>
                      )}
                    </div>
                  </div>
                  {task.key_contact_email && (
                    <a 
                      href={`mailto:${task.key_contact_email}`}
                      className="text-xs text-primary hover:underline flex-shrink-0 mt-1"
                      title={`Email: ${task.key_contact_name}`}
                    >
                      Contact
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Link to="/partnerships" className="block">
        <Button variant="ghost" className="w-full mt-3 text-xs">
          View all {tasks.length} partnership tasks →
        </Button>
      </Link>
    </div>
  );
}