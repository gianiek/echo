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
