<script setup lang="ts">
import { ref } from "vue";
import type { Activity } from "~/types";
import { formatDuration, formatSegmentRange, totalElapsedMs } from "~/utils/time";

defineProps<{
  activities: Activity[];
  grandTotalMs: number;
  inProgressMs: number;
}>();

const emit = defineEmits<{
  (e: "edit", id: string): void;
  (e: "restore", id: string): void;
}>();

const expandedIds = ref<string[]>([]);

function isExpanded(id: string): boolean {
  return expandedIds.value.includes(id);
}

function toggleTimes(id: string): void {
  expandedIds.value = isExpanded(id)
    ? expandedIds.value.filter((it) => it !== id)
    : [...expandedIds.value, id];
}

function totalTime(activity: Activity): string {
  return formatDuration(totalElapsedMs(activity.segments, Date.now()));
}
</script>

<template>
  <div class="flex flex-col gap-4" aria-labelledby="totals-heading">
    <p class="text-sm text-base-content/70">Completed activities and the time spent on each.</p>

      <p
        v-if="activities.length === 0"
        class="rounded-lg border border-dashed border-base-300 p-6 text-center text-sm text-base-content/60"
      >
        No completed activities yet. Stop a running activity to move it here.
      </p>

      <p
        v-if="inProgressMs > 0"
        class="rounded-lg border border-info bg-base-200 px-3 py-2 text-xs text-base-content/80"
      >
        In progress (not yet in totals): {{ formatDuration(inProgressMs) }}.
        Stop running activities to include their time here and in the Excel export.
      </p>

      <template v-if="activities.length > 0">
        <article
          v-for="activity in activities"
          :key="activity.id"
          class="rounded-lg border-2 border-base-300 px-4 py-2"
        >
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div class="max-w-[60%] text-left">
              <h3 class="text-sm font-semibold">{{ activity.title }}</h3>
              <p v-if="activity.description" class="mt-1 text-xs text-base-content/70">{{ activity.description }}</p>
            </div>
            <div class="flex flex-col items-center gap-2">
              <div class="flex items-center gap-2">
                <span class="font-mono text-base tabular-nums">{{ totalTime(activity) }}</span>
                <button
                  type="button"
                  class="btn btn-circle btn-ghost btn-xs"
                  aria-label="Edit"
                  title="Edit title and description"
                  @click="emit('edit', activity.id)"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="h-3 w-3" aria-hidden="true">
                    <path d="M4 17.2V20h2.8l8.4-8.4-2.8-2.8L4 17.2ZM20.1 8.1a1 1 0 0 0 0-1.4l-2.7-2.7a1 1 0 0 0-1.4 0l-1.5 1.5 2.8 2.8 1.5-1.5 1.3 1.3Z" />
                  </svg>
                </button>
                <button
                  type="button"
                  class="btn btn-circle btn-ghost btn-xs"
                  aria-label="Restore to live tracker"
                  title="Back to live tracker"
                  @click="emit('restore', activity.id)"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="h-3 w-3" aria-hidden="true">
                    <path d="M9 14 4 9l5-5 1.4 1.4L7.8 8H14a6 6 0 0 1 0 12H9v-2h5a4 4 0 0 0 0-8H7.8l2.6 2.6L9 14Z" />
                  </svg>
                </button>
              </div>
              <button
                type="button"
                class="btn btn-ghost btn-xs text-base-content/70"
                :aria-expanded="isExpanded(activity.id)"
                @click="toggleTimes(activity.id)"
              >
                {{ isExpanded(activity.id) ? "Hide times" : "Show times" }}
              </button>
            </div>
          </div>

          <ul
            v-show="isExpanded(activity.id)"
            class="mt-2 flex flex-wrap gap-2 text-xs font-mono text-base-content/80"
          >
            <li
              v-for="(segment, index) in activity.segments"
              :key="index"
              class="rounded bg-base-200 px-2 py-1"
            >
              {{ formatSegmentRange(segment, Date.now()) }}
            </li>
          </ul>
        </article>

        <p class="text-right text-sm">
          Grand total:
          <strong class="font-mono text-base tabular-nums">{{ formatDuration(grandTotalMs) }}</strong>
        </p>
      </template>
  </div>
</template>
