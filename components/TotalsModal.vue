<script setup lang="ts">
import { ref, watch } from "vue";
import type { Activity } from "~/types";
import { formatDuration, totalElapsedMs } from "~/utils/time";

const props = defineProps<{
  open: boolean;
  activities: Activity[];
  grandTotalMs: number;
  inProgressMs: number;
  exporting: boolean;
}>();

const emit = defineEmits<{
  (e: "download"): void;
  (e: "edit", id: string): void;
  (e: "restore", id: string): void;
  (e: "close"): void;
}>();

const listEl = ref<HTMLDialogElement | null>(null);

function totalTime(activity: Activity): string {
  return formatDuration(totalElapsedMs(activity.segments, Date.now()));
}

watch(
  () => props.open,
  (open) => {
    if (open) {
      listEl.value?.showModal();
    } else {
      listEl.value?.close();
    }
  }
);

function close(): void {
  emit("close");
  listEl.value?.close();
}

function onBackdropClick(event: MouseEvent): void {
  if (event.target === listEl.value) close();
}
</script>

<template>
  <dialog ref="listEl" class="modal" @click="onBackdropClick" @close="emit('close')">
    <div class="modal-box flex w-11/12 max-w-3xl max-h-[calc(100vh-5em)] flex-col overflow-hidden">
      <div class="flex items-start justify-between gap-4">
        <div>
          <h3 class="text-base font-semibold">Totals by activity</h3>
          <p class="text-sm text-base-content/70">Completed activities and the time spent on each.</p>
        </div>
        <button type="button" class="btn btn-circle btn-ghost btn-sm" aria-label="Close" title="Close" @click="close">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="h-4 w-4" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" stroke-linecap="round" />
          </svg>
        </button>
      </div>

      <div class="mt-4 min-h-0 flex-1 overflow-y-auto pr-1">
        <TotalsPanel
          :activities="activities"
          :grand-total-ms="grandTotalMs"
          :in-progress-ms="inProgressMs"
          @edit="emit('edit', $event)"
          @restore="emit('restore', $event)"
        />
      </div>

      <div class="mt-4 flex flex-wrap items-center justify-between gap-4 border-t border-base-300 pt-4">
        <p class="text-sm text-base-content/70">
          Only stopped activities are exported. Stop running activities first.
        </p>
        <button type="button" class="btn btn-primary btn-sm" :disabled="exporting" @click="emit('download')">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="h-4 w-4" aria-hidden="true">
            <path d="M12 3v10m0 0 4-4m-4 4-4-4" stroke-linecap="round" stroke-linejoin="round" />
            <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" stroke-linecap="round" />
          </svg>
          {{ exporting ? "Preparing..." : "Download Excel" }}
        </button>
      </div>
    </div>
  </dialog>
</template>
