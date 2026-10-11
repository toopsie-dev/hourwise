import { computed, ref } from "vue";
import type { Activity, ActivityStatus, ActivityType, DayLog, Segment, TypeTotal } from "~/types";
import { ACTIVITY_TYPES, DEFAULT_BUDGET_HOURS, RESET_HOUR, STORAGE_KEY } from "~/constants";
import { MS_PER_DAY, roundToNearestMinute, todayLocalDate, totalElapsedMs } from "~/utils/time";

export interface StartPayload {
  type: ActivityType;
  title: string;
  description: string;
}

export interface UpdatePayload {
  id: string;
  title: string;
  description: string;
}

export interface ActivityGroup {
  type: ActivityType;
  activities: Activity[];
}

const day = ref<DayLog>({ date: todayLocalDate(), budgetHours: DEFAULT_BUDGET_HOURS, activities: [] });
const now = ref<number>(Date.now());

let clockTimer: ReturnType<typeof setInterval> | undefined;
let resetTimer: ReturnType<typeof setInterval> | undefined;
let initialized = false;

function createEmptyDay(budgetHours: number): DayLog {
  return { date: todayLocalDate(), budgetHours, activities: [] };
}

function uid(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isActivityType(value: unknown): value is ActivityType {
  return typeof value === "string" && (ACTIVITY_TYPES as readonly string[]).includes(value);
}

function isActivityStatus(value: unknown): value is ActivityStatus {
  return value === "running" || value === "paused" || value === "stopped";
}

function isSegment(value: unknown): value is Segment {
  if (!isRecord(value)) return false;
  return typeof value.start === "number" && (value.end === null || typeof value.end === "number");
}

function isActivity(value: unknown): value is Activity {
  if (!isRecord(value)) return false;
  return (
    typeof value.id === "string" &&
    isActivityType(value.type) &&
    typeof value.title === "string" &&
    typeof value.description === "string" &&
    Array.isArray(value.segments) &&
    value.segments.every(isSegment) &&
    isActivityStatus(value.status)
  );
}

function isValidDay(value: unknown): value is DayLog {
  if (!isRecord(value)) return false;
  return (
    typeof value.date === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(value.date) &&
    typeof value.budgetHours === "number" &&
    Number.isFinite(value.budgetHours) &&
    value.budgetHours > 0 &&
    Array.isArray(value.activities) &&
    value.activities.every(isActivity)
  );
}

function loadStoredDay(): DayLog | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === null) return null;
    const parsed: unknown = JSON.parse(raw);
    return isValidDay(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function save(): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(day.value));
  } catch {
    // Storage unavailable (private mode or quota); keep working in memory.
  }
}

/** The local calendar day the log should cover, honouring RESET_HOUR. */
function currentEffectiveDate(reference: Date): string {
  if (RESET_HOUR === 0) return todayLocalDate(reference);
  if (reference.getHours() >= RESET_HOUR) return todayLocalDate(reference);
  return todayLocalDate(new Date(reference.getTime() - MS_PER_DAY));
}

function checkDailyReset(): void {
  if (day.value.date === currentEffectiveDate(new Date())) return;
  day.value = createEmptyDay(day.value.budgetHours);
  save();
}

function closeOpenSegment(activity: Activity, endMs: number): boolean {
  const open = activity.segments.find((segment) => segment.end === null);
  if (!open) return false;
  open.end = endMs;
  return true;
}

function pauseRunning(exceptId?: string): void {
  for (const activity of day.value.activities) {
    if (activity.status === "running" && activity.id !== exceptId) {
      closeOpenSegment(activity, Date.now());
      activity.status = "paused";
    }
  }
}

function startActivity({ type, title, description }: StartPayload): void {
  const trimmed = title.trim();
  if (!trimmed) return;
  pauseRunning();
  const activity: Activity = {
    id: uid(),
    type,
    title: trimmed,
    description: description.trim(),
    segments: [{ start: Date.now(), end: null }],
    status: "running"
  };
  day.value.activities.unshift(activity);
  save();
}

function pauseActivity(id: string): void {
  const activity = day.value.activities.find((item) => item.id === id);
  if (!activity || activity.status !== "running") return;
  closeOpenSegment(activity, Date.now());
  activity.status = "paused";
  save();
}

function resumeActivity(id: string): void {
  const activity = day.value.activities.find((item) => item.id === id);
  if (!activity || activity.status !== "paused") return;
  pauseRunning();
  activity.segments.push({ start: Date.now(), end: null });
  activity.status = "running";
  save();
}

function stopActivity(id: string): void {
  const activity = day.value.activities.find((item) => item.id === id);
  if (!activity || activity.status === "stopped") return;
  closeOpenSegment(activity, Date.now());
  activity.status = "stopped";
  save();
}

/** Move a stopped activity back to the live tracker as paused, segments untouched. */
function restoreActivity(id: string): void {
  const activity = day.value.activities.find((item) => item.id === id);
  if (!activity || activity.status !== "stopped") return;
  activity.status = "paused";
  save();
}

function setBudgetHours(hours: number): void {
  if (!Number.isFinite(hours) || hours <= 0) return;
  day.value.budgetHours = hours;
  save();
}

function updateActivity({ id, title, description }: UpdatePayload): void {
  const trimmed = title.trim();
  const activity = day.value.activities.find((item) => item.id === id);
  if (!activity || !trimmed) return;
  activity.title = trimmed;
  activity.description = description.trim();
  save();
}

const STATUS_ORDER: Record<ActivityStatus, number> = { running: 0, paused: 1, stopped: 2 };

const activeActivities = computed<Activity[]>(() =>
  day.value.activities
    .filter((a) => a.status !== "stopped")
    .sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status])
);

/** Live activities grouped by activity type; groups follow ACTIVITY_TYPES order, running first inside each. */
const activeGroups = computed<{ type: ActivityType; activities: Activity[] }[]>(() => {
  const byType = new Map<ActivityType, Activity[]>();
  for (const type of ACTIVITY_TYPES) byType.set(type, []);
  for (const activity of day.value.activities) {
    if (activity.status === "stopped") continue;
    const list = byType.get(activity.type);
    if (list) list.push(activity);
  }
  return Array.from(byType, ([type, activities]) => ({ type, activities }))
    .filter((group) => group.activities.length > 0)
    .map((group) => {
      group.activities.sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status]);
      return group;
    });
});
const stoppedActivities = computed<Activity[]>(() => day.value.activities.filter((a) => a.status === "stopped"));
const consumedMs = computed<number>(() =>
  totalElapsedMs(day.value.activities.flatMap((a) => a.segments), now.value)
);
/** Canonical (minute-rounded) total per activity, the value shared by panel and Excel export. */
function activityTotalMs(activity: Activity): number {
  return roundToNearestMinute(totalElapsedMs(activity.segments, now.value));
}
const grandTotalMs = computed<number>(() =>
  stoppedActivities.value.reduce((sum, activity) => sum + activityTotalMs(activity), 0)
);
/** Canonical (minute-rounded) time recorded by running/paused activities — not yet in totals. */
const inProgressMs = computed<number>(() =>
  roundToNearestMinute(
    totalElapsedMs(
      day.value.activities
        .filter((a) => a.status !== "stopped")
        .flatMap((a) => a.segments),
      now.value
    )
  )
);
const perTypeTotals = computed<TypeTotal[]>(() => {
  const totals = new Map<ActivityType, number>();
  for (const activity of stoppedActivities.value) {
    const ms = activityTotalMs(activity);
    totals.set(activity.type, (totals.get(activity.type) ?? 0) + ms);
  }
  return Array.from(totals, ([type, ms]) => ({ type, ms })).sort((a, b) => b.ms - a.ms);
});

function initialize(): void {
  if (initialized || !import.meta.client) return;
  initialized = true;
  const stored = loadStoredDay();
  if (stored) {
    day.value =
      stored.date === currentEffectiveDate(new Date())
        ? stored
        : createEmptyDay(stored.budgetHours);
  }
  now.value = Date.now();
  clockTimer = setInterval(() => {
    now.value = Date.now();
  }, 1_000);
  resetTimer = setInterval(checkDailyReset, 60_000);
}

export function useTimeLog() {
  initialize();
  return {
    day,
    now,
    activeActivities,
    activeGroups,
    stoppedActivities,
    consumedMs,
    grandTotalMs,
    inProgressMs,
    perTypeTotals,
    startActivity,
    pauseActivity,
    resumeActivity,
    stopActivity,
    restoreActivity,
    setBudgetHours,
    updateActivity
  };
}

export function stopTimersForTests(): void {
  if (clockTimer) clearInterval(clockTimer);
  if (resetTimer) clearInterval(resetTimer);
  clockTimer = undefined;
  resetTimer = undefined;
  initialized = false;
}
