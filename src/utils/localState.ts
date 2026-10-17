import type { ChildRecord, ReminderRecord } from "../types";
import { createDemoChildren } from "../data/demoChildren";
import { readChildren, saveChild } from "./childStorage";
import { readReminders } from "./reminderStorage";

export function loadChildRecords(): ChildRecord[] {
  const saved = readChildren();
  const demoChildren = createDemoChildren();
  const savedMeena = saved.find((child) => child.name.trim().toLowerCase() === "meena");
  const records = demoChildren.map((demo) =>
    demo.name === "Meena" && savedMeena ? savedMeena : saved.find((child) => child.id === demo.id) ?? demo,
  );

  for (const child of saved) {
    if (!records.some((record) => record.id === child.id)) records.push(child);
  }

  if (saved.length !== records.length || !saved.some((child) => child.name === "Meena")) {
    for (const child of records) saveChild(child);
  }
  return records;
}

export function loadReminderRecords(): ReminderRecord[] {
  return readReminders();
}
