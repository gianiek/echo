# 🦇 Echo

A retro pixel life-tracker I built for myself — check-ins on a map, movies and books,
walks with real routed paths, mood and sleep trends, a budget breakdown, and a
GitHub-contributions-style journal heatmap. One app, one person, one running record
of what's been going on.

**[Live app](https://echo-ten-coral.vercel.app)** (password-gated — it's my life, not a public dataset) · **[Interactive demo](https://echo-ten-coral.vercel.app/demo)** (no login, sample data)

---

## Why this exists

I wanted something like the Spidey Tracker map — pin where you've been, watch the
map fill in over time — but for my actual day-to-day: not just places, but spend,
workouts, mood, sleep, what I watched and read, and a running journal. Nothing on
the market does all of that in one place without asking me to hand my data to five
different apps, so I built the one I wanted.

The visual language — chunky pixel borders, a pastel-pink Tamagotchi-desktop feel —
started as a fun constraint and turned out to be a good one: retro pixel UI has very
few ways to *look* good, which forces real discipline in the component layer instead
of papering over inconsistency with polish.

## What it does

- **Map** — check-ins pinned with a chosen emoji, same-day stops connected by a
  dashed route line, walks rendered as an actual routed path (via OpenRouteService)
  with an animated "marching ants" line
- **Log** — one unified, day-grouped feed across check-ins, movies, books, walks,
  and journal entries — everything that happened, in order
- **Stats** — running totals ($ spent, places visited, workouts, no-spend streak),
  a mood trend line and a wake-time trend line, movies/books watched-and-read
  heatmaps
- **Budget** — spend broken down by category, drill-down into the raw purchases
  behind each one
- **Journal** — free-text reflections tagged by category, visualized as a
  scrollable activity heatmap with a streak counter
- **Share** — a read-only link (map + stop list only, no $ amounts or notes) for
  anyone I want to give a peek without giving them an account
- Installable as a home-screen PWA; single shared-passphrase gate, no user accounts

## Try it without logging in

**[/demo](https://echo-ten-coral.vercel.app/demo)** renders the real UI components —
the same map, log, stats tiles, mood chart, and journal heatmap — against hardcoded
sample data. It never touches the database, so it's safe to link publicly even
though the real app holds one real person's actual life.

## Stack

| | |
|---|---|
| Framework | [Next.js 16](https://nextjs.org) (App Router), TypeScript, Tailwind CSS |
| Database | [Neon](https://neon.tech) serverless Postgres via [Prisma 7](https://www.prisma.io) |
| Map | [Leaflet](https://leafletjs.com) / `react-leaflet`, CartoDB Positron tiles, OSM Nominatim for search |
| Routing | [OpenRouteService](https://openrouteservice.org) for real walked routes |
| Auth | Single passphrase, HMAC'd session cookie — no accounts, no third-party auth |
| Hosting | [Vercel](https://vercel.com) |
| Fonts | Press Start 2P (display) + Silkscreen (body), via `next/font` |

No test suite — this is a single-user personal app, so manual verification against
a written checklist (see the design doc below) does the job a full suite would for
a multi-user product.

## How it's put together

One idea shows up everywhere in the data model: **every kind of event gets its own
table, one row each, all keyed off a real date/timestamp** — `CheckIn`, `Movie`,
`Book`, `Walk`, `JournalEntry`. A separate `DailyLog` table holds the handful of
*daily* (not per-event) attributes — dinner, mood, wake time, whether I left the
house — one row per calendar day. Keeping those two shapes distinct instead of
cramming everything into one mega-table is what makes `/api/timeline`'s unified
feed, `/stats`'s aggregates, and a future "wrapped"-style yearly summary all
possible as plain queries against existing tables, with no new schema.

A few specific decisions worth calling out:

- **Day-grouping always uses the event's own timestamp, never `createdAt`.** That's
  what makes backfilling a forgotten check-in actually work — it slots into its
  real day everywhere (map, log, streaks), not the day you happened to type it in.
- **Streaks skip untracked days instead of breaking on them.** Missing data isn't
  evidence you spent money or skipped your journal — it's just missing. A gap day
  pauses a streak; a bad day breaks it.
- **Walks are routed, not live-tracked.** iOS suspends a backgrounded PWA's JS the
  instant the screen locks, so Strava-style background GPS tracking isn't
  achievable here. Instead: log a start and end point, and let a routing API
  compute a real, street-accurate path server-side. Zero background-tracking
  problem, works every time.
- **A security pass** (prompted by treating this like a real ship, not a toy)
  found and fixed stored-XSS risk in the map's emoji rendering, timing-unsafe auth
  comparisons, an unsalted session cookie, and missing security headers — see the
  full writeup in the design doc below.

## Project structure

```
app/
  (app)/            map, log, stats, budget, journal — behind the passphrase gate
  api/               REST-ish route handlers, one folder per resource
  demo/              public, unauthenticated showcase (see "Try it" above)
  login/, share/     auth entry point and the public read-only share view
  generated/prisma/  Prisma's generated client (custom output, not node_modules)
components/
  pixel/             the design system — PixelWindow, PixelButton, PixelDialog,
                     PixelBar, PixelLineChart, ActivityHeatmap, the bat mascot
  map/, checkin/, journal/, share/
lib/                 prisma client, auth, categories, date/day-grouping helpers
prisma/              schema + hand-written migrations
```

## Running it locally

```bash
npm install
npm run dev
```

Needs `DATABASE_URL`, `APP_PASSWORD`, `SESSION_SECRET`, and `ORS_API_KEY` in
`.env` — this is a personal, single-user project, not something set up for
general self-hosting, so there's no seed script or setup wizard beyond that.

## The full build log

This README covers what Echo is; **[`docs/DESIGN.md`](docs/DESIGN.md)** covers
*why*, round by round — every product decision, tradeoff, and gotcha, kept up to
date as the project grew from a single check-in table to what's here now. If you
want to see how a personal project actually gets scoped and sequenced rather than
just the finished result, that's the place to look.

## Roadmap

What's shipped, and what's next:

- ✅ Map check-ins with custom emoji pins + same-day dashed route lines
- ✅ Budget tracking with per-category breakdown and drill-down
- ✅ Daily habit tracking — dinner, mood, home-vs-out
- ✅ Read-only share links for friends, no accounts required
- ✅ Movies, books, and real routed walks folded into a unified timeline
- ✅ Smarter map defaults (recent-activity clustering instead of all-time bounds)
- ✅ Journal with a GitHub-contributions-style activity heatmap
- ✅ Security hardening pass (XSS fix, timing-safe auth, HMAC'd session, headers)
- ✅ Mood and wake-time trend lines, movies/books surfaced on the stats page
- ✅ Wider desktop layout
- ⬜ "Wrapped" — a yearly/monthly summary view (the data model's been shaped for
  this since v1.1; it's a query away, not a schema change)
- ⬜ Rate limiting on login (needs a shared store across serverless invocations —
  currently flagged as a deliberate tradeoff, not an oversight)
- ⬜ A real Content-Security-Policy (the current header set stops short of a full
  CSP until it's been verified against the map tiles/geocoding/emoji-picker
  integrations live)
- ⬜ Offline-friendly PWA caching for spotty connections

## License

MIT — see [LICENSE](LICENSE). This is a personal project I'm sharing as a portfolio
piece; the code's free to read, borrow from, or fork, but the live app is my own
data and isn't set up as a multi-user product.
