/**
 * Bradford Factor: B = S² × D
 * S = number of separate absence spells in rolling 52 weeks
 * D = total days absent in rolling 52 weeks
 *
 * Trigger thresholds (common UK practice):
 *   0–49   : No action
 *   50–99  : Verbal warning / informal discussion
 *   100–199: Written warning
 *   200–399: Final written warning
 *   400+   : Potential dismissal
 */

export function calcBradfordFactor(absenceRecords, staffId) {
  const now = new Date();
  const cutoff = new Date(now);
  cutoff.setDate(cutoff.getDate() - 365); // rolling 52 weeks

  const relevant = absenceRecords.filter(r =>
    r.staff_id === staffId &&
    r.absence_type === 'sick' &&
    new Date(r.start_date) >= cutoff
  );

  const S = relevant.length; // number of spells
  const D = relevant.reduce((sum, r) => sum + (r.days || 1), 0); // total days
  const B = S * S * D;

  return { S, D, B };
}

export function bradfordTrigger(score) {
  if (score >= 400) return { level: 'critical', label: 'Potential Dismissal', color: 'bg-red-600 text-white' };
  if (score >= 200) return { level: 'high', label: 'Final Written Warning', color: 'bg-red-500 text-white' };
  if (score >= 100) return { level: 'medium', label: 'Written Warning', color: 'bg-orange-500 text-white' };
  if (score >= 50)  return { level: 'low', label: 'Informal Discussion', color: 'bg-yellow-500 text-white' };
  return { level: 'none', label: 'No Action Required', color: 'bg-green-500 text-white' };
}