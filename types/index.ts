export type ActivityType =
  | "Meeting"
  | "Planning"
  | "Development"
  | "Testing"
  | "Troubleshooting"
  | "Improvement/Refactoring"
  | "Deployment"
  | "Documentation"
  | "Support"
  | "Training"
  | "Idle";

export interface Segment {
  /** Epoch milliseconds. */
  start: number;
  /** Epoch milliseconds, or null while the segment is still open. */
  end: number | null;
}

export type ActivityStatus = "running" | "paused" | "stopped";

export interface Activity {
  id: string;
  type: ActivityType;
  title: string;
  description: string;
  segments: Segment[];
  status: ActivityStatus;
}

export interface DayLog {
  /** Local date, YYYY-MM-DD. */
  date: string;
  budgetHours: number;
  activities: Activity[];
}

export interface TypeTotal {
  type: ActivityType;
  ms: number;
}
