<script setup lang="ts">
import { onMounted, ref, watch } from "vue";
import ActivityForm from "~/components/ActivityForm.vue";
import { useTimeLog } from "~/composables/useTimeLog";
import type { UpdatePayload } from "~/composables/useTimeLog";
import { THEME_KEY } from "~/constants";
import type { Activity } from "~/types";
import { formatDuration, formatSegmentList, totalElapsedMs } from "~/utils/time";

const {
  day,
  now,
  activeGroups,
  stoppedActivities,
  consumedMs,
  grandTotalMs,
  inProgressMs,
  startActivity,
  pauseActivity,
  resumeActivity,
  stopActivity,
  restoreActivity,
  setBudgetHours,
  updateActivity
} = useTimeLog();

const editingActivity = ref<Activity | null>(null);

function openEdit(id: string): void {
  editingActivity.value = day.value.activities.find((item) => item.id === id) ?? null;
}

function handleEditSave(payload: UpdatePayload): void {
  updateActivity(payload);
  editingActivity.value = null;
}

const theme = ref<"light" | "dark">("light");

useHead({ htmlAttrs: { "data-theme": theme } });

watch(theme, (value) => {
  try {
    window.localStorage.setItem(THEME_KEY, value);
  } catch {
    // Storage unavailable; theme just will not persist.
  }
});

onMounted(() => {
  try {
    const stored = window.localStorage.getItem(THEME_KEY);
    if (stored === "light" || stored === "dark") theme.value = stored;
  } catch {
    // Storage unavailable; keep default theme.
  }
});

const activityForm = ref<InstanceType<typeof ActivityForm> | null>(null);

function openActivityForm(): void {
  activityForm.value?.open();
}

const totalsOpen = ref(false);

const exporting = ref(false);

async function downloadExcel(): Promise<void> {
  if (exporting.value) return;
  exporting.value = true;
  try {
    const XLSX = await import("xlsx");
    interface ExportRow {
      Title: string;
      Description: string;
      Activity: string;
      "Total hours": string;
      Times: string;
    }
    const rows: ExportRow[] = stoppedActivities.value.map((activity) => ({
      Title: activity.title,
      Description: activity.description,
      Activity: activity.type,
      "Total hours": formatDuration(totalElapsedMs(activity.segments, now.value)),
      Times: formatSegmentList(activity.segments, now.value)
    }));
    rows.push({
      Title: "Grand total",
      Description: "",
      Activity: "",
      "Total hours": formatDuration(grandTotalMs.value),
      Times: ""
    });
    const worksheet = XLSX.utils.json_to_sheet(rows, {
      header: ["Title", "Description", "Activity", "Total hours", "Times"]
    });
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Daily Log");
    XLSX.writeFile(workbook, `daily-log-${day.value.date}.xlsx`);
  } catch {
    // Export failed (e.g. popup or download blocked); stay silent rather than crash.
  } finally {
    exporting.value = false;
  }
}
</script>

<template>
  <div class="flex min-h-screen flex-col bg-base-200 text-base-content">
    <header class="sticky top-0 z-10 border-b border-base-300 bg-base-100/90 backdrop-blur">
      <div class="mx-auto flex w-full max-w-3xl items-center justify-between gap-4 px-4 py-3">
        <div>
          <p class="text-lg font-semibold leading-tight">Hourwise</p>
          <p class="text-xs text-base-content/70">Daily time tracking</p>
        </div>
        <button
          type="button"
          class="btn btn-ghost btn-sm"
          :aria-pressed="theme === 'dark'"
          @click="theme = theme === 'light' ? 'dark' : 'light'"
        >
          {{ theme === "light" ? "Dark mode" : "Light mode" }}
        </button>
      </div>
    </header>

    <main class="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-6">
      <BudgetBar :budget-hours="day.budgetHours" :consumed-ms="consumedMs" @update:budget-hours="setBudgetHours" />

      <LiveTracker
        :groups="activeGroups"
        :now-ms="now"
        @pause="pauseActivity"
        @resume="resumeActivity"
        @stop="stopActivity"
        @add="openActivityForm"
        @totals="totalsOpen = true"
      />

      <ActivityForm ref="activityForm" @start="startActivity" />

      <TotalsModal
        :open="totalsOpen"
        :activities="stoppedActivities"
        :grand-total-ms="grandTotalMs"
        :in-progress-ms="inProgressMs"
        :exporting="exporting"
        @download="downloadExcel"
        @edit="openEdit"
        @restore="restoreActivity"
        @close="totalsOpen = false"
      />

      <ActivityEditModal
        :activity="editingActivity"
        @save="handleEditSave"
        @close="editingActivity = null"
      />
    </main>

    <footer class="sticky bottom-0 z-10 border-t border-base-300 bg-base-100 py-4 text-center text-xs text-base-content/70">
      <p>Resets daily at 12:00 AM. Download your Excel file before then.</p>
    </footer>
  </div>
</template>
