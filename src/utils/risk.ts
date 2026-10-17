import { UIP_SCHEDULE } from "../data/uipSchedule";
import type { ChildRecord, RiskAssessment } from "../types";
import { vaccineDueDate } from "./childStatus";

const DAYS_PER_RISK_POINT = 50;
const MIGRATION_POINTS = 25;
const MISSED_VISIT_POINTS = 12;

// Explainable score: cumulative overdue days, migration, and missed visits add risk.
export function assessMissRisk(child: ChildRecord, today = new Date()): RiskAssessment {
  const overdue = UIP_SCHEDULE.reduce((summary, dose) => {
    if (child.vaccinesGiven.includes(dose.id)) return summary;
    const dueDate = vaccineDueDate(child, dose);
    const daysLate = Math.floor((today.getTime() - dueDate.getTime()) / 86_400_000);
    if (daysLate <= 0) return summary;
    return { days: summary.days + daysLate, count: summary.count + 1, oldestDays: Math.max(summary.oldestDays, daysLate) };
  }, { days: 0, count: 0, oldestDays: 0 });

  const overduePoints = Math.min(60, Math.ceil(overdue.days / DAYS_PER_RISK_POINT));
  const migrationPoints = child.migrated ? MIGRATION_POINTS : 0;
  const visitPoints = Math.min(36, Math.max(0, child.missedVisits) * MISSED_VISIT_POINTS);
  const score = Math.min(100, overduePoints + migrationPoints + visitPoints);
  const reasons: string[] = [];

  if (overdue.count > 0) {
    reasons.push(`${overdue.count} overdue dose${overdue.count === 1 ? "" : "s"} · oldest ${overdue.oldestDays} days`);
  }
  if (child.migrated) reasons.push("Family recently migrated");
  if (child.missedVisits > 0) {
    reasons.push(`${child.missedVisits} missed visit${child.missedVisits === 1 ? "" : "s"}`);
  }
  if (reasons.length === 0) reasons.push("No overdue doses or missed visits");

  return { score, reasons };
}
