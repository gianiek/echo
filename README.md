# 🦇 Echo

A retro pixel life-tracker — check-ins on a map, movies and books, mood and sleep trends, a budget breakdown, and a GitHub-contributions-style journal heatmap.

**[Interactive demo](https://echo-ten-coral.vercel.app/demo)** (no login, sample data)

---

## Overview
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
`.env` — currently a personal, single-user project.

## Roadmap

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


