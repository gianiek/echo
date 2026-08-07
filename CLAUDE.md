@AGENTS.md

# Echo

Personal pixel-styled life tracker — map check-ins, movies/books/walks, budget, mood/dinner/home-vs-out, and a read-only share link. Full design doc, decisions, and rationale: **`/Users/gk/.claude/plans/rosy-mixing-rose.md`** — read it before making non-trivial changes; it's kept up to date as the source of truth and is cheaper than re-deriving context from the code.

- **Live**: https://echo-ten-coral.vercel.app
- **Repo**: github.com/gianiek/echo (origin remote already configured over SSH)
- **Stack**: Next.js 16 (App Router — `proxy.ts`, not `middleware.js`, per AGENTS.md above) + Prisma 7 + Neon Postgres + Vercel + Leaflet

## Known gotchas — don't rediscover these the hard way
- **Prisma 7 requires an explicit driver adapter.** `new PrismaClient({ adapter })` with `@prisma/adapter-pg` — see `lib/prisma.ts`. The generated client lives at `app/generated/prisma` (TS source, custom generator), not `node_modules/@prisma/client`.
- **`prisma migrate dev` / `migrate deploy` reliably time out** acquiring their advisory lock against this Neon endpoint (pooled *and* direct connection both fail — not a pooler issue). Workaround used for every migration so far: hand-write the migration SQL in `prisma/migrations/<ts>_name/migration.sql`, apply it with `prisma db execute --stdin`, then run `prisma migrate resolve --applied <migration_name>` to keep migration history consistent. Don't burn time re-debugging the lock itself — just use this path.
- **Debug the DB through the app's own API/Prisma, not raw `psql`/`pg`.** `DateTime` columns are `timestamp` (no timezone); Prisma treats them as UTC consistently, but a raw `pg` client on this machine displays them shifted by local session timezone — looks like duplicate/wrong rows when there aren't any.
- **Env vars**: `.env` holds `DATABASE_URL`, `APP_PASSWORD`, `ORS_API_KEY` locally — the same three must also be set in Vercel's project env vars for production. New secrets need manual addition in both places.
- **No `gh` CLI on this machine.** `git push` works via SSH (key already registered with GitHub as `gianiek`).
