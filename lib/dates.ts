import { format, isToday, isYesterday, startOfDay } from "date-fns";

export type DayGroup<T> = {
  dayKey: string;
  label: string;
  items: T[];
};

/** Groups anything with a `timestamp` by local calendar day — always `timestamp`, never `createdAt`. */
export function groupByDay<T extends { timestamp: string }>(items: T[]): DayGroup<T>[] {
  const groups = new Map<string, DayGroup<T>>();

  for (const item of items) {
    const date = new Date(item.timestamp);
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
    group.items.push(item);
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

/** Minutes-since-midnight <-> "HH:MM" for `<input type="time">`, and a human "7:30 AM" label. */
export function minutesToTimeInputValue(minutes: number): string {
  const h = Math.floor(minutes / 60)
    .toString()
    .padStart(2, "0");
  const m = (minutes % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
}

export function timeInputValueToMinutes(value: string): number | null {
  const match = /^(\d{2}):(\d{2})$/.exec(value);
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}

export function formatMinutesAsTime(minutes: number): string {
  const d = new Date();
  d.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0);
  return format(d, "h:mma").toLowerCase();
}
