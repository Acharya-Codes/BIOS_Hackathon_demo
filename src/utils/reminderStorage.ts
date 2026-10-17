import type { ReminderRecord } from "../types";

const REMINDERS_STORAGE_KEY = "kavach.reminders.v1";

export function readReminders(): ReminderRecord[] {
  const raw = localStorage.getItem(REMINDERS_STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed) || !parsed.every(isReminderRecord)) {
      throw new Error("Saved reminders are not in the expected format.");
    }
    return parsed;
  } catch (error) {
    const detail = error instanceof Error ? ` ${error.message}` : "";
    throw new Error(`Could not read saved reminders from this device.${detail}`);
  }
}

function isReminderRecord(value: unknown): value is ReminderRecord {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.id === "string" &&
    typeof record.childId === "string" &&
    typeof record.childName === "string" &&
    typeof record.phone === "string" &&
    typeof record.vaccineName === "string" &&
    typeof record.sentAt === "string" &&
    record.status === "Sent"
  );
}

export function saveReminder(reminder: ReminderRecord): void {
  localStorage.setItem(REMINDERS_STORAGE_KEY, JSON.stringify([reminder, ...readReminders()]));
}
