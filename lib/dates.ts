import { format, isToday, isYesterday, startOfDay } from "date-fns";
import type { CheckInDTO } from "@/lib/types";

export type DayGroup = {
  dayKey: string;
  label: string;
  items: CheckInDTO[];
};

/** Groups check-ins by their local calendar day, derived from `timestamp` — never `createdAt`. */
export function groupByDay(checkIns: CheckInDTO[]): DayGroup[] {
  const groups = new Map<string, DayGroup>();

  for (const checkIn of checkIns) {
    const date = new Date(checkIn.timestamp);
    const dayKey = startOfDay(date).toISOString();

    let group = groups.get(dayKey);
    if (!group) {
      const label = isToday(date)
        ? "Today"
        : isYesterday(date)
          ? "Yesterday"
          : format(date, "MMM d");
      group = { dayKey, label, items: [] };
      groups.set(dayKey, group);
    }
    group.items.push(checkIn);
  }

  return Array.from(groups.values()).sort((a, b) => (a.dayKey < b.dayKey ? 1 : -1));
}

export function formatTime(iso: string): string {
  return format(new Date(iso), "h:mma").toLowerCase();
}

export function localDayISO(date: Date = new Date()): string {
  return startOfDay(date).toISOString();
}

export function formatShortDate(iso: string): string {
  return format(new Date(iso), "MMM d");
}
