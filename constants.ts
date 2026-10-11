import type { ActivityType } from "./types";

export const ACTIVITY_TYPES: readonly ActivityType[] = [
  "Meeting",
  "Planning",
  "Development",
  "Testing",
  "Troubleshooting",
  "Improvement/Refactoring",
  "Deployment",
  "Documentation",
  "Support",
  "Training",
  "Idle"
];

export const BUDGET_OPTIONS: readonly number[] = [8, 10, 12];

export const DEFAULT_BUDGET_HOURS = 8;

/** Local hour (0-23) at which the daily log resets. 0 = 12:00 AM. */
export const RESET_HOUR = 0;

export const STORAGE_KEY = "hourwise-daylog-v1";

export const THEME_KEY = "hourwise-theme";

export const ACTIVITY_BADGE_CLASSES: Record<ActivityType, string> = {
  Meeting: "badge-info",
  Planning: "badge-primary",
  Development: "badge-success",
  Testing: "badge-accent",
  Troubleshooting: "badge-warning",
  "Improvement/Refactoring": "badge-secondary",
  Deployment: "badge-error",
  Documentation: "badge-neutral",
  Support: "badge-outline badge-warning",
  Training: "badge-outline badge-info",
  Idle: "badge-ghost"
};
