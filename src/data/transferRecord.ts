import type { ChildRecord } from "../types";
import { dateMonthsAgo } from "../utils/dates";

export const TRANSFER_DEMO_ID = "KV-TRANSFER-RAVI";

// Separate synthetic source record used to demonstrate importing a child into the care circle.
export function createTransferDemoRecord(): ChildRecord {
  const dateOfBirth = dateMonthsAgo(14);
  return {
    id: TRANSFER_DEMO_ID,
    name: "Ravi",
    dateOfBirth,
    sex: "Male",
    guardianName: "Kumari",
    guardianPhone: "9876505123",
    previousVillage: "Duvvur",
    previousDistrict: "YSR Kadapa",
    currentVillage: "Madanapalle",
    currentDistrict: "Annamayya",
    vaccinesGiven: ["bcg", "hep-b-0", "opv-0", "opv-1", "penta-1", "rota-1", "pcv-1", "opv-2", "penta-2"],
    milestonesMet: ["holds-head", "smiles", "reaches-toy", "babbles", "sits-alone"],
    migrated: true,
    missedVisits: 1,
    createdAt: new Date().toISOString(),
  };
}
