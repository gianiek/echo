import { format, startOfDay } from "date-fns";
import type { JournalEntryDTO } from "@/lib/types";

/**
 * Consecutive calendar days with ≥1 entry, walking backward from today (or from
 * yesterday if today doesn't have an entry yet — today isn't "missed" until it's over).
 * Total is the lifetime count of distinct days journaled.
 */
export function computeJournalStreak(entries: JournalEntryDTO[]): {
  streak: number;
  totalDays: number;
} {
  const dayKeys = new Set(entries.map((e) => format(new Date(e.date), "yyyy-MM-dd")));

  let cursor = startOfDay(new Date());
  if (!dayKeys.has(format(cursor, "yyyy-MM-dd"))) {
    cursor = new Date(cursor);
    cursor.setDate(cursor.getDate() - 1);
  }

  let streak = 0;
  while (dayKeys.has(format(cursor, "yyyy-MM-dd"))) {
    streak++;
    cursor = new Date(cursor);
    cursor.setDate(cursor.getDate() - 1);
  }

  return { streak, totalDays: dayKeys.size };
}
