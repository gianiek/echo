# 🦇 Echo

A personal, pixel-styled life tracker — pin where you go on a map, log movies/books/walks, track daily habits (mood, dinner, wake time, whether you left the house), keep a journal with a GitHub-style activity heatmap, and see it all rolled up on a stats page. Single-user, passphrase-gated, no accounts.

**Live**: https://echo-ten-coral.vercel.app

Originally called "Bat Tracker" (an inside joke) — renamed to Echo because bats navigate by echolocation, which keeps the theme without needing the backstory. The pixel bat mascot stuck around as the wordmark glyph (🦇 ECHO).

## Full design history

This README covers "how it's built." For *why* — every decision, tradeoff, and the reasoning behind each feature across all build rounds (v1 → v1.3) — see the design doc kept alongside this project locally at `~/.claude/plans/rosy-mixing-rose.md` (not part of this repo). It's the source of truth and kept up to date; read it before making non-trivial changes.

## Stack

- **Framework**: Next.js 16 (App Router), TypeScript, Tailwind CSS
- **Database**: Neon serverless Postgres via Prisma 7 (`@prisma/adapter-pg` driver adapter — Prisma 7 requires one explicitly)
- **Map**: Leaflet / react-leaflet, CartoDB Positron tiles, OpenStreetMap Nominatim for place search/geocoding
- **Walk routing**: OpenRouteService (`foot-walking` profile) — server-side only, key never reaches the client
- **Emoji picker**: `emoji-picker-react`, dynamically imported
- **Auth**: single shared passphrase, no user accounts — see [Auth](#auth) below
- **Hosting**: Vercel, deployed from `main` on push
- **Fonts**: Press Start 2P (display) + Silkscreen (body), via `next/font/google`

## Folder structure

```
app/
  (app)/            # authenticated app shell — Map (page.tsx), /log, /stats, /budget, /journal
  api/               # route handlers — one folder per resource, REST-ish CRUD
  login/             # passphrase entry (outside the (app) group, no shell chrome)
  share/[token]/     # public read-only view, no auth
  generated/prisma/  # Prisma client output (generated, not hand-edited)
components/
  pixel/             # design system — PixelWindow, PixelButton, PixelDialog, PixelBar,
                      # PixelLineChart, ActivityHeatmap, BatMascot, etc.
  checkin/           # entry dialogs (CheckIn/Movie/Book/Walk/Journal) + DailyQuickLog
  map/                # Leaflet map view, location picker
  journal/           # JournalHeatmap (thin wrapper around ActivityHeatmap)
  share/             # public share-page view
lib/
  auth.ts            # password/session-token checking, timing-safe compares
  categories.ts       # emoji category constants (spend, journal, mood, quick-picks)
  dates.ts            # day-grouping, formatting, minutes<->time helpers
  types.ts            # shared DTO types returned by the API routes
  validate.ts          # isSafeEmoji() — server-side emoji validation
  checkins.ts / journal.ts / maps.ts / routing.ts / share.ts / prisma.ts
prisma/
  schema.prisma
  migrations/         # hand-written SQL per migration — see Migrations below
proxy.ts               # Next.js 16's middleware equivalent — the auth gate
```

## Data model

Each kind of event gets its own table, independently dated and queryable — deliberately *not* consolidated, so each can be queried/filtered on its own terms:

- `CheckIn` — place + emoji pin, optional $ spent/category, workout flag
- `Movie`, `Book` — title, emoji, rating, watched/read date
- `Walk` — start/end point, routed geometry (from OpenRouteService), distance/duration
- `JournalEntry` — free-text note + category + date (day granularity, no time-of-day)

One exception: `DailyLog` is **one row per calendar day**, holding singular daily attributes that don't make sense as repeatable events — `dinnerType`, `didNotLeaveHouse`, `mood`, `wakeMinutes`. This is deliberately consolidated (rather than one table per habit) so a future "Wrapped"-style yearly summary can scan a single table instead of joining several.

All day-grouping everywhere in the app (map polylines, `/log` day headers, streaks) uses each record's real event timestamp — never `createdAt`, which is insertion order only. This is what makes backdating a past entry actually slot it into the right day everywhere.

`Settings` is a single-row table holding the "tracking as" name and the share token.

## Design system

Everything pixel-styled lives in `components/pixel/`, built once and reused: `PixelWindow` (the app shell + tab bar), `PixelButton`, `PixelDialog`, `PixelInput`/`PixelCheckbox`/`PixelTextarea` (`PixelField.tsx`), `PixelBar` (segmented and percent variants), `PixelRating` (1–5 chip picker, optional emoji labels), `PixelLineChart` (SVG trend line with gap-breaking for untracked days), `ActivityHeatmap` (GitHub-contributions-style calendar grid, generalized from the original journal-only heatmap), and `BatMascot`.

## Auth

No user accounts — a single shared passphrase (`APP_PASSWORD`) gates the whole app. On login, the server derives `HMAC-SHA256(password, SESSION_SECRET)` and sets it as a cookie; `proxy.ts` checks incoming requests against the same derivation using a timing-safe comparison (`crypto.timingSafeEqual`, via `lib/auth.ts`). Failed logins get a small artificial delay as cheap brute-force friction. This is intentionally lightweight — fine for a single-user personal app, not a substitute for real multi-user auth.

## Environment variables

Set locally in `.env` (gitignored) and mirrored in Vercel's project settings:

| Var | Purpose |
|---|---|
| `DATABASE_URL` | Neon Postgres connection string |
| `APP_PASSWORD` | The shared login passphrase |
| `SESSION_SECRET` | HMAC key for the auth cookie — unrelated to `APP_PASSWORD` |
| `ORS_API_KEY` | OpenRouteService key, used server-side only in `/api/walks` |

## Migrations

`prisma migrate dev`/`deploy` reliably time out acquiring their advisory lock against this project's Neon endpoint (confirmed not a stale-lock issue — pooled and direct connections both fail). The workaround, used for every migration so far:

```bash
# 1. Hand-write prisma/migrations/<timestamp>_<name>/migration.sql
# 2. Apply it directly:
npx prisma db execute --stdin < prisma/migrations/<timestamp>_<name>/migration.sql
# 3. Record it as applied without re-running it:
npx prisma migrate resolve --applied <timestamp>_<name>
# 4. Regenerate the client:
npx prisma generate
```

## Local development

```bash
npm install
npm run dev      # http://localhost:3000
npm run lint
npm run build
```

Debug the database through the app's own Prisma-backed API routes, not raw `psql`. `DateTime` columns are stored without a timezone; Prisma treats them consistently as UTC, but a raw `pg` client on this machine displays them shifted by the local session timezone — easy to mistake for duplicate/wrong rows when there aren't any.

## Deployment

Push to `main` → Vercel auto-deploys. Database is Neon Postgres, connected via `DATABASE_URL`. No CI test suite — this is a personal single-user app; changes are verified manually (build + lint clean, then a pass through the actual feature in the browser) before pushing.
