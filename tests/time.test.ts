import { describe, expect, it } from "vitest";
import type { Segment } from "../types";
import {
  MS_PER_HOUR,
  MS_PER_MINUTE,
  budgetProgress,
  formatClockTime,
  formatDuration,
  formatSegmentList,
  formatSegmentRange,
  formatStopwatch,
  roundToNearestMinute,
  segmentElapsedMs,
  toDecimalHours,
  todayLocalDate,
  totalElapsedMs
} from "../utils/time";

function at(year: number, month: number, day: number, hour: number, minute: number): number {
  return new Date(year, month - 1, day, hour, minute).getTime();
}

describe("segment math", () => {
  it("Development paused twice (13:00-13:10 and 14:20-14:40) totals 0h 30m / 0.5 hours", () => {
    const segments: Segment[] = [
      { start: at(2026, 10, 12, 13, 0), end: at(2026, 10, 12, 13, 10) },
      { start: at(2026, 10, 12, 14, 20), end: at(2026, 10, 12, 14, 40) }
    ];
    const reference = at(2026, 10, 12, 15, 0);
    expect(totalElapsedMs(segments, reference)).toBe(30 * MS_PER_MINUTE);
    expect(formatDuration(totalElapsedMs(segments, reference))).toBe("0h 30m");
    expect(toDecimalHours(totalElapsedMs(segments, reference))).toBe(0.5);
  });

  it("Support of 15 minutes shows 0h 15m / 0.25 hours", () => {
    const segments: Segment[] = [
      { start: at(2026, 10, 12, 15, 0), end: at(2026, 10, 12, 15, 15) }
    ];
    const reference = at(2026, 10, 12, 15, 30);
    expect(totalElapsedMs(segments, reference)).toBe(15 * MS_PER_MINUTE);
    expect(formatDuration(totalElapsedMs(segments, reference))).toBe("0h 15m");
    expect(toDecimalHours(totalElapsedMs(segments, reference))).toBe(0.25);
  });

  it("open segment counts up to now", () => {
    const start = at(2026, 10, 12, 13, 0);
    expect(segmentElapsedMs({ start, end: null }, start + 5 * MS_PER_MINUTE)).toBe(5 * MS_PER_MINUTE);
    expect(segmentElapsedMs({ start, end: null }, start - 1_000)).toBe(0);
  });

  it("mixed open and closed segments sum correctly", () => {
    const start = at(2026, 10, 12, 13, 0);
    const segments: Segment[] = [
      { start, end: start + 10 * MS_PER_MINUTE },
      { start: start + 20 * MS_PER_MINUTE, end: null }
    ];
    expect(totalElapsedMs(segments, start + 23 * MS_PER_MINUTE)).toBe(13 * MS_PER_MINUTE);
  });
});

describe("budget progress", () => {
  it("reports remaining time within the budget", () => {
    const progress = budgetProgress(4 * MS_PER_HOUR, 8);
    expect(progress.percent).toBe(50);
    expect(progress.remainingMs).toBe(4 * MS_PER_HOUR);
    expect(progress.overtimeMs).toBe(0);
    expect(progress.isOvertime).toBe(false);
  });

  it("keeps the bar full and reports overtime beyond the budget", () => {
    const progress = budgetProgress(8.5 * MS_PER_HOUR, 8);
    expect(progress.percent).toBe(100);
    expect(progress.remainingMs).toBe(0);
    expect(progress.isOvertime).toBe(true);
    expect(formatDuration(progress.overtimeMs)).toBe("0h 30m");
  });
});

describe("formatting", () => {
  it("rounds to the nearest minute for display and export (29m 50s -> 0h 30m / 0.5)", () => {
    const ms = 29 * MS_PER_MINUTE + 50_000;
    expect(roundToNearestMinute(ms)).toBe(30 * MS_PER_MINUTE);
    expect(formatDuration(ms)).toBe("0h 30m");
    expect(toDecimalHours(ms)).toBe(0.5);
  });

  it("formats the live stopwatch with seconds", () => {
    expect(formatStopwatch(5 * MS_PER_MINUTE + 23_000)).toBe("00:05:23");
    expect(formatStopwatch(MS_PER_HOUR)).toBe("01:00:00");
    expect(formatStopwatch(3_600_000 + MS_PER_MINUTE)).toBe("01:01:00");
    expect(formatStopwatch(-1_000)).toBe("00:00:00");
  });

  it("formats clock labels and segment ranges", () => {
    const start = at(2026, 10, 12, 13, 0);
    const end = at(2026, 10, 12, 14, 5);
    expect(formatClockTime(start)).toBe("13:00");
    expect(formatSegmentRange({ start, end }, end)).toBe("13:00 - 14:05");
  });

  it("formats the local date as YYYY-MM-DD", () => {
    expect(todayLocalDate(new Date(2026, 9, 5, 23, 59))).toBe("2026-10-05");
    expect(todayLocalDate(new Date(2026, 0, 1, 0, 0))).toBe("2026-01-01");
  });
});

describe("export tally", () => {
  it("row time text uses the same rounded minutes as the panel display", () => {
    expect(formatDuration(MS_PER_MINUTE)).toBe("0h 1m");
    expect(formatDuration(2 * MS_PER_MINUTE)).toBe("0h 2m");
  });

  it("formats the Excel Times column as a joined segment list", () => {
    const segments: Segment[] = [
      { start: at(2026, 10, 12, 13, 0), end: at(2026, 10, 12, 13, 10) },
      { start: at(2026, 10, 12, 14, 20), end: at(2026, 10, 12, 14, 40) }
    ];
    const reference = at(2026, 10, 12, 15, 0);
    expect(formatSegmentList(segments, reference)).toBe("13:00 - 13:10; 14:20 - 14:40");
    expect(formatSegmentList(segments.slice(0, 1), reference)).toBe("13:00 - 13:10");
    expect(formatSegmentList([], reference)).toBe("");
  });

  it("grand total equals the exact sum of the row time text (1m + 2m case)", () => {
    const rows = [MS_PER_MINUTE, 2 * MS_PER_MINUTE].map((ms) => formatDuration(ms));
    const total = formatDuration(
      rows.reduce((sum, label) => sum + Number(label.replace("h ", "").replace("m", "")), 0) * MS_PER_MINUTE
    );
    expect(rows).toEqual(["0h 1m", "0h 2m"]);
    expect(total).toBe("0h 3m");
  });

  it("sum of per-activity rounded minutes matches the grand total shown in the panel", () => {
    const development: Segment[] = [
      { start: at(2026, 10, 12, 13, 0), end: at(2026, 10, 12, 13, 10) },
      { start: at(2026, 10, 12, 14, 20), end: at(2026, 10, 12, 14, 40) }
    ];
    const support: Segment[] = [
      { start: at(2026, 10, 12, 15, 0), end: at(2026, 10, 12, 15, 15) }
    ];
    const reference = at(2026, 10, 12, 15, 30);
    const activities = [development, support].map((segments) =>
      roundToNearestMinute(totalElapsedMs(segments, reference))
    );
    expect(formatDuration(activities.reduce((sum, ms) => sum + ms, 0))).toBe("0h 45m");
    expect(
      activities
        .map(toDecimalHours)
        .reduce((sum, value) => sum + value, 0)
    ).toBeCloseTo(0.75, 10);
  });
});
