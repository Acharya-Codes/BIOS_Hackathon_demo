export function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  const wholeMonths = Math.trunc(months);
  const fractionalDays = Math.round((months - wholeMonths) * 30.4375);
  const day = result.getDate();
  result.setDate(1);
  result.setMonth(result.getMonth() + wholeMonths);
  const lastDay = new Date(result.getFullYear(), result.getMonth() + 1, 0).getDate();
  result.setDate(Math.min(day, lastDay));
  result.setDate(result.getDate() + fractionalDays);
  return result;
}

export function dateMonthsAgo(months: number, today = new Date()): string {
  const date = addMonths(today, -months);
  return toDateInputValue(date);
}

export function toDateInputValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function ageInMonths(dateOfBirth: string, today = new Date()): number {
  const birth = new Date(`${dateOfBirth}T00:00:00`);
  let months = (today.getFullYear() - birth.getFullYear()) * 12 + today.getMonth() - birth.getMonth();
  if (today.getDate() < birth.getDate()) months -= 1;
  return Math.max(0, months);
}

export function formatAge(dateOfBirth: string, today = new Date()): string {
  const months = ageInMonths(dateOfBirth, today);
  if (months < 1) {
    const days = Math.max(0, Math.floor((today.getTime() - new Date(`${dateOfBirth}T00:00:00`).getTime()) / 86_400_000));
    return `${days} day${days === 1 ? "" : "s"} old`;
  }
  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;
  if (years === 0) return `${months} month${months === 1 ? "" : "s"} old`;
  if (remainingMonths === 0) return `${years} year${years === 1 ? "" : "s"} old`;
  return `${years} year${years === 1 ? "" : "s"}, ${remainingMonths} month${remainingMonths === 1 ? "" : "s"} old`;
}
