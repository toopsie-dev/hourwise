import type { Segment } from "../types";

export const MS_PER_MINUTE = 60_000;
export const MS_PER_HOUR = 60 * MS_PER_MINUTE;
export const MS_PER_DAY = 24 * MS_PER_HOUR;

/** Elapsed time of one segment; an open segment (end === null) counts up to `now`. */
export function segmentElapsedMs(segment: Segment, now: number): number {
  const end = segment.end ?? Math.max(now, segment.start);
  return Math.max(0, end - segment.start);
}

/** Elapsed time of a whole list of segments. */
export function totalElapsedMs(segments: Segment[], now: number): number {
  let total = 0;
  for (const segment of segments) {
    total += segmentElapsedMs(segment, now);
  }
  return total;
}

/** Canonical duration: rounded to the nearest whole minute, shared by display and export. */
export function roundToNearestMinute(ms: number): number {
  return Math.round(Math.max(0, ms) / MS_PER_MINUTE) * MS_PER_MINUTE;
}

/** "0h 30m" style duration label, rounded to the nearest minute. */
export function formatDuration(ms: number): string {
  const totalMinutes = Math.floor(roundToNearestMinute(ms) / MS_PER_MINUTE);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}h ${minutes}m`;
}

/** Live "00:05:23" stopwatch label from raw milliseconds (ticks every second). */
export function formatStopwatch(ms: number): string {
  const totalSeconds = Math.floor(Math.max(0, ms) / 1_000);
  const hours = String(Math.floor(totalSeconds / 3_600)).padStart(2, "0");
  const minutes = String(Math.floor((totalSeconds % 3_600) / 60)).padStart(2, "0");
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  return `${hours}:${minutes}:${seconds}`;
}

/** Decimal hours for the Excel export, e.g. 0.5; derived from the same rounded minutes. */
export function toDecimalHours(ms: number): number {
  return Math.round((roundToNearestMinute(ms) / MS_PER_HOUR) * 100) / 100;
}

/** Local calendar date as YYYY-MM-DD. */
export function todayLocalDate(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** "13:00" style local clock label for an epoch timestamp. */
export function formatClockTime(epochMs: number): string {
  const date = new Date(epochMs);
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

/** "13:00 - 13:10" style label for one segment. */
export function formatSegmentRange(segment: Segment, now: number): string {
  const end = segment.end ?? now;
  return `${formatClockTime(segment.start)} - ${formatClockTime(end)}`;
}

/** Joined "13:00 - 13:10; 14:20 - 14:40" list of segment ranges. */
export function formatSegmentList(segments: Segment[], now: number): string {
  return segments.map((segment) => formatSegmentRange(segment, now)).join("; ");
}

export interface BudgetProgress {
  /** Consumed share of the budget, clamped to 0-100. */
  percent: number;
  consumedMs: number;
  /** Time left in the budget; 0 when in overtime. */
  remainingMs: number;
  /** Amount over the budget; 0 when within budget. */
  overtimeMs: number;
  isOvertime: boolean;
}

/** Consumed-vs-budget math, clamped so the bar stays full in overtime. */
export function budgetProgress(consumedMs: number, budgetHours: number): BudgetProgress {
  const budgetMs = budgetHours * MS_PER_HOUR;
  const remainingMs = Math.max(0, budgetMs - consumedMs);
  const overtimeMs = Math.max(0, consumedMs - budgetMs);
  const rawPercent = budgetMs > 0 ? (consumedMs / budgetMs) * 100 : consumedMs > 0 ? 100 : 0;
  return {
    percent: Math.min(100, Math.max(0, rawPercent)),
    consumedMs,
    remainingMs,
    overtimeMs,
    isOvertime: overtimeMs > 0
  };
}
