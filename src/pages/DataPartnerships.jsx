import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Mail, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { toast } from 'sonner';

const statusConfig = {
  not_started: { badge: 'bg-slate-100 text-slate-700', label: 'Not Started', color: 'text-slate-600' },
  in_progress: { badge: 'bg-blue-100 text-blue-700', label: 'In Progress', color: 'text-blue-600' },
  pending_response: { badge: 'bg-amber-100 text-amber-700', label: 'Awaiting Response', color: 'text-amber-600' },
  agreement_drafted: { badge: 'bg-purple-100 text-purple-700', label: 'Agreement Drafted', color: 'text-purple-600' },
  active: { badge: 'bg-green-100 text-green-700', label: 'Active', color: 'text-green-600' },
  completed: { badge: 'bg-emerald-100 text-emerald-700', label: 'Completed', color: 'text-emerald-600' },
};

const priorityConfig = {
  immediate: { badge: 'bg-red-100 text-red-700', label: 'Immediate', order: 1 },
  'medium-term': { badge: 'bg-amber-100 text-amber-700', label: 'Medium-term', order: 2 },
  ongoing: { badge: 'bg-blue-100 text-blue-700', label: 'Ongoing', order: 3 },
};

const dataSourceLabels = {
  bolton_council_asc: 'Bolton Council ASC',
  nhs_bolton_icb: 'NHS Bolton ICB',
  gp_patient_data: 'GP Patient Data',
  data_broker: 'Data Broker',
  council_housing: 'Council Housing',
  electoral_roll: 'Electoral Roll',
  community_networks: 'Community Networks',
};

export default function DataPartnerships() {
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [search, setSearch] = useState('');
  const qc = useQueryClient();

  const { data: tasks = [] } = useQuery({
    queryKey: ['dataPartnershipTasks'],
    queryFn: () => base44.entities.DataPartnershipTask.list('-created_date', 100),
  });

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.DataPartnershipTask.update(data.id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['dataPartnershipTasks'] });
      toast.success('Task updated');
    },
  });

  const filtered = tasks
    .filter(t => !filterStatus || t.status === filterStatus)
    .filter(t => !filterPriority || t.priority === filterPriority)
    .filter(t => !search || 
      t.partner_name.toLowerCase().includes(search.toLowerCase()) ||
      t.title.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      const priorityOrder = { immediate: 0, 'medium-term': 1, ongoing: 2 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      const statusOrder = ['not_started', 'in_progress', 'pending_response', 'agreement_drafted', 'active', 'completed'];
      return statusOrder.indexOf(a.status) - statusOrder.indexOf(b.status);
    });

  const stats = {
    total: tasks.length,
    active: tasks.filter(t => t.status === 'active').length,
    inProgress: tasks.filter(t => ['in_progress', 'pending_response', 'agreement_drafted'].includes(t.status)).length,
    notStarted: tasks.filter(t => t.status === 'not_started').length,
  };

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold">Data Partnership Tasks</h1>
          <p className="text-sm text-muted-foreground">
            {stats.active} active • {stats.inProgress} in progress • {stats.notStarted} not started
          </p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-card p-4 rounded-lg border border-border">
          <p className="text-xs text-muted-foreground">Total Tasks</p>
          <p className="text-2xl font-bold">{stats.total}</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <p className="text-xs text-green-700">Active</p>
          <p className="text-2xl font-bold text-green-700">{stats.active}</p>
        </div>
        <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
          <p className="text-xs text-amber-700">In Progress</p>
          <p className="text-2xl font-bold text-amber-700">{stats.inProgress}</p>
        </div>
        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
          <p className="text-xs text-slate-700">Not Started</p>
          <p className="text-2xl font-bold text-slate-700">{stats.notStarted}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="flex-1 min-w-64">
          <Input
            placeholder="Search partner or task..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={filterPriority} onValueChange={setFilterPriority}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All Priorities" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={null}>All Priorities</SelectItem>
            <SelectItem value="immediate">Immediate</SelectItem>
            <SelectItem value="medium-term">Medium-term</SelectItem>
            <SelectItem value="ongoing">Ongoing</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={null}>All Status</SelectItem>
            <SelectItem value="not_started">Not Started</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="pending_response">Awaiting Response</SelectItem>
            <SelectItem value="agreement_drafted">Agreement Drafted</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Task list */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-card rounded-lg p-8 text-center text-muted-foreground">
            No partnership tasks match your filters
          </div>
        ) : (
          filtered.map(task => {
            const statusCfg = statusConfig[task.status];
            const priorityCfg = priorityConfig[task.priority];
            return (
              <Dialog key={task.id}>
                <DialogTrigger asChild>
                  <div className="bg-card rounded-lg p-4 border border-border hover:shadow-md transition-shadow cursor-pointer">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-base">{task.partner_name}</h3>
                          <Badge className={priorityCfg.badge}>{priorityCfg.label}</Badge>
                          <Badge className={statusCfg.badge}>{statusCfg.label}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{task.title}</p>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="outline">{dataSourceLabels[task.data_source]}</Badge>
                          {task.estimated_volume && (
                            <Badge variant="outline">{task.estimated_volume}/month</Badge>
                          )}
                          {task.estimated_cost && (
                            <Badge variant="outline">£{task.estimated_cost}/year</Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 items-end">
                        {task.key_contact_email && (
                          <a 
                            href={`mailto:${task.key_contact_email}`}
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                          >
                            <Mail className="w-3.5 h-3.5" />
                            {task.key_contact_name}
                          </a>
                        )}
                        <div className="text-xs text-muted-foreground text-right">
                          {task.action_items?.filter(a => a.completed).length || 0}/{task.action_items?.length || 0} tasks
                        </div>
                      </div>
                    </div>
                  </div>
                </DialogTrigger>

                {/* Detail dialog */}
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{task.partner_name}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    {/* Status update */}
                    <div>
                      <label className="text-sm font-medium">Status</label>
                      <Select 
                        value={task.status} 
                        onValueChange={(val) => updateMutation.mutate({ id: task.id, status: val })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="not_started">Not Started</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="pending_response">Awaiting Response</SelectItem>
                          <SelectItem value="agreement_drafted">Agreement Drafted</SelectItem>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Task info */}
                    <div className="space-y-3">
                      {task.description && (
                        <div>
                          <p className="text-sm font-medium mb-1">Description</p>
                          <p className="text-sm text-muted-foreground">{task.description}</p>
                        </div>
                      )}
                      {task.key_contact_name && (
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Contact</p>
                            <p className="text-sm">{task.key_contact_name}</p>
                            {task.key_contact_role && (
                              <p className="text-xs text-muted-foreground">{task.key_contact_role}</p>
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Email</p>
                            <a href={`mailto:${task.key_contact_email}`} className="text-sm text-primary hover:underline">
                              {task.key_contact_email}
                            </a>
                          </div>
                        </div>
                      )}
                      {task.estimated_volume || task.estimated_cost || task.expected_launch_date ? (
                        <div className="grid grid-cols-3 gap-4 p-3 bg-muted/30 rounded">
                          {task.estimated_volume && (
                            <div>
                              <p className="text-xs text-muted-foreground">Expected Volume</p>
                              <p className="text-sm font-semibold">{task.estimated_volume}</p>
                            </div>
                          )}
                          {task.estimated_cost ? (
                            <div>
                              <p className="text-xs text-muted-foreground">Annual Cost</p>
                              <p className="text-sm font-semibold">£{task.estimated_cost}</p>
                            </div>
                          ) : null}
                          {task.expected_launch_date && (
                            <div>
                              <p className="text-xs text-muted-foreground">Launch Target</p>
                              <p className="text-sm font-semibold">{new Date(task.expected_launch_date).toLocaleDateString()}</p>
                            </div>
                          )}
                        </div>
                      ) : null}
                    </div>

                    {/* Action items */}
                    {task.action_items?.length > 0 && (
                      <div>
                        <p className="text-sm font-medium mb-2">Action Items</p>
                        <div className="space-y-2">
                          {task.action_items.map((item, idx) => (
                            <div key={idx} className="flex items-start gap-2 p-2 bg-muted/30 rounded">
                              <input 
                                type="checkbox" 
                                checked={item.completed || false}
                                readOnly
                                className="mt-1"
                              />
                              <div className="flex-1">
                                <p className={`text-sm ${item.completed ? 'line-through text-muted-foreground' : ''}`}>
                                  {item.task}
                                </p>
                                {item.owner && (
                                  <p className="text-xs text-muted-foreground">{item.owner}</p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {task.notes && (
                      <div>
                        <p className="text-sm font-medium mb-1">Notes</p>
                        <p className="text-sm text-muted-foreground">{task.notes}</p>
                      </div>
                    )}
                  </div>
                </DialogContent>
              </Dialog>
            );
          })
        )}
      </div>
    </div>
  );
}