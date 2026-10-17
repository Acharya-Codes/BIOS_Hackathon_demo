import type { ChildRecord } from "../types";

const CHILDREN_STORAGE_KEY = "kavach.children.v1";

export function readChildren(): ChildRecord[] {
  const raw = localStorage.getItem(CHILDREN_STORAGE_KEY);
  if (!raw) return [];

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed) || !parsed.every(isChildRecord)) {
      throw new Error("Saved child records are not in the expected format.");
    }
    return parsed;
  } catch (error) {
    const detail = error instanceof Error ? ` ${error.message}` : "";
    throw new Error(`Could not read saved child records from this device.${detail}`);
  }
}

function isChildRecord(value: unknown): value is ChildRecord {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.id === "string" &&
    typeof record.name === "string" &&
    typeof record.dateOfBirth === "string" &&
    (record.sex === "Female" || record.sex === "Male" || record.sex === "Other") &&
    typeof record.guardianName === "string" &&
    typeof record.guardianPhone === "string" &&
    typeof record.previousVillage === "string" &&
    typeof record.previousDistrict === "string" &&
    typeof record.currentVillage === "string" &&
    typeof record.currentDistrict === "string" &&
    Array.isArray(record.vaccinesGiven) &&
    record.vaccinesGiven.every((item) => typeof item === "string") &&
    Array.isArray(record.milestonesMet) &&
    record.milestonesMet.every((item) => typeof item === "string") &&
    (record.vaccineDates === undefined ||
      (typeof record.vaccineDates === "object" &&
        record.vaccineDates !== null &&
        !Array.isArray(record.vaccineDates) &&
        Object.values(record.vaccineDates).every((date) => typeof date === "string"))) &&
    typeof record.migrated === "boolean" &&
    typeof record.missedVisits === "number" &&
    typeof record.createdAt === "string"
  );
}

export function saveChild(child: ChildRecord): void {
  const children = readChildren();
  localStorage.setItem(CHILDREN_STORAGE_KEY, JSON.stringify([child, ...children.filter((item) => item.id !== child.id)]));
}

export function createChildId(): string {
  const randomPart = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `KV-${new Date().getFullYear()}-${randomPart}`;
}
