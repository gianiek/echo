// One-off migration: journal entries saved through the old (buggy) date
// picker were stored at exact UTC midnight for the day the user picked.
// Anyone west of UTC (e.g. America/New_York) sees that instant fall on the
// *previous* local calendar day. This script finds every entry stamped at
// exact UTC midnight and re-stamps it at *local* midnight for that same
// year/month/day instead, which is what the fixed form now does going forward.
//
// Run with: npx tsx scripts/fix-journal-dates.ts           (dry run, no writes)
//           npx tsx scripts/fix-journal-dates.ts --apply    (writes the fix)

import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../app/generated/prisma/client.ts";

function isExactUtcMidnight(date: Date): boolean {
  return (
    date.getUTCHours() === 0 &&
    date.getUTCMinutes() === 0 &&
    date.getUTCSeconds() === 0 &&
    date.getUTCMilliseconds() === 0
  );
}

function toLocalMidnightOfSameUtcDay(date: Date): Date {
  const y = date.getUTCFullYear();
  const m = date.getUTCMonth();
  const d = date.getUTCDate();
  return new Date(y, m, d); // local-time constructor
}

async function main() {
  const apply = process.argv.includes("--apply");
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });

  const entries = await prisma.journalEntry.findMany({ orderBy: { date: "asc" } });
  const affected = entries.filter((e) => isExactUtcMidnight(e.date));

  console.log(`${entries.length} total entries, ${affected.length} look mis-dated.\n`);

  for (const e of affected) {
    const before = e.date.toISOString();
    const after = toLocalMidnightOfSameUtcDay(e.date).toISOString();
    const note = e.note.length > 40 ? e.note.slice(0, 40) + "…" : e.note;
    console.log(`${e.id}  "${note}"`);
    console.log(`  before: ${before}`);
    console.log(`  after:  ${after}\n`);

    if (apply) {
      await prisma.journalEntry.update({
        where: { id: e.id },
        data: { date: toLocalMidnightOfSameUtcDay(e.date) },
      });
    }
  }

  console.log(apply ? "Applied." : "Dry run only — pass --apply to write these changes.");
  await prisma.$disconnect();
}

main();
