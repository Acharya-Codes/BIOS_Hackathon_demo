import type { ChildRecord } from "../types";
import { addMonths } from "./dates";
import { UIP_SCHEDULE, type VaccineDose } from "../data/uipSchedule";

export type DoseStatus = "given" | "due-soon" | "overdue" | "upcoming";

export interface ChildDose {
  dose: VaccineDose;
  dueDate: Date;
  status: DoseStatus;
}

export function vaccineDueDate(child: ChildRecord, dose: VaccineDose): Date {
  const birthDate = new Date(`${child.dateOfBirth}T00:00:00`);
  if (dose.ageDays !== undefined) {
    const dueDate = new Date(birthDate);
    dueDate.setDate(dueDate.getDate() + dose.ageDays);
    return dueDate;
  }
  return addMonths(birthDate, dose.ageMonths);
}

export function getChildDoses(child: ChildRecord, today = new Date()): ChildDose[] {
  return UIP_SCHEDULE.map((dose) => {
    const dueDate = vaccineDueDate(child, dose);
    const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / 86_400_000);
    let status: DoseStatus = "upcoming";
    if (child.vaccinesGiven.includes(dose.id)) status = "given";
    else if (daysUntilDue < 0) status = "overdue";
    else if (daysUntilDue <= 7) status = "due-soon";
    return { dose, dueDate, status };
  });
}

export function getNextDose(child: ChildRecord, today = new Date()): ChildDose | undefined {
  const doses = getChildDoses(child, today).filter((item) => item.status !== "given");
  const bySoonestDate = (a: ChildDose, b: ChildDose) => a.dueDate.getTime() - b.dueDate.getTime();
  const dueSoon = doses.filter((item) => item.status === "due-soon").sort(bySoonestDate);
  if (dueSoon.length > 0) return dueSoon[0];
  const overdue = doses.filter((item) => item.status === "overdue").sort((a, b) => b.dueDate.getTime() - a.dueDate.getTime());
  if (overdue.length > 0) return overdue[0];
  return doses.sort(bySoonestDate)[0];
}

export function formatDoseDate(date: Date): string {
  return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" }).format(date);
}

export function doseStatusLabel(status: DoseStatus): string {
  return { given: "Given", "due-soon": "Due soon", overdue: "Overdue", upcoming: "Upcoming" }[status];
}
