export interface VaccineDose {
  id: string;
  name: string;
  ageMonths: number;
  ageDays?: number;
  ageLabel: string;
  category: "birth" | "primary" | "booster";
}

// Editable India UIP schedule. Weekly infant doses include exact day offsets for due-date calculations.
export const UIP_SCHEDULE: VaccineDose[] = [
  { id: "bcg", name: "BCG", ageMonths: 0, ageLabel: "At birth", category: "birth" },
  { id: "hep-b-0", name: "Hepatitis B — birth dose", ageMonths: 0, ageLabel: "At birth", category: "birth" },
  { id: "opv-0", name: "OPV 0", ageMonths: 0, ageLabel: "At birth", category: "birth" },
  { id: "opv-1", name: "OPV 1", ageMonths: 1.5, ageDays: 42, ageLabel: "6 weeks", category: "primary" },
  { id: "penta-1", name: "Pentavalent 1", ageMonths: 1.5, ageDays: 42, ageLabel: "6 weeks", category: "primary" },
  { id: "rota-1", name: "Rotavirus 1", ageMonths: 1.5, ageDays: 42, ageLabel: "6 weeks", category: "primary" },
  { id: "opv-2", name: "OPV 2", ageMonths: 2.5, ageDays: 70, ageLabel: "10 weeks", category: "primary" },
  { id: "penta-2", name: "Pentavalent 2", ageMonths: 2.5, ageDays: 70, ageLabel: "10 weeks", category: "primary" },
  { id: "rota-2", name: "Rotavirus 2", ageMonths: 2.5, ageDays: 70, ageLabel: "10 weeks", category: "primary" },
  { id: "opv-3", name: "OPV 3", ageMonths: 3.5, ageDays: 98, ageLabel: "14 weeks", category: "primary" },
  { id: "penta-3", name: "Pentavalent 3", ageMonths: 3.5, ageDays: 98, ageLabel: "14 weeks", category: "primary" },
  { id: "ipv-1", name: "IPV 1", ageMonths: 3.5, ageDays: 98, ageLabel: "14 weeks", category: "primary" },
  { id: "rota-3", name: "Rotavirus 3", ageMonths: 3.5, ageDays: 98, ageLabel: "14 weeks", category: "primary" },
  { id: "pcv-1", name: "PCV 1", ageMonths: 1.5, ageDays: 42, ageLabel: "6 weeks", category: "primary" },
  { id: "pcv-2", name: "PCV 2", ageMonths: 3.5, ageDays: 98, ageLabel: "14 weeks", category: "primary" },
  { id: "mr-1", name: "MR 1", ageMonths: 9, ageLabel: "9 months", category: "primary" },
  { id: "je-1", name: "JE 1 (endemic districts)", ageMonths: 9, ageLabel: "9 months", category: "primary" },
  { id: "pcv-booster", name: "PCV booster", ageMonths: 12, ageLabel: "9–12 months", category: "booster" },
  { id: "dpt-booster-1", name: "DPT booster 1", ageMonths: 16, ageLabel: "16–24 months", category: "booster" },
  { id: "mr-2", name: "MR 2", ageMonths: 16, ageLabel: "16–24 months", category: "booster" },
  { id: "opv-booster", name: "OPV booster", ageMonths: 16, ageLabel: "16–24 months", category: "booster" },
  { id: "dpt-booster-2", name: "DPT booster 2", ageMonths: 60, ageLabel: "5–6 years", category: "booster" },
];

export const REGISTRATION_VACCINES = UIP_SCHEDULE.filter((dose) => dose.ageMonths <= 4);
