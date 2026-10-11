<script setup lang="ts">
import type { Activity } from "~/types";
import type { ActivityGroup } from "~/composables/useTimeLog";
import { formatStopwatch, totalElapsedMs } from "~/utils/time";

const props = defineProps<{
  groups: ActivityGroup[];
  nowMs: number;
}>();

const emit = defineEmits<{
  (e: "pause", id: string): void;
  (e: "resume", id: string): void;
  (e: "stop", id: string): void;
  (e: "add"): void;
  (e: "totals"): void;
}>();

function elapsed(activity: Activity): string {
  return formatStopwatch(totalElapsedMs(activity.segments, props.nowMs));
}
</script>

<template>
  <section class="card bg-base-100 shadow-sm" aria-labelledby="live-tracker-heading">
    <div class="card-body gap-4">
      <div class="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 id="live-tracker-heading" class="card-title text-base">Live tracker</h2>
          <p class="text-sm text-base-content/70">Starting a new activity pauses the one that is running.</p>
        </div>
        <div class="flex flex-wrap gap-2">
          <button type="button" class="btn btn-primary btn-sm" @click="emit('add')">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="h-4 w-4" aria-hidden="true">
              <path d="M12 5v14M5 12h14" stroke-linecap="round" />
            </svg>
            Add activity
          </button>
          <button type="button" class="btn btn-sm" @click="emit('totals')">Totals</button>
        </div>
      </div>

      <p v-if="groups.length === 0" class="rounded-lg border border-dashed border-base-300 p-6 text-center text-sm text-base-content/60">
        Nothing in progress. Start an activity above.
      </p>

      <div
        v-for="group in groups"
        :key="group.type"
        class="flex flex-col gap-2"
      >
        <p class="text-xs font-semibold uppercase tracking-wider text-base-content/60">{{ group.type }}</p>

        <TransitionGroup tag="div" name="tracker" class="flex flex-col gap-2">
          <article
            v-for="activity in group.activities"
            :key="activity.id"
            class="rounded-lg border-2 px-4 py-2 transition-colors"
            :class="activity.status === 'running' ? 'border-success shadow-md shadow-success/20' : 'border-base-300'"
        >
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div class="max-w-[60%] text-left">
              <h3 class="text-sm font-semibold">{{ activity.title }}</h3>
              <p v-if="activity.description" class="mt-1 text-xs text-base-content/70">{{ activity.description }}</p>
            </div>
            <div class="flex flex-col items-center gap-2">
              <span class="font-mono text-base tabular-nums" :aria-label="'Elapsed time'">{{ elapsed(activity) }}</span>
              <div class="flex flex-wrap gap-2">
                <button
                  v-if="activity.status === 'running'"
                  type="button"
                  class="btn btn-circle btn-xs"
                  aria-label="Pause"
                  title="Pause"
                  @click="emit('pause', activity.id)"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="h-3 w-3" aria-hidden="true">
                    <rect x="6" y="4" width="4" height="16" rx="1" />
                    <rect x="14" y="4" width="4" height="16" rx="1" />
                  </svg>
                </button>
                <button
                  v-else
                  type="button"
                  class="btn btn-circle btn-xs btn-success"
                  aria-label="Resume"
                  title="Resume"
                  @click="emit('resume', activity.id)"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="h-3 w-3" aria-hidden="true">
                    <path d="M8 5.5v13a1 1 0 0 0 1.53.85l10-6.5a1 1 0 0 0 0-1.7l-10-6.5A1 1 0 0 0 8 5.5Z" />
                  </svg>
                </button>
                <button
                  type="button"
                  class="btn btn-circle btn-xs btn-error"
                  aria-label="Stop"
                  title="Stop"
                  @click="emit('stop', activity.id)"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="h-3 w-3" aria-hidden="true">
                    <rect x="6" y="6" width="12" height="12" rx="2" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
          </article>
        </TransitionGroup>
      </div>
    </div>
  </section>
</template>

<style scoped>
.tracker-move {
  transition: transform 0.3s ease;
}

.tracker-enter-active,
.tracker-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}

.tracker-enter-from,
.tracker-leave-to {
  opacity: 0;
  transform: translateY(6px);
}
</style>
