# 🦇 Echo

A retro pixel life-tracker I built for myself — check-ins on a map, movies and books,
walks with real routed paths, mood and sleep trends, a budget breakdown, and a
GitHub-contributions-style journal heatmap.

**[Live app](https://echo-ten-coral.vercel.app)** (password-gated) · **[Interactive demo](https://echo-ten-coral.vercel.app/demo)** (no login, sample data)

---

## Why this exists

I wanted something like the Spidey Tracker map — pin where you've been, watch the
map fill in over time — but for everything, not just places: spend, workouts,
mood, sleep, movies, books, a running journal.

The visual language: chunky pixel borders, a pastel-pink Tamagotchi-desktop feel.

## What it does

- **Map** — check-ins pinned with a chosen emoji, same-day stops connected by a
  dashed route line, walks rendered as an actual routed path (via OpenRouteService)
  with an animated "marching ants" line
- **Log** — one unified, day-grouped feed across check-ins, movies, books, walks,
  and journal entries — everything that happened, in order
- **Stats** — running totals ($ spent, places visited, workouts, no-spend streak),
  a mood trend line and a wake-time trend line, movies/books watched-and-read
  heatmaps
- **Budget** — spend broken down by category
- **Journal** — free-text reflections tagged by category, visualized as an activity heatmap with a streak counter
- **Share** — a read-only link to share with friends

## Try it without logging in

**[/demo](https://echo-ten-coral.vercel.app/demo)** renders the real UI — map, log,
stats, mood chart, journal heatmap — with hardcoded sample data. No database calls,
so it's safe to link publicly.

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

No test suite — single-user personal app, verified manually.

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
- ⬜ "Wrapped" — a yearly/monthly summary view
- ⬜ Rate limiting on login
- ⬜ Content-Security-Policy
- ⬜ Offline-friendly PWA caching for spotty connections

## License

MIT — see [LICENSE](LICENSE). The code's open to read, copy, or fork.
