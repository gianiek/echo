import ActivityHeatmap from "@/components/pixel/ActivityHeatmap";
import type { JournalEntryDTO } from "@/lib/types";

export default function JournalHeatmap({ entries }: { entries: JournalEntryDTO[] }) {
  return (
    <ActivityHeatmap
      dates={entries.map((e) => e.date)}
      unitLabel="entry"
      unitLabelPlural="entries"
    />
  );
}
