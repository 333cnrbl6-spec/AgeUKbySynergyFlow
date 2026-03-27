import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Clock, AlertTriangle, CalendarDays, Download, CheckCircle2, XCircle, FileText } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { calcBradfordFactor, bradfordTrigger } from '@/utils/bradford';
import BradfordScoreCard from '@/components/timesheets/BradfordScoreCard';
import TimesheetEntryDialog from '@/components/timesheets/TimesheetEntryDialog';
import AbsenceFormDialog from '@/components/timesheets/AbsenceFormDialog';
import PayPeriodDialog from '@/components/timesheets/PayPeriodDialog';
import PayPeriodSelector from '@/components/timesheets/PayPeriodSelector';

const entryTypeColour = {
  work: 'bg-green-100 text-green-800',
  holiday: 'bg-blue-100 text-blue-800',
  sick: 'bg-red-100 text-red-800',
  bank_holiday: 'bg-purple-100 text-purple-800',
  toil: 'bg-yellow-100 text-yellow-800',
  compassionate_leave: 'bg-orange-100 text-orange-800',
  maternity_paternity: 'bg-pink-100 text-pink-800',
  unpaid_leave: 'bg-gray-100 text-gray-700',
  other_absence: 'bg-gray-100 text-gray-700',
};

const entryTypeLabel = {
  work: 'Work', holiday: 'Annual Leave', sick: 'Sick', bank_holiday: 'Bank Holiday',
  toil: 'TOIL', compassionate_leave: 'Compassionate', maternity_paternity: 'Mat/Pat',
  unpaid_leave: 'Unpaid', other_absence: 'Absence',
};

const statusColour = {
  draft: 'bg-gray-100 text-gray-600',
  submitted: 'bg-blue-100 text-blue-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
};

export default function Timesheets() {
  const qc = useQueryClient();
  const [selectedPeriod, setSelectedPeriod] = useState(null);
  const [selectedStaff, setSelectedStaff] = useState('all');
  const [showEntryDialog, setShowEntryDialog] = useState(false);
  const [showAbsenceDialog, setShowAbsenceDialog] = useState(false);
  const [showPeriodDialog, setShowPeriodDialog] = useState(false);
  const [editEntry, setEditEntry] = useState(null);
  const [editAbsence, setEditAbsence] = useState(null);
  const [bradfordStaff, setBradfordStaff] = useState(null);

  const { data: staff = [] } = useQuery({ queryKey: ['staff'], queryFn: () => base44.entities.StaffMember.list() });
  const { data: periods = [] } = useQuery({
    queryKey: ['payperiods'],
    queryFn: () => base44.entities.PayPeriod.list('-period_start', 24),
    onSuccess: (data) => { if (data.length && !selectedPeriod) setSelectedPeriod(data[0].id); }
  });
  const { data: entries = [] } = useQuery({
    queryKey: ['timesheets', selectedPeriod],
    queryFn: () => selectedPeriod
      ? base44.entities.TimesheetEntry.filter({ pay_period_id: selectedPeriod })
      : base44.entities.TimesheetEntry.list('-date', 100),
    enabled: true,
  });
  const { data: absences = [] } = useQuery({
    queryKey: ['absences'],
    queryFn: () => base44.entities.AbsenceRecord.list('-start_date', 200),
  });

  const createEntry = useMutation({
    mutationFn: d => base44.entities.TimesheetEntry.create(d),
    onSuccess: () => { qc.invalidateQueries(['timesheets']); setShowEntryDialog(false); setEditEntry(null); }
  });
  const updateEntry = useMutation({
    mutationFn: ({ id, ...d }) => base44.entities.TimesheetEntry.update(id, d),
    onSuccess: () => { qc.invalidateQueries(['timesheets']); setShowEntryDialog(false); setEditEntry(null); }
  });
  const createAbsence = useMutation({
    mutationFn: d => base44.entities.AbsenceRecord.create(d),
    onSuccess: () => { qc.invalidateQueries(['absences']); setShowAbsenceDialog(false); setEditAbsence(null); }
  });
  const updateAbsence = useMutation({
    mutationFn: ({ id, ...d }) => base44.entities.AbsenceRecord.update(id, d),
    onSuccess: () => { qc.invalidateQueries(['absences']); setShowAbsenceDialog(false); setEditAbsence(null); }
  });
  const createPeriod = useMutation({
    mutationFn: d => base44.entities.PayPeriod.create(d),
    onSuccess: (data) => { qc.invalidateQueries(['payperiods']); setShowPeriodDialog(false); setSelectedPeriod(data.id); }
  });

  const filteredEntries = selectedStaff === 'all' ? entries : entries.filter(e => e.staff_id === selectedStaff);
  const filteredAbsences = selectedStaff === 'all' ? absences : absences.filter(a => a.staff_id === selectedStaff);

  // Pay period summary
  const periodData = selectedPeriod ? periods.find(p => p.id === selectedPeriod) : null;
  const totalHours = filteredEntries.filter(e => e.entry_type === 'work').reduce((s, e) => s + (e.hours_worked || 0), 0);
  const totalGross = filteredEntries.filter(e => e.entry_type === 'work').reduce((s, e) => s + (e.gross_pay || 0), 0);
  const sickDays = filteredEntries.filter(e => e.entry_type === 'sick').length;
  const holidayDays = filteredEntries.filter(e => e.entry_type === 'holiday').length;
  const pendingApproval = filteredEntries.filter(e => e.status === 'submitted').length;

  // Bradford scores for all staff
  const staffWithBradford = staff.map(s => {
    const { B } = calcBradfordFactor(absences, s.id);
    const trigger = bradfordTrigger(B);
    return { ...s, bradford: B, trigger };
  }).sort((a, b) => b.bradford - a.bradford);

  // Absence alerts: fit notes outstanding
  const fitNoteAlerts = absences.filter(a => a.fit_note_required && !a.fit_note_received && a.status !== 'closed');
  const rtwAlerts = absences.filter(a => a.absence_type === 'sick' && a.status === 'closed' && !a.return_to_work_interview);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold">Timesheets & Absences</h1>
          <p className="text-muted-foreground text-sm">Pay periods, absence tracking and Bradford Factor monitoring</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={() => { setEditAbsence(null); setShowAbsenceDialog(true); }}>
            <AlertTriangle className="w-4 h-4 mr-1 text-red-500" /> Log Absence
          </Button>
          <Button size="sm" onClick={() => { setEditEntry(null); setShowEntryDialog(true); }}>
            <Plus className="w-4 h-4 mr-1" /> Add Entry
          </Button>
        </div>
      </div>

      {/* Alerts bar */}
      {(fitNoteAlerts.length > 0 || rtwAlerts.length > 0) && (
        <div className="flex flex-wrap gap-3">
          {fitNoteAlerts.length > 0 && (
            <div className="flex items-center gap-2 bg-orange-50 border border-orange-200 text-orange-800 rounded-lg px-3 py-2 text-sm">
              <FileText className="w-4 h-4" />
              <span><strong>{fitNoteAlerts.length}</strong> fit note{fitNoteAlerts.length > 1 ? 's' : ''} outstanding</span>
            </div>
          )}
          {rtwAlerts.length > 0 && (
            <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 text-blue-800 rounded-lg px-3 py-2 text-sm">
              <AlertTriangle className="w-4 h-4" />
              <span><strong>{rtwAlerts.length}</strong> return-to-work interview{rtwAlerts.length > 1 ? 's' : ''} outstanding</span>
            </div>
          )}
        </div>
      )}

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <PayPeriodSelector
          periods={periods}
          selected={selectedPeriod || ''}
          onSelect={setSelectedPeriod}
          onNew={() => setShowPeriodDialog(true)}
        />
        <Select value={selectedStaff} onValueChange={setSelectedStaff}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All Staff" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Staff</SelectItem>
            {staff.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: 'Total Hours', value: totalHours.toFixed(1), icon: Clock, colour: 'text-primary' },
          { label: 'Gross Pay', value: `£${totalGross.toFixed(2)}`, icon: CalendarDays, colour: 'text-green-600' },
          { label: 'Sick Days', value: sickDays, icon: AlertTriangle, colour: 'text-red-500' },
          { label: 'Holiday Days', value: holidayDays, icon: CalendarDays, colour: 'text-blue-500' },
          { label: 'Pending Approval', value: pendingApproval, icon: FileText, colour: 'text-orange-500' },
        ].map(({ label, value, icon: Icon, colour }) => (
          <Card key={label} className="text-center">
            <CardContent className="pt-4 pb-3">
              <Icon className={`w-5 h-5 mx-auto mb-1 ${colour}`} />
              <div className="text-xl font-bold font-heading">{value}</div>
              <div className="text-xs text-muted-foreground">{label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="entries">
        <TabsList>
          <TabsTrigger value="entries"><Clock className="w-4 h-4 mr-1" /> Timesheet Entries</TabsTrigger>
          <TabsTrigger value="absences"><AlertTriangle className="w-4 h-4 mr-1" /> Absence Records</TabsTrigger>
          <TabsTrigger value="bradford"><FileText className="w-4 h-4 mr-1" /> Bradford Factor</TabsTrigger>
        </TabsList>

        {/* Timesheet Entries Tab */}
        <TabsContent value="entries" className="mt-4">
          <Card>
            <CardContent className="p-0">
              {filteredEntries.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground">
                  <Clock className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p>No entries for this period. <button className="text-primary underline" onClick={() => setShowEntryDialog(true)}>Add one?</button></p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/40 border-b">
                      <tr className="text-xs text-muted-foreground uppercase tracking-wide">
                        <th className="text-left px-4 py-3">Date</th>
                        <th className="text-left px-4 py-3">Staff</th>
                        <th className="text-left px-4 py-3">Type</th>
                        <th className="text-right px-4 py-3">Hours</th>
                        <th className="text-right px-4 py-3">OT</th>
                        <th className="text-right px-4 py-3">Gross Pay</th>
                        <th className="text-left px-4 py-3">Status</th>
                        <th className="px-4 py-3"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredEntries.map(e => (
                        <tr key={e.id} className="border-b last:border-0 hover:bg-muted/20">
                          <td className="px-4 py-3 font-medium">{e.date ? format(parseISO(e.date), 'EEE dd MMM') : '—'}</td>
                          <td className="px-4 py-3">{e.staff_name}</td>
                          <td className="px-4 py-3">
                            <Badge className={`text-xs ${entryTypeColour[e.entry_type] || 'bg-gray-100'}`}>
                              {entryTypeLabel[e.entry_type] || e.entry_type}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-right">{e.entry_type === 'work' ? (e.hours_worked || 0).toFixed(2) : '—'}</td>
                          <td className="px-4 py-3 text-right text-orange-600">{e.overtime_hours > 0 ? `+${e.overtime_hours}` : '—'}</td>
                          <td className="px-4 py-3 text-right font-medium">{e.gross_pay > 0 ? `£${e.gross_pay.toFixed(2)}` : '—'}</td>
                          <td className="px-4 py-3">
                            <Badge className={`text-xs ${statusColour[e.status]}`}>{e.status}</Badge>
                          </td>
                          <td className="px-4 py-3">
                            <button className="text-xs text-primary underline" onClick={() => { setEditEntry(e); setShowEntryDialog(true); }}>Edit</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-muted/30 border-t font-semibold text-sm">
                      <tr>
                        <td colSpan={3} className="px-4 py-3">Totals</td>
                        <td className="px-4 py-3 text-right">{totalHours.toFixed(2)}</td>
                        <td className="px-4 py-3 text-right text-orange-600">
                          {filteredEntries.reduce((s,e) => s + (e.overtime_hours||0),0).toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-right text-green-700">£{totalGross.toFixed(2)}</td>
                        <td colSpan={2}></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Absence Records Tab */}
        <TabsContent value="absences" className="mt-4 space-y-4">
          <div className="flex justify-end">
            <Button size="sm" variant="outline" onClick={() => { setEditAbsence(null); setShowAbsenceDialog(true); }}>
              <Plus className="w-4 h-4 mr-1" /> Log Absence
            </Button>
          </div>
          <Card>
            <CardContent className="p-0">
              {filteredAbsences.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground">
                  <AlertTriangle className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p>No absence records found.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/40 border-b">
                      <tr className="text-xs text-muted-foreground uppercase tracking-wide">
                        <th className="text-left px-4 py-3">Staff</th>
                        <th className="text-left px-4 py-3">Type</th>
                        <th className="text-left px-4 py-3">From</th>
                        <th className="text-left px-4 py-3">To</th>
                        <th className="text-right px-4 py-3">Days</th>
                        <th className="text-left px-4 py-3">Self-cert</th>
                        <th className="text-left px-4 py-3">Fit Note</th>
                        <th className="text-left px-4 py-3">RTW</th>
                        <th className="text-left px-4 py-3">Status</th>
                        <th className="px-4 py-3"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAbsences.map(a => (
                        <tr key={a.id} className="border-b last:border-0 hover:bg-muted/20">
                          <td className="px-4 py-3 font-medium">{a.staff_name}</td>
                          <td className="px-4 py-3">
                            <Badge className={`text-xs ${a.absence_type === 'sick' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}>
                              {a.absence_type.replace('_', ' ')}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">{a.start_date ? format(parseISO(a.start_date), 'dd MMM yy') : '—'}</td>
                          <td className="px-4 py-3">{a.end_date ? format(parseISO(a.end_date), 'dd MMM yy') : '—'}</td>
                          <td className="px-4 py-3 text-right font-medium">{a.days}</td>
                          <td className="px-4 py-3">{a.self_cert_submitted ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : <XCircle className="w-4 h-4 text-muted-foreground" />}</td>
                          <td className="px-4 py-3">
                            {a.fit_note_required
                              ? a.fit_note_received
                                ? <CheckCircle2 className="w-4 h-4 text-green-600" />
                                : <XCircle className="w-4 h-4 text-red-500" />
                              : <span className="text-xs text-muted-foreground">N/A</span>}
                          </td>
                          <td className="px-4 py-3">
                            {a.return_to_work_interview
                              ? <CheckCircle2 className="w-4 h-4 text-green-600" />
                              : a.absence_type === 'sick'
                                ? <XCircle className="w-4 h-4 text-orange-400" />
                                : <span className="text-xs text-muted-foreground">—</span>}
                          </td>
                          <td className="px-4 py-3">
                            <Badge className={`text-xs ${a.status === 'closed' ? 'bg-gray-100 text-gray-600' : a.status === 'under_review' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>
                              {a.status.replace('_', ' ')}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            <button className="text-xs text-primary underline" onClick={() => { setEditAbsence(a); setShowAbsenceDialog(true); }}>Edit</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Bradford Factor Tab */}
        <TabsContent value="bradford" className="mt-4 space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
            <p className="font-semibold mb-1">Bradford Factor Formula: B = S² × D</p>
            <p>S = number of separate sickness spells · D = total days absent · Rolling 52-week window</p>
            <p className="mt-1">Thresholds: <span className="font-medium">50+</span> informal discussion · <span className="font-medium">100+</span> written warning · <span className="font-medium">200+</span> final written warning · <span className="font-medium">400+</span> potential dismissal</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {staffWithBradford.map(s => (
              <div key={s.id} className="rounded-xl border bg-card p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-sm">{s.name}</p>
                    <p className="text-xs text-muted-foreground capitalize">{s.role}</p>
                  </div>
                  <Badge className={s.trigger.color + ' text-xs'}>{s.trigger.label}</Badge>
                </div>
                <BradfordScoreCard absences={absences} staffId={s.id} staffName={s.name} />
              </div>
            ))}
            {staffWithBradford.length === 0 && (
              <div className="col-span-3 py-10 text-center text-muted-foreground">
                <p>No staff records found. Add staff first.</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <TimesheetEntryDialog
        open={showEntryDialog}
        onClose={() => { setShowEntryDialog(false); setEditEntry(null); }}
        onSave={d => editEntry ? updateEntry.mutate({ id: editEntry.id, ...d }) : createEntry.mutate(d)}
        entry={editEntry}
        staffList={staff}
        payPeriodId={selectedPeriod}
      />
      <AbsenceFormDialog
        open={showAbsenceDialog}
        onClose={() => { setShowAbsenceDialog(false); setEditAbsence(null); }}
        onSave={d => editAbsence ? updateAbsence.mutate({ id: editAbsence.id, ...d }) : createAbsence.mutate(d)}
        record={editAbsence}
        staffList={staff}
      />
      <PayPeriodDialog
        open={showPeriodDialog}
        onClose={() => setShowPeriodDialog(false)}
        onSave={d => createPeriod.mutate(d)}
      />
    </div>
  );
}