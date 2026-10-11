# Hourwise

A daily time-tracking web app for software developers: record planned development
work and unplanned interruptions (support, meetings, ...) in real time, and produce
an accurate daily activity report as an Excel file.

## Features

- **Shift plan** — set today's working hours (8, 10, 12 or a custom value) and watch a
  green progress bar of consumed vs. planned time; overtime keeps the bar full and is
  reported separately.
- **Live tracker** — activities are grouped by type, the running one is always on top
  with a green border, and elapsed time ticks every second as a `00:05:23` stopwatch.
  Starting or resuming one activity automatically pauses the current one, so logging
  an interruption is a single click.
- **Segment-based runs** — every run (pause/resume cycle) is stored as its own
  segment; elapsed time is always derived from stored timestamps, so a refresh or a
  closed tab never loses time.
- **Accidental-stop protection** — any stopped activity can be restored to the live
  tracker as paused, with its segments untouched.
- **Edit metadata** — title and description of stopped activities can be corrected
  before exporting (recorded time is never changed).
- **Totals popup** — completed activities with per-activity totals, optional
  start–end time ranges per card (hidden by default), a grand total, and the Excel
  download.
- **Excel export** — `daily-log-YYYY-MM-DD.xlsx` with the columns
  `Title, Description, Activity, Total hours ("0h Xm"), Times ("13:00 - 13:10; ...")`
  and a final grand-total row. Only stopped activities are exported.
- **Light/dark theme** with a header toggle, persisted per browser.
- **Daily reset** — the log is cleared at 12:00 AM local time (configurable via
  `RESET_HOUR`), keeping the chosen shift hours; data lives only in `localStorage`
  and survives refreshes.

## Tech stack

| Layer            | Choice                                        |
| ---------------- | --------------------------------------------- |
| Framework        | Nuxt 3 (`ssr: false`, single page)             |
| UI               | Vue 3 `<script setup lang="ts">`, strict mode |
| Styling          | Tailwind CSS 3 + DaisyUI 4 (light/dark)       |
| State            | Single `useTimeLog` composable + `localStorage` |
| Excel generation | `xlsx` (SheetJS), imported on demand          |
| Testing          | Vitest                                         |

## Getting started

```bash
npm install
npm run dev
```

Then open <http://localhost:3000>.

For a full typescript check across the project:

```bash
npx nuxi typecheck
```

## Scripts

| Script                     | Description                                |
| -------------------------- | ------------------------------------------ |
| `npm run dev`              | Start the dev server on port 3000          |
| `npm run build`            | Production build (Nitro, `.output/`)       |
| `npm run preview`          | Preview the production build               |
| `npm run generate`         | Static generation                          |
| `npm run typecheck`        | `nuxi typecheck` (vue-tsc over the project) |
| `npm run test`             | Run the Vitest suite once                  |

## Usage

1. Set the **Shift plan** (daily budget) hours at the top.
2. Click **Add activity**, pick a type (Meeting, Development, Support, ...), enter a
   title (required) and optional description, and press Start. The activity appears
   in the live tracker and time starts counting.
3. Get interrupted? Just start the next activity or pause the current one with the
   circular buttons; resume later — every run is recorded as its own segment.
4. Accidentally stopped an activity? Open **Totals** and press the restore button to
   put it back into the tracker as paused.
5. When you are done with an activity, press Stop. It moves to the Totals popup:
   expand **Show times** to inspect `HH:mm - HH:mm` ranges, or edit the title and
   description with the pencil button.
6. Click **Download Excel** for `daily-log-YYYY-MM-DD.xlsx`.

Note the footer reminder: the tracker resets daily at 12:00 AM — download your
Excel file before then.

## Project structure

```
hourwise/
├─ app.vue                     # Renders the single page
├─ pages/index.vue             # Layout, theme toggle, Excel export logic, wiring
├─ composables/useTimeLog.ts   # State singleton: segments, actions, persistence,
│                              #   daily reset, ticking clock, derived totals
├─ components/
│  ├─ BudgetBar.vue            # Shift plan + consumed/remaining/overtime bar
│  ├─ ActivityForm.vue         # "New activity" dialog (validation included)
│  ├─ LiveTracker.vue          # Type-grouped live/paused cards + controls
│  ├─ TotalsPanel.vue          # Stopped-activity list, edit/restore, times toggle
│  ├─ TotalsModal.vue          # Totals popup frame + export row
│  ├─ ActivityEditModal.vue    # Title/description editor dialog
├─ utils/time.ts               # Pure functions: segment math, rounding, formatting
├─ types/index.ts              # ActivityType, Segment, Activity, DayLog types
├─ constants.ts                # Activity types, budget options, RESET_HOUR, keys
├─ tests/time.test.ts          # Vitest cases for the time utilities
└─ tailwind.config.js, nuxt.config.ts, assets/css/main.css
```

## Testing

```bash
npm run test
```

The suite covers the pure time utilities in `utils/time.ts`: segment math
(including open segments), the Development 0h 30m / Support 0h 15m examples,
nearest-minute rounding consistency between display and export, stopwatch and clock
formatting, budget/progress clamping with overtime, and the joined `Times` column
format used by the Excel file.
