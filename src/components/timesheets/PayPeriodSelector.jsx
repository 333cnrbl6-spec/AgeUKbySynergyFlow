import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus } from 'lucide-react';
import { format } from 'date-fns';

const statusColour = { open: 'bg-green-100 text-green-800', closed: 'bg-gray-100 text-gray-700', paid: 'bg-blue-100 text-blue-800' };

export default function PayPeriodSelector({ periods, selected, onSelect, onNew }) {
  return (
    <div className="flex items-center gap-3">
      <Select value={selected} onValueChange={onSelect}>
        <SelectTrigger className="w-60">
          <SelectValue placeholder="Select pay period..." />
        </SelectTrigger>
        <SelectContent>
          {periods.map(p => (
            <SelectItem key={p.id} value={p.id}>
              <div className="flex items-center gap-2">
                <span>{p.label}</span>
                <Badge className={`text-xs ${statusColour[p.status]}`}>{p.status}</Badge>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button size="sm" variant="outline" onClick={onNew}>
        <Plus className="w-4 h-4 mr-1" /> New Period
      </Button>
    </div>
  );
}