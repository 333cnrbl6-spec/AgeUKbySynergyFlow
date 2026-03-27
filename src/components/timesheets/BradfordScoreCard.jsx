import { calcBradfordFactor, bradfordTrigger } from '@/utils/bradford';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, TrendingUp } from 'lucide-react';

export default function BradfordScoreCard({ absences, staffId, staffName }) {
  const { S, D, B } = calcBradfordFactor(absences, staffId);
  const trigger = bradfordTrigger(B);

  return (
    <div className="rounded-lg border p-4 bg-card space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-foreground flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-muted-foreground" />
          Bradford Factor
        </span>
        <Badge className={trigger.color}>{trigger.label}</Badge>
      </div>
      <div className="text-3xl font-bold font-heading">{B}</div>
      <div className="text-xs text-muted-foreground">
        {S} spell{S !== 1 ? 's' : ''} × {S}² × {D} day{D !== 1 ? 's' : ''} = {B} &nbsp;·&nbsp; Rolling 52 weeks
      </div>
      {B >= 50 && (
        <div className="flex items-center gap-1 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1">
          <AlertTriangle className="w-3 h-3" />
          Trigger threshold reached — review recommended
        </div>
      )}
    </div>
  );
}