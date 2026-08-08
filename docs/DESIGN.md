# Echo — design doc & build log

This is the working design document for Echo, kept up to date across every round
of building it — the context behind each decision, the tradeoffs considered, and
the build order actually followed. It's included here (rather than kept private)
because it's more useful as a record of *how* the product got scoped and
sequenced than as a private note to self — every "why," not just the "what."

---

## Context
Inspired by the Spidey Tracker map (spideytracker.com) and Google Maps' custom emoji pins, the goal is a personal, cloud-hosted web app for logging check-ins (place + timestamp), pinning them on a map with a chosen emoji, connecting same-day stops with a dotted route line, and showing running totals ($ spent, places visited, workouts done) as retro pixel progress bars/counters. Visual direction, per the pink Y2K desktop-OS reference the user supplied: chunky pixel-bordered dialog boxes, a cute pastel-pink palette, pixel fonts, floppy-disk/heart iconography — a "Tamagotchi desktop" feel rather than a dark superhero HUD.

**Naming**: the project was originally called "Bat Tracker" (an inside joke — the user and friends call each other "bats"), but that name doesn't hold up if this ever ships more broadly, so the product name is **Echo** — bats navigate by echolocation, so it keeps the connection without requiring the backstory. The pixel bat mascot stays as the icon/wordmark glyph (🦇 ECHO) as the visual nod to where it came from.

This is a brand-new, greenfield project — a blank directory with no existing app to build on, so this plan defines the stack and structure from scratch.

Decisions locked in from the interview:
- **Interface**: web app only (mobile-first PWA, installable to home screen). No SMS/Twilio.
- **Map**: Leaflet + OpenStreetMap tiles (free, no API key/billing).
- **Hosting**: cloud-hosted (Vercel + Neon serverless Postgres) so it works from the phone anywhere. Neon over Supabase because this app only ever needs plain Postgres via Prisma — no auth/storage/realtime/edge-function features from a bundled BaaS — and Neon has the tighter native Vercel integration and a serverless driver built for functions.
- **Art**: built from scratch in code (pixel fonts + CSS/SVG chrome + emoji), no external sprite pack — styled after the supplied pink retro-desktop reference.
- **Privacy**: single shared-passphrase gate (cookie-based), no full user accounts.
- **Data model**: one unified "check-in" record; $ spent and workout are optional fields on a check-in, not separate logs.
- **Stats**: no fixed goals — these are counters. Bars will be a decorative/animated pixel-bar visual around the big counter numbers rather than a percent-to-goal fill (flagged below as the one open design call).
- **Scope**: ongoing/all-time tracker (map accumulates forever, like the Spidey map), not tied to a single trip.
- **Personalization**: a "tracking as" name is set once and shown in the UI — lightweight, not real multi-user accounts (still one shared passphrase, one dataset).
- **Build sequencing**: the visual in-app map is not overkill (Leaflet is free and cheap to integrate) but it's not the safest *first* thing to build. Ship the list/timeline view first, with each check-in linking straight out to Google Maps for that spot, so the check-in loop is proven end-to-end before investing in the embedded map. The Leaflet map with custom emoji pins + dashed same-day lines lands as the next layer once that's solid, and the Google Maps link stays permanently on every check-in even after the in-app map exists (it's the only thing that gives real turn-by-turn directions).

## Stack
- **Framework**: Next.js (App Router) + TypeScript + Tailwind CSS
- **Map**: `react-leaflet` + `leaflet`, CartoDB "Positron" (light) tiles by default so pink pixel pins/UI pop — no API key needed
- **Geocoding/search**: OpenStreetMap Nominatim search API for place autocomplete, plus tap-on-map to drop/adjust a pin manually (matches the Google Maps pin-drop reference)
- **Emoji picker**: `emoji-picker-react` (lightweight, native iOS/system emoji rendering, no asset hosting needed)
- **Database**: Neon serverless Postgres (free tier) via Prisma ORM
- **Auth**: no accounts — Next.js middleware checks a signed cookie set after entering the shared passphrase (`APP_PASSWORD` env var)
- **Hosting**: Vercel, connected to a GitHub repo
- **Fonts**: `Press Start 2P` (headers/titles) + `Silkscreen` (body/UI text) via `next/font/google`

## Data model (Prisma)
Single table is sufficient:
```
model CheckIn {
  id            String   @id @default(cuid())
  placeName     String
  lat           Float
  lng           Float
  emoji         String
  timestamp     DateTime
  amountSpent   Float?
  spendCategory String?  // emoji from a fixed preset list, only set when amountSpent is set
  isWorkout     Boolean  @default(false)
  notes         String?
  createdAt     DateTime @default(now())
}
```
`spendCategory` stores just the category emoji (e.g. `"🍔"`); its label is looked up from a small constant map in code (`{ "🍔": "Food", "☕": "Coffee", ... }`) rather than duplicated in the DB. Preset list: 🛒 Groceries, 🍔 Food, ☕ Coffee, 🛍️ Shopping, 🎮 Fun, 🚗 Transport, 🏠 Home, 💊 Health, ✈️ Travel, 📦 Other.

A second, tiny table holds the personalization name and share token — a single row, not a users table:
```
model Settings {
  id          Int     @id @default(1)
  trackerName String  @default("")
  shareToken  String? @unique
}
```

A third table holds **all daily (non-check-in) tracking as one row per day** — dinner, whether you left the house, and mood. Deliberately consolidated into one table rather than one per habit: a future "wrapped"-style yearly summary can scan a single table instead of joining several, and it's the same reason day-grouping always keys off real dates rather than scattering habit data across ad hoc tables as new ones get added.
```
model DailyLog {
  date             DateTime @id // stored as start-of-local-day
  dinnerType       String?  // "made" | "purchased"
  didNotLeaveHouse Boolean  @default(false)
  mood             Int?     // 1-5
}
```
`didNotLeaveHouse` and "visited places" (≥1 check-in that day) are the two halves of the Home vs. Out chart on `/stats` — if a day somehow has both, the explicit `didNotLeaveHouse` flag wins over the inferred one, since it's a deliberate statement rather than an inference.

## Pages / structure
- `/login` — passphrase entry styled as a retro pixel dialog box (like the "I LOVE YOU" popup in the reference). First-time login also asks for the "tracking as" name (saved to `Settings`, editable later by tapping the title bar)
- `/log` — timeline list grouped by day, retro "file entry" rows (time, emoji, place, $, workout flag); each row links out to Google Maps for that spot (`https://www.google.com/maps/search/?api=1&query=<lat>,<lng>`); tap a row to edit/delete. **This is the first page built and the default landing screen until the map ships**
- `/` (Map) — full-screen Leaflet map; pins render as circular pixel-bordered badges containing the chosen emoji; check-ins are grouped by calendar day and connected with a dashed polyline in day-order; floating pixel "+" button opens the check-in dialog; each pin's popup also carries the same Google Maps link. **Built after `/log` is proven working**, then becomes the default landing screen
- `/stats` — pixel counter/progress-bar dashboard for Total $ Spent, Places Visited, Workouts Done, and No-Spend Days (all-time). The $ Spent counter is tappable and drills into `/budget`. Also shows three `DailyLog`-backed sections, all using the same `PixelBar` percent variant as `/budget` rather than a new charting library: **Dinner** (🍳 Made vs 🛍️ Purchased), **Home vs. Out** (🏠 stayed home vs 📍 visited places — the binary chart), and **Mood** (five bars, one per 1-5 level, showing what share of tracked days landed at each level)
- `/log` also gets a quick-log widget above the timeline — "Tonight's dinner" (🍳 Made / 🛍️ Purchased chips), a "Didn't leave the house today" checkbox, and a Mood 1-5 chip picker — all upserting today's single `DailyLog` row, highlighting whatever's already set for today
- `/budget` — category breakdown of spending: one pixel bar per category (🍔/☕/🛍️/etc.), width = that category's share of total $ spent, with the category total shown alongside; tapping a category drills into the raw list of purchases in it (place, date, amount)

## Check-in flow
Single modal (retro dialog box) with: place name field supporting three ways to set a location — Nominatim autocomplete search, tap-to-drop on a mini-map, or pasting a Google Maps share link (see below) — timestamp (defaults to now, editable for backfilling past stops), emoji picker (quick-pick row seeded with 🛒 🍔 ☕ 🏋️ 🎬 🌳 + full picker beyond that, no default forced — 🌳 covers park visits), optional $ amount — entering a nonzero amount reveals a second, smaller quick-pick grid of the 9 preset spend-category emoji (distinct from the place-pin emoji picker) — workout toggle (pixel checkbox), optional short note. Submits to `/api/checkins`.

**Pasting a Google Maps link**: covers places Nominatim doesn't have listed. The place field detects a pasted URL (vs. typed search text) and resolves it to lat/lng instead of running a search:
- Full links (`.../maps/place/Name/@lat,lng,zoom...` or `?q=lat,lng` / `?query=lat,lng`) — coordinates (and place name, if present in the path) are parsed client-side with a regex, no network round-trip needed.
- Short links (`maps.app.goo.gl/...`, generated by the "Share" button in the Google Maps app) don't carry coordinates in the URL itself — they have to be resolved server-side. `POST /api/geocode/resolve-maps-link` follows the redirect chain and parses the final URL the same way as above.

## API routes
CRUD via Prisma: `GET/POST /api/checkins`, `PATCH/DELETE /api/checkins/[id]` (list/detail responses include a derived `googleMapsUrl` per check-in, computed from `lat`/`lng`, not stored). `/api/stats` returns aggregate sums/counts for the stats page, including no-spend-day math (see below). `/api/budget` returns per-category totals (`{ emoji, label, total, count }[]`) plus the underlying check-ins per category for the drill-down list. `/api/settings` (GET/PUT) reads/writes the single `Settings` row for the tracking name. `/api/geocode/resolve-maps-link` (POST) resolves a pasted Google Maps short link to lat/lng/place-name for the check-in form. `/api/share` (GET/POST/DELETE, requires the passphrase) manages the share token; the public `/api/public/[token]` (GET, no auth) is what the `/share/[token]` page reads from — it returns check-ins through `serializePublicCheckIn`, which omits `amountSpent`/`spendCategory`/`notes`. `/api/daily` — `GET` returns today's `DailyLog` row plus all-time dinner/home-vs-out/mood aggregates (counts + percentages); `PUT` upserts any subset of `{ date?, dinnerType?, didNotLeaveHouse?, mood? }` for a day (date defaults to today).

## No-spend days
No schema change needed — derived from existing `amountSpent` data. Definition: a "no-spend day" is a calendar day that has at least one check-in logged where none of that day's check-ins have `amountSpent > 0` (a day with zero check-ins isn't a "win," it's just an untracked day, so it doesn't count). `/api/stats` computes this by grouping check-ins by local calendar date and checking each day's summed spend.

**All day-grouping uses `timestamp`, never `createdAt`** — this applies everywhere a "day" matters: map polyline grouping, `/log` day headers, and no-spend-day/streak math. `createdAt` is insertion-order only, never used for business logic. This is what makes backfilling a past check-in actually work correctly (it slots into its real day everywhere, not the day you happened to type it in).

**Streak definition, since backfilling can fill gaps in it**: the streak counts consecutive *tracked* days (days with ≥1 check-in) that are no-spend, ending at the most recent tracked day — a day with zero check-ins is skipped over, not treated as a broken streak (missing data isn't evidence you spent money). Backfilling a forgotten day can therefore extend or bridge a streak retroactively, which is the intended behavior. Two numbers surface on `/stats`: **all-time total** no-spend days, and **current streak** (consecutive no-spend days ending on the most recent logged day) — the streak is the one that'll feel like a retro combo meter and is worth the most visual emphasis (e.g. a little bat/flame icon next to the number).

## Design system components (built once, reused everywhere)
`PixelWindow` (title-bar chrome, e.g. a "Map / Log / Stats" faux menu bar like File/Edit/Help), `PixelButton`, `PixelDialog` (modal), `PixelInput`/`PixelCheckbox`, `PixelProgressBar` (segmented pink/white bar per the third reference image, reused on `/budget` with width driven by category share — this one has a real percentage, unlike the counters below), and a small hand-built pixel bat mascot (SVG/CSS grid, 2–4 frame idle blink) used as the check-in button icon and a corner mascot like the Spidey ref.

**Open design call**: since there are no fixed goals, `/stats` will show the big counter number as the primary element, with the segmented pixel bar underneath styled as a satisfying decorative animation (e.g. fills relative to your personal-best month, so it visually "levels up" over time) rather than a percent-to-goal. This is a proposal, easy to swap for a plain static full bar if it doesn't land right once built.

**Icon contrast**: bare emoji glyphs lose legibility sitting directly on saturated backgrounds (e.g. the hot-pink accent button fill). Anywhere an emoji functions as an icon inside a `pixel-btn`, it sits in a small neutral `.icon-badge` chip (`--panel` background, ink border) instead of directly on the button color, so it stays legible regardless of the button's state.

## Future: a "Wrapped" v2
Not being built now, but the data model is deliberately shaped for it: `CheckIn` (place, category, workout) plus the consolidated `DailyLog` (dinner, home-vs-out, mood) together cover enough dimensions — top places/categories, spend trends, workout cadence, mood trends, home-vs-out ratio, no-spend streaks — to build a yearly/monthly "wrapped"-style summary later purely by querying existing tables, without further schema changes.

## Sharing
A "🔗 Share" button in the title bar (next to "tracking as") generates a random `Settings.shareToken`, giving out `/share/<token>` — a public, read-only page (no login) that shows the map and stop list only: place, emoji, timestamp, Google Maps link. No $ amounts, spend category, or notes. Revoking regenerates/clears the token, invalidating old links. This is deliberately the "read-only share link" shape, not full multi-user accounts — friends view, they don't get their own tracking.

## PWA
`manifest.json` + a hand-drawn pixel bat icon set (multiple sizes), pink `theme-color`, installable to home screen. No offline data caching needed (always live from the DB).

## Build order
1. Scaffold Next.js + TS + Tailwind app, install deps (`react-leaflet`, `leaflet`, `prisma`, `@prisma/client`, `emoji-picker-react`, `date-fns`)
2. Neon project + Prisma schema/migration for `CheckIn` and `Settings`
3. Design system: fonts, Tailwind pink palette tokens, `PixelWindow`/`PixelButton`/`PixelDialog`/`PixelInput`/`PixelProgressBar`, bat mascot
4. Passphrase middleware + `/login` (captures the "tracking as" name on first login)
5. API routes: `/api/checkins` CRUD (with derived `googleMapsUrl`) + `/api/settings`
6. Check-in dialog: place search + tap-to-pin + paste-a-Google-Maps-link (geocode only, no map render needed yet), emoji picker, datetime, $ amount + category quick-pick, workout toggle, notes → `/api/checkins`
7. `/log` timeline page (default landing screen for now): day-grouped rows, each linking to Google Maps, edit/delete. **Milestone: full check-in loop works without any embedded map**
8. Map page (`/`): Leaflet setup, emoji divIcon markers, fetch + group-by-day, dashed same-day polylines, floating check-in button reusing the step-6 dialog, pin popups carrying the Google Maps link. Flip the default landing screen to `/` once this is solid
9. `/api/stats` aggregate + `/stats` page (counters + pixel bars, including no-spend total + streak; $ Spent links to `/budget`)
10. `/api/budget` aggregate + `/budget` page: category pixel bars by share of spend + drill-down purchase list per category
11. PWA manifest + icons + mobile polish (safe-area insets, viewport)
12. Deploy: GitHub → Vercel, env vars (`DATABASE_URL`, `APP_PASSWORD`), Neon connection, verify on phone

## Verification
No automated test suite — this is a personal single-user app, manual verification is sufficient:
- `npm run dev`, log in with the passphrase, set a tracking name → confirm it's saved and shown in the UI after a refresh
- Before the map exists: add a check-in → confirm it shows up on `/log` grouped under today, with a working "open in Google Maps" link that lands on the right spot
- Paste a real Google Maps share link (both a full link and a shortened `maps.app.goo.gl` one) into the place field → confirm both resolve to the correct coordinates
- Backfill a check-in for a past date (not today) → confirm it appears under the correct day on `/log` and the map, and correctly affects `/stats`/`/budget` totals for that day rather than today's
- Once the map is built: add a check-in with an emoji → confirm pin + emoji appear on map → add a second same-day check-in → confirm dashed line connects them in time order → confirm `/log` and `/stats` reflect both (correct $ sum, place count, workout count)
- Add a check-in with $0/no amount on a fresh day → confirm no-spend total and streak both increment; then add a check-in with a nonzero amount on the next day → confirm the streak resets to 0 while the all-time total stays intact
- Add check-ins with amounts across at least two different spend categories → tap $ Spent on `/stats`, confirm `/budget` bar widths match each category's actual share of total spend, and confirm drilling into a category shows the right purchases
- Confirm `/login` actually blocks access without the passphrase
- After deploying to Vercel, install the PWA to a phone home screen and repeat the check-in flow live on cellular data

---

# v1.1: Movies, Books, Walks, and a smarter map

## Context
v1 (everything above) is live at echo-ten-coral.vercel.app. This round extends Echo from "check-in + habit tracker" toward "everything that happened" — adding movies watched, books read, and walks with a real routed path — while keeping the same Wrapped-ready shape: one clean, dated table per thing, never crammed together. It also fixes two real usability issues that surfaced from actually using the app: map popups don't show the date, and the map's default view can get dominated by old clusters instead of showing recent activity.

Also folds in a small standing fix: **map pin popups currently show only time-of-day (`formatTime`), not the date** — every popup should show both (`formatShortDate` + `formatTime`, both already exist in `lib/dates.ts`).

## Decisions from this round's discussion
- **Walks are routed, not live-tracked.** iOS (and most mobile browsers) suspend a PWA's JS the instant the screen locks or the app backgrounds, so real background GPS tracking (Strava-style) isn't achievable here. Instead: log a **start point and an end point** (same location-picking UX as check-ins), and have the server compute an actual walking route between them via a routing API — a real street-accurate path, zero background-tracking problem, works every time.
- **Routing service: OpenRouteService** (openrouteservice.org). Free tier: 2,500 requests/day, 40,000/month, includes the `foot-walking` profile — vastly more than a personal app needs. Requires a free account + API key (no credit card), same shape of step as the Neon signup earlier. New env var: `ORS_API_KEY`.
- **Movies/books stay simple**: free-text title, no external movie/book database lookup (no posters, no autocomplete-by-title). That's a materially bigger feature (its own API, its own account) than "log what I watched/read," so it's out of scope unless asked for later.
- **No new nav tabs.** Movies/books/walks don't get their own top-level tab — four tabs is already the right amount for a 420px phone frame. They fold into a **unified `/log` feed** instead (see below), and walks additionally render on the Map since they have a location.
- **Rating widget reuses the mood-picker pattern** (1-5 tappable number chips, not star emoji) — deliberately, since we just fixed an emoji-on-saturated-background legibility bug; introducing star emoji here would risk the same problem again.

## New data models (Prisma)
Three more event tables, same shape as `CheckIn` — one row per thing, own date field, independently queryable:
```
model Movie {
  id        String   @id @default(cuid())
  title     String
  emoji     String
  watchedAt DateTime
  rating    Int?     // 1-5
  notes     String?
  createdAt DateTime @default(now())
}

model Book {
  id        String   @id @default(cuid())
  title     String
  author    String?  // small discretionary addition — standard for a book log, trivial cost
  emoji     String
  readAt    DateTime
  rating    Int?     // 1-5
  notes     String?
  createdAt DateTime @default(now())
}

model Walk {
  id              String   @id @default(cuid())
  startPlaceName  String
  startLat        Float
  startLng        Float
  endPlaceName    String
  endLat          Float
  endLng          Float
  route           Json     // [[lat,lng], ...] geometry from OpenRouteService
  distanceMeters  Float
  durationSeconds Float    // ORS's estimated walking time, not actual elapsed time
  timestamp       DateTime
  notes           String?
  createdAt       DateTime @default(now())
}
```
`emoji` on Movie follows the same pattern as the check-in pin emoji: a quick-pick row (`🎬 🍿 🎥 😂 😱 ❤️ 💀 🚀 🎭`) plus the full `emoji-picker-react` fallback. Same idea for Book (`📖 📚 🧙 💕 🔍 🐉 😢 🚀`). Both lists live in `lib/categories.ts` next to `PIN_EMOJI_QUICK_PICKS`.

Migration note: apply via hand-written SQL + `prisma migrate resolve --applied`, same as the last two migrations — `prisma migrate deploy`'s advisory-lock acquisition against this Neon endpoint has been unreliable in this session, and `db execute` + resolve sidesteps it without needing to debug Neon-side further.

## Shared building blocks (new)
- **`LocationPicker`** — extracted from `CheckInDialog.tsx`'s inline place-search logic (Nominatim search, paste-a-Google-Maps-link, reverse geocode). Currently ~100 lines living inside one component; `WalkDialog` needs two independent instances of it (start + end), so it becomes its own component/hook that `CheckInDialog` also switches to using. Behavior stays identical — this is a relocation, not a rewrite, so the tested check-in flow shouldn't change. Tap-to-drop-a-pin stays check-in-only for now (walks use search/paste-link only, since there's no natural "already-open map" moment for a two-point pick yet) — flagged as an easy later add, not a v1.1 requirement.
- **`PixelRating`** — generalizes the 1-5 chip picker already built for mood in `DailyQuickLog.tsx` into a reusable component, used by mood, `MovieDialog`, and `BookDialog`.

## Unified `/log` feed
Right now `/log` only shows check-ins. New `GET /api/timeline` queries `CheckIn` + `Movie` + `Book` + `Walk` in parallel, normalizes each into `{ id, type: "checkin" | "movie" | "book" | "walk", timestamp, emoji, title, meta }` (`meta` is a small type-specific summary string — place+$ for check-ins, rating for movies/books, distance for walks), and returns them merged and sorted by `timestamp` desc. `/log` renders this instead of `/api/checkins` directly, still grouped by day via the existing `groupByDay` pattern, each row styled per-type but reusing the existing `.log-row` grid. This single "everything that happened, dated" query is also exactly what a future Wrapped v2 needs, so it's worth having now rather than four separate feeds.

The "+ Check In" button becomes a small type-picker (4 chips: 📍 Check-in / 🎬 Movie / 📖 Book / 🚶 Walk) that opens the right dialog. `DailyQuickLog` (dinner/home/mood) stays exactly where it is above the feed, since those are daily attributes, not events.

## Map improvements
1. **Popup date fix** (the small standing item above): add `formatShortDate` to the popup content in `MapView.tsx` alongside the existing `formatTime`.
2. **Recent-cluster default centering**, replacing today's always-fit-everything behavior in `FitToCheckIns`: default to the cluster of check-ins/walks from roughly the last 30 days (falling back to the single most recent point, then geolocation, then the NYC default — same fallback chain as now, just narrower first choice). Add a small "🔭 Fit All" pixel button (corner of the map, next to the existing FAB) that explicitly zooms out to the full all-time bounds on tap — so "recent" is the default lens but "everything" stays one tap away.
3. **Walk routes on the map**: render `Walk.route` as a Polyline styled distinctly from the same-day dashed connector — a solid line with an animated "marching ants" effect (CSS `stroke-dashoffset` keyframe animation on the Leaflet-rendered SVG path, via `pathOptions={{ className: "walk-route-path" }}`), plus 🚶 and 🏁 start/end markers using the existing divIcon badge style. This is the "cute animation" — no new library, just CSS on the SVG Leaflet already renders.

## Timeline slider
A pixel-styled `<input type="range">` spanning the date range of all geo-located entries (check-ins + walks), sitting under the map. Dragging it sets an "as of" cutoff; the map filters to only what happened at-or-before that date (reusing `MapView` as-is with a filtered array — no changes needed there beyond accepting walks). A "▶ Play" button auto-advances the slider (e.g. one day per ~200ms) for a time-lapse "watch my history unfold" effect, with the recent-cluster fit-bounds logic naturally re-centering on whatever's visible as the slider moves. Reasonably cheap: it's a filter + an existing component, not new map infrastructure.

*(This shipped in v1.1, then was deliberately cut in v1.3 once it turned out not to earn its keep in practice — see the v1.3 section below.)*

## Build order (continuing from where v1 left off)
13. Extract `LocationPicker` from `CheckInDialog`; migrate `CheckInDialog` to use it (behavior-preserving refactor)
14. Schema: add `Movie`, `Book`, `Walk`; migrate (hand-written SQL + `migrate resolve`, per the note above)
15. `/api/movies`, `/api/books` CRUD (mirrors `/api/checkins` shape); `PixelRating` component
16. Sign up for OpenRouteService, add `ORS_API_KEY` to `.env` and Vercel; `/api/walks` POST calls ORS server-side (key never reaches the client) for the route geometry + distance/duration, then stores the `Walk`; GET/PATCH/DELETE to match
17. `/api/timeline` — unified normalized feed across all four tables
18. Rebuild `/log` around the unified feed; "+" becomes a 4-way type-picker; add `MovieDialog`/`BookDialog`/`WalkDialog`
19. Map: popup date fix, recent-cluster default + "Fit All" button, animated walk-route rendering
20. Timeline slider with Play/Pause
21. Full verification pass, migrate Neon, build + lint, commit, push, confirm on the live Vercel deployment

## Verification
- Log a movie and a book with ratings/notes → confirm both show up in the unified `/log` feed in correct chronological order alongside check-ins, with the right emoji/title/rating shown
- Log a walk between two real addresses → confirm the route drawn on the map roughly follows actual streets (not a straight line), distance/duration look sane, and the animated dashed styling renders
- Tap a map pin → confirm the popup now shows both date and time
- With check-ins spanning both "years ago" and "this month": load the map → confirm it centers on the recent cluster by default, and confirm "Fit All" zooms out to show everything
- Drag the timeline slider from earliest to latest → confirm pins/routes appear progressively in the correct order; tap Play → confirm it animates through automatically
- Confirm `ORS_API_KEY` is never exposed to the client (check Network tab / page source — the ORS call must happen only in the `/api/walks` route handler)

---

# v1.2: Journal

## Context
A daily reflection log — what got done, tagged by kind — visualized as a GitHub-contribution-style calendar heatmap, but built entirely from Echo's own data rather than actually syncing GitHub. Real GitHub sync was considered and dropped: it needs OAuth, hits API rate limits, and the whole point was "I like how this *looks*," not the underlying data source — so the plan takes the visual shape (a year of little squares, intensity = activity) and rebuilds it as a genuinely cute, whimsical version driven by journal entries, with zero external accounts or auth flows added.

## Decisions
- **No GitHub integration.** Purely visual inspiration — a calendar-grid heatmap. Zero new external accounts, no OAuth, no rate limits to manage.
- **Journal gets its own tab** (`Map / Log / Stats / Budget / Journal`), not folded into the unified `/log` feed. `/log` is "things that happened at a place/time"; the journal is daily reflection with its own dedicated visualization (the heatmap) that doesn't fit `/log`'s day-grouped row list or `/stats`'s percent bars.
- **Entries are event-based, not daily-singleton.** Like `CheckIn`/`Movie`/`Book`/`Walk` — you can log more than one per day, unlike `DailyLog` which is one row per day for singular attributes (mood, dinner). A journal entry is a note + a category + a date; no time-of-day needed.
- **Categories are fixed**, same pattern as spend categories (`lib/categories.ts`): ✨ Whimsy, 🤓 Learning, 🚀 Progress, 📝 Other. Stored as the emoji itself, labels looked up from a constant map.
- **Heatmap cell intensity = entry count that day** (like GitHub's commit count), not which categories — keeps the grid simple and legible. Category breakdown lives in the filterable notes list below the grid instead.
- **Sparkle is a moment, not ambient noise.** A one-time celebratory sparkle burst plays when you save a new entry, and today's cell (if it has an entry) gets a gentle persistent twinkle — cheap and still delivers "maximum whimsy" without fighting legibility.
- **Streak/day-count reuses the no-spend-streak pattern**: consecutive *tracked* days ending at the most recent one, skipping untracked gaps rather than breaking on them.

## Data model (Prisma)
```
model JournalEntry {
  id       String   @id @default(cuid())
  category String   // "✨" | "🤓" | "🚀" | "📝"
  note     String
  date     DateTime // day granularity — no time-of-day
  createdAt DateTime @default(now())

  @@index([date])
}
```

## API routes
- `GET/POST /api/journal`, `PATCH/DELETE /api/journal/[id]` — CRUD, mirrors `/api/movies` shape exactly.
- No separate aggregate endpoint — the journal page fetches the raw entry list and computes the heatmap cells + streak client-side, consistent with how `/log` and the Map page already do their own grouping rather than every feature getting a bespoke `/api/*/stats` route.

## New components
- **`JournalDialog.tsx`** — note (textarea, primary field, required), category (4 chips), date (backdateable date input), Save/Cancel/Delete.
- **`JournalHeatmap.tsx`** — the calendar grid: month labels across the top, small pixel squares below, horizontally scrollable, auto-scrolled to the current week on load. Intensity via 4 tiers (0/1/2/3+). A "Less ⬜🟪🟪🟪 More" legend line underneath. Today's cell gets the persistent twinkle if it has an entry.
- **`app/(app)/journal/page.tsx`** — header line ("🔥 N-day streak · M days journaled total"), the heatmap, 4 category filter chips, a day-grouped notes list below, and a "+ Journal" button.
- **Sparkle burst on save**: extracted from `CursorSparkles.tsx` into a small reusable one-shot burst.

## Nav
Add a 5th entry to `TABS` in `components/pixel/PixelWindow.tsx`: `{ href: "/journal", label: "Journal" }`.

## Build order (continuing from v1.1)
22. Schema: `JournalEntry`; migrate
23. `lib/categories.ts`: `JOURNAL_CATEGORIES`; `/api/journal` CRUD
24. `JournalDialog`
25. Extract a one-shot sparkle-burst component; wire into `JournalDialog`'s save
26. `JournalHeatmap`: scrollable grid, intensity tiers, month labels, legend, today's persistent twinkle
27. `app/(app)/journal/page.tsx`: streak/count header, heatmap, category filter chips, day-grouped notes list, "+ Journal"
28. Add `Journal` to `PixelWindow`'s tab bar
29. Verification pass, migrate Neon, build + lint, commit, push, confirm on live deployment

## Verification
- Log a few journal entries across different categories and dates (including backdated ones) → confirm the heatmap cell for each date darkens appropriately and the day-grouped list below shows them correctly
- Confirm the streak/total counts match manual counting for a small test set, and that skipping a day (no entry) breaks the streak while an untracked *future* day does not
- Tap each category filter chip → confirm the notes list filters correctly; tap again → confirm it clears
- Save a new entry → confirm the one-time sparkle burst plays once and doesn't linger or repeat on re-render
- Confirm today's cell twinkles only when today has an entry, and that `prefers-reduced-motion` disables both the burst and the twinkle
- Resize/view at the actual phone-frame width → confirm the 5-tab bar and the horizontally scrollable heatmap both render cleanly

---

# v1.3: Security pass, mood/wake trends, movies+books on stats, and cleanup

## Context
Two kinds of work in one round: real product asks (a nourishment journal category, cutting two features that turned out not to be useful, richer mood tracking, a new wake-time metric, surfacing movies/books on `/stats`, a wider desktop layout, freeform spend emoji), plus an explicit request for a security scan of everything built so far and a cleanup/README pass so the project is easy to come back to and understand. Doing the security fixes and the cleanup in the same round as the feature work, while touching the same files anyway, is cheaper than a separate pass later.

## Security scan findings
A direct review (grep + `npm audit` + reading the auth/map code) turned up three real, concrete issues worth fixing now, plus lower-priority hardening. `npm audit` itself is clean — zero vulnerable dependencies.

1. **Stored XSS via the `emoji` field.** `MapView.tsx`'s `createEmojiIcon` builds a Leaflet marker via `L.divIcon({ html: \`...${emoji}...\` })` — raw HTML interpolation, which bypasses React's auto-escaping (Leaflet inserts it via the DOM directly). Server-side, `emoji` on `CheckIn`/`Movie`/`Book` was validated only as "is a non-empty string" — nothing stopped it from being `<img src=x onerror=...>`. **Fix**: cap emoji length server-side and reject anything containing `<`/`>`; belt-and-suspenders, escape before interpolating into the divIcon HTML.
2. **Timing-unsafe comparisons.** `lib/auth.ts`'s `checkPassword` (`candidate === APP_PASSWORD`) and `proxy.ts`'s `token !== expectedAuthToken()` both short-circuit on the first mismatched character — the textbook timing-attack shape. **Fix**: `crypto.timingSafeEqual` with length-padded buffers for both.
3. **No rate limiting on `/api/login`.** Unlimited password guesses. A full fix needs a shared store (Vercel KV/Upstash) across serverless invocations, which is new infra for a personal app — flagged as a tradeoff, not fixed blind. **Proposed minimal fix**: a small artificial delay on failed attempts.
4. **Auth cookie was a bare, unsalted hash of the password itself**, with no server-side session secret — static forever until the password changes. **Fix**: derive the cookie via `HMAC-SHA256(password, SESSION_SECRET)` with a new random `SESSION_SECRET` env var.
5. **No security headers** (`X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`). Added via `next.config.ts` headers(). A full CSP is riskier to get right blind (needs to allowlist Leaflet tiles, Nominatim, OpenRouteService, self-hosted fonts) — added a scoped `frame-ancestors 'none'` instead, flagged as the one header worth extra scrutiny.
6. **Already fine, no action needed**: SQL injection (Prisma-parameterized everywhere), CORS (default same-origin), CSRF (`sameSite: "lax"` cookie already blocks cross-site state-changing requests), secrets handling (`.env` gitignored and never committed, `ORS_API_KEY` confirmed server-only).

## Cut features
Removed entirely rather than left as dead/disabled code: the "🔭 Fit All" button and its `FitAllControl` function in `MapView.tsx`, and the whole `TimelineSlider.tsx` component plus the Map page's `cutoff`/`visibleCheckIns`/`visibleWalks` filtering state that only existed to feed it. `MapView` went back to simply always showing the recent-activity cluster.

## Workout → Journal sync
Checking "This was a workout" on a check-in now auto-creates a same-day Journal entry, so it's logged once. New 🏋️ **Workout** category added to `JOURNAL_CATEGORIES` (alongside 🍵 **Nourishment**). In `CheckInDialog`'s submit handler, after a successful save where `isWorkout` is true (and wasn't already true when editing, to avoid duplicate entries on every re-save of an existing workout check-in), fires a `POST /api/journal` with `{ category: "🏋️", note: "Workout: <placeName>", date: <same date> }`.

## Mood: emoji + WHOOP-style line chart
- `PixelRating` gained an optional `labels?: string[]` prop — `DailyQuickLog`'s mood picker passes `labels={["😞", "😕", "😐", "🙂", "😄"]}`; `MovieDialog`/`BookDialog` keep plain numbers.
- New `PixelLineChart` component: a compact SVG line chart in the pixel style — straight segments between square (not round) point markers, `shape-rendering: crispEdges`. Gaps in the data (an untracked day) break the line rather than interpolating across them, consistent with "missing data isn't evidence of anything" used elsewhere. Replaced the mood bar-distribution section on `/stats`.

## Wake-up time (same structure as mood)
- `DailyLog` gained `wakeMinutes Int?` (minutes since midnight, sorts and charts cleanly).
- `DailyQuickLog` gets a `<input type="time">`, upserting through the existing `/api/daily` PUT.
- `/stats` gets a second `PixelLineChart` for wake-time trend.

## Movies & books on `/stats`
Generalized `JournalHeatmap` into **`components/pixel/ActivityHeatmap.tsx`** — same scrollable grid, taking a plain `dates: string[]` instead of full `JournalEntryDTO[]`, so it's reusable. `JournalHeatmap` became a thin wrapper; `/stats` gained "🎬 Movies" and "📖 Books" sections (count, average rating, an `ActivityHeatmap` of watch/read dates).

## Desktop width
`PixelWindow`'s outer frame (and login/share pages') went from a flat `max-w-[420px]` to `max-w-[420px] lg:max-w-[720px]` — phone-width by default, wider on desktop. `/stats`' 2-column tile grid became `grid-cols-2 lg:grid-cols-4`.

## Spend category: freeform emoji
`CheckInDialog`'s $ amount category picker gained the same "…" full-emoji-picker fallback the pin/movie/book emoji pickers already had — picking outside the preset set still works because `categoryLabel()` already falls back to `"Other"` for any emoji not in `SPEND_CATEGORIES`.

## Cleanup & README
- A real `README.md` — what Echo is, tech stack, folder structure, data model overview, how the pixel design system fits together, deployment, and a pointer to this design doc for full build history/decisions.
- `ActivityHeatmap` generalization above (real DRY win) as the primary code-cleanliness change this round, rather than a broad speculative refactor of already-working, already-tested code.

## Build order
30. Security fixes: emoji validation + escape divIcon interpolation, `crypto.timingSafeEqual`, `SESSION_SECRET`-based HMAC cookie, security headers
31. Remove Fit All + TimelineSlider (component, MapView wiring, Map page state, dead CSS)
32. `JOURNAL_CATEGORIES`: add 🍵 Nourishment + 🏋️ Workout; workout→journal auto-sync
33. `PixelRating` labels prop; mood emoji wired into `DailyQuickLog`
34. `PixelLineChart` component; replace `/stats` mood bar section with it
35. `wakeMinutes` on `DailyLog`; `/api/daily` accepts it; `DailyQuickLog` time input; wake-time line chart on `/stats`
36. Generalize `JournalHeatmap` → `ActivityHeatmap`; Movies/Books sections on `/stats`
37. Desktop width: `PixelWindow`/login/share frames, `/stats` grid breakpoint
38. Spend category full emoji picker in `CheckInDialog`
39. `README.md`
40. Verification pass, migrate Neon, build + lint, commit, push, confirm on live deployment

## Verification
- Attempt to save a check-in with `emoji` set to a string containing `<`/`>` directly via the API (bypassing the UI) → confirm the server rejects it
- Confirm the security headers don't break the map tiles, Nominatim search, or the emoji picker
- Log in with the correct passphrase after the `SESSION_SECRET` change → confirm it still works; confirm old cookies (pre-change) are rejected rather than silently accepted
- Check "This was a workout" on a new check-in → confirm exactly one Journal entry is created same-day; edit that same check-in again without touching the workout flag → confirm it does *not* create a second entry
- Confirm the Map page no longer shows "Fit All" or the timeline slider, and still centers correctly on recent activity
- Log moods across several days including a gap day → confirm the line chart shows a break at the gap, not an interpolated line through it; same check for wake time
- Confirm movies/books heatmaps and counts on `/stats` match what's actually logged
- View the app on a wide desktop browser window → confirm the frame widens and the stats grid uses the extra space, and confirm mobile width still looks exactly as before

---

# v1.4: A polished public face

## Context
Everything above shipped as a private, single-user app. This round is purely about the project's *public* surface — the repo and README as read by someone who's never seen Echo — without touching the running app's data or behavior. Same reasoning as the v1.3 cleanup pass, one level up: the code already works, so the remaining gap is entirely about legibility to an outside reader.

## Decisions
- **A public `/demo` route**, exempted from the passphrase gate, that renders the real pixel components (`MapView`, `PixelBar`, `PixelLineChart`, `ActivityHeatmap`) against hardcoded sample data rather than the database. Dev and prod share one Neon database with no separate demo instance, so seeding fake data or screenshotting the live app would either pollute real tracking data or leak it (spend amounts, real locations, journal notes) into a public README — a route that never calls Prisma sidesteps both problems.
- **This design doc moves into the repo** (`docs/DESIGN.md`) instead of staying referenced by a local-only path. A design doc that only resolves on one machine isn't a real artifact for anyone else — moving it in is what makes "read the design doc" an honest thing to tell a reader.
- **Repo hygiene**: removed the unused `create-next-app` boilerplate SVGs in `/public` (Echo's icons are generated in code via `app/icon.tsx`/`app/apple-icon.tsx`, so nothing referenced them), and added an MIT `LICENSE` — standard signal that a public repo is a complete, intentional artifact rather than a work-in-progress dump.
- **Roadmap checklist in the README** mirrors the actual version history above (v1 through v1.3 as shipped, checked off) plus a short list of genuinely-still-open items pulled from this doc's own flagged tradeoffs (Wrapped v2, login rate limiting, a full CSP, offline PWA caching) — real unfinished work, not padding.

## Build order
41. Remove unused `/public` boilerplate assets
42. Add `LICENSE` (MIT)
43. `app/demo/` — public showcase route with hardcoded sample data; exempt `/demo` from the `proxy.ts` auth matcher
44. Move this design doc into `docs/DESIGN.md`; rewrite `README.md` around it
