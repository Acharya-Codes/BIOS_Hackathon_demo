import type { ChildRecord } from "../types";
import { dateMonthsAgo } from "../utils/dates";
import { UIP_SCHEDULE } from "./uipSchedule";

const DEMO_CHILDREN: Array<{
  name: string;
  months: number;
  sex: ChildRecord["sex"];
  guardianName: string;
  phone: string;
  village: string;
  district: string;
  migrated?: boolean;
  missedVisits?: number;
}> = [
  { name: "Meena", months: 9, sex: "Female", guardianName: "Lakshmi", phone: "9876543210", village: "Madanapalle", district: "Annamayya", migrated: true, missedVisits: 1 },
  { name: "Aarav", months: 2, sex: "Male", guardianName: "Sita", phone: "9876500123", village: "Chintapalli", district: "Visakhapatnam" },
  { name: "Ananya", months: 4, sex: "Female", guardianName: "Padma", phone: "9876500456", village: "Nallajerla", district: "West Godavari" },
  { name: "Ishaan", months: 6, sex: "Male", guardianName: "Kavitha", phone: "9876500789", village: "Kuppam", district: "Chittoor", migrated: true },
  { name: "Diya", months: 10, sex: "Female", guardianName: "Rani", phone: "9876501122", village: "Gudur", district: "Tirupati" },
  { name: "Vihaan", months: 13, sex: "Male", guardianName: "Madhavi", phone: "9876501455", village: "Pileru", district: "Annamayya", missedVisits: 1 },
  { name: "Aadhya", months: 17, sex: "Female", guardianName: "Saritha", phone: "9876501788", village: "Palamaner", district: "Chittoor" },
  { name: "Reyansh", months: 20, sex: "Male", guardianName: "Jyothi", phone: "9876502121", village: "Bhimavaram", district: "West Godavari", migrated: true },
  { name: "Myra", months: 24, sex: "Female", guardianName: "Uma", phone: "9876502454", village: "Amalapuram", district: "Konaseema" },
  { name: "Advik", months: 28, sex: "Male", guardianName: "Lalitha", phone: "9876502787", village: "Jangareddygudem", district: "Eluru", missedVisits: 2 },
  { name: "Saanvi", months: 32, sex: "Female", guardianName: "Nirmala", phone: "9876503120", village: "Markapur", district: "Prakasam" },
  { name: "Kabir", months: 38, sex: "Male", guardianName: "Bhavani", phone: "9876503453", village: "Punganur", district: "Chittoor", migrated: true },
  { name: "Tara", months: 43, sex: "Female", guardianName: "Geetha", phone: "9876503786", village: "Narasaraopet", district: "Palnadu" },
  { name: "Arjun", months: 50, sex: "Male", guardianName: "Sunitha", phone: "9876504129", village: "Rayachoti", district: "Annamayya", missedVisits: 1 },
];

function makeDemoChild(entry: (typeof DEMO_CHILDREN)[number], index: number): ChildRecord {
  const dateOfBirth = dateMonthsAgo(entry.months);
  const vaccinesGiven = index === 0
    ? ["bcg", "hep-b-0", "opv-0", "penta-1", "penta-2"]
    : UIP_SCHEDULE.filter((dose) => dose.ageMonths <= Math.max(0, entry.months - (index % 3 === 0 ? 3 : 0)))
      .filter((dose) => dose.id !== "mr-1" || index % 2 === 0)
      .map((dose) => dose.id);
  const vaccineDates = Object.fromEntries(
    vaccinesGiven.map((id) => {
      const dose = UIP_SCHEDULE.find((item) => item.id === id);
      return [id, dateMonthsAgo(Math.max(0, entry.months - (dose?.ageMonths ?? 0)))];
    }),
  );
  const id = index === 0 ? "KV-DEMO-MEENA" : `KV-DEMO-${entry.name.toUpperCase()}`;

  return {
    id,
    name: entry.name,
    dateOfBirth,
    sex: entry.sex,
    guardianName: entry.guardianName,
    guardianPhone: entry.phone,
    previousVillage: entry.migrated ? "Kothapalli" : entry.village,
    previousDistrict: entry.migrated ? "Anantapur" : entry.district,
    currentVillage: entry.village,
    currentDistrict: entry.district,
    vaccinesGiven,
    vaccineDates,
    milestonesMet: ["holds-head", "smiles", ...(entry.months >= 6 ? ["reaches-toy", "babbles"] : []), ...(entry.months >= 9 ? ["sits-alone"] : [])],
    migrated: entry.migrated ?? false,
    missedVisits: entry.missedVisits ?? 0,
    createdAt: new Date().toISOString(),
  };
}

export function createDemoChildren(): ChildRecord[] {
  return DEMO_CHILDREN.map(makeDemoChild);
}
