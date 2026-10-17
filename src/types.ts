export type Sex = "Female" | "Male" | "Other";

export interface ChildRecord {
  id: string;
  name: string;
  dateOfBirth: string;
  sex: Sex;
  guardianName: string;
  guardianPhone: string;
  previousVillage: string;
  previousDistrict: string;
  currentVillage: string;
  currentDistrict: string;
  vaccinesGiven: string[];
  vaccineDates?: Record<string, string>;
  milestonesMet: string[];
  migrated: boolean;
  missedVisits: number;
  createdAt: string;
}

export interface ReminderRecord {
  id: string;
  childId: string;
  childName: string;
  phone: string;
  vaccineName: string;
  sentAt: string;
  status: "Sent";
}

export interface RiskAssessment {
  score: number;
  reasons: string[];
}
