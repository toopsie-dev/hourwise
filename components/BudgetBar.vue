<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { BUDGET_OPTIONS } from "~/constants";
import { budgetProgress, formatDuration } from "~/utils/time";

const props = defineProps<{
  budgetHours: number;
  consumedMs: number;
}>();

const emit = defineEmits<{
  (e: "update:budgetHours", hours: number): void;
}>();

const isInOptions = computed(() => BUDGET_OPTIONS.includes(props.budgetHours));

const selected = ref<string>(isInOptions.value ? String(props.budgetHours) : "custom");
const customValue = ref<string>(isInOptions.value ? "" : String(props.budgetHours));

watch(
  () => props.budgetHours,
  (hours) => {
    if (BUDGET_OPTIONS.includes(hours)) {
      selected.value = String(hours);
      customValue.value = "";
    } else {
      selected.value = "custom";
      customValue.value = String(hours);
    }
  }
);

function applyCustom(): void {
  const hours = Number(customValue.value);
  if (Number.isFinite(hours) && hours >= 1 && hours <= 24) {
    emit("update:budgetHours", hours);
  }
}

watch(selected, (value) => {
  if (value === "custom") {
    if (customValue.value) applyCustom();
  } else {
    emit("update:budgetHours", Number(value));
  }
});

const progress = computed(() => budgetProgress(props.consumedMs, props.budgetHours));
const percentLabel = computed(() => Math.round(progress.value.percent));
</script>

<template>
  <section class="card bg-base-100 shadow-sm" aria-labelledby="budget-heading">
    <div class="card-body gap-4">
      <div class="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 id="budget-heading" class="card-title text-base">Shift plan</h2>
          <p class="text-sm text-base-content/70">Length of today's work shift.</p>
        </div>
        <div class="flex items-end gap-2">
          <label class="form-control">
            <span class="label-text mb-1 block text-xs font-medium">Working hours</span>
            <select v-model="selected" class="select select-bordered select-sm w-32">
              <option v-for="option in BUDGET_OPTIONS" :key="option" :value="String(option)">
                {{ option }} hours
              </option>
              <option value="custom">Custom</option>
            </select>
          </label>
          <label v-if="selected === 'custom'" class="form-control">
            <span class="label-text mb-1 block text-xs font-medium">Custom hours</span>
            <input
              v-model="customValue"
              type="number"
              min="1"
              max="24"
              step="0.5"
              class="input input-bordered input-sm w-24"
              aria-label="Custom budget hours"
              @change="applyCustom"
            />
          </label>
        </div>
      </div>

      <progress
        class="progress progress-success"
        :value="progress.percent"
        max="100"
        aria-label="Daily shift consumed"
      ></progress>

      <div class="flex flex-wrap items-center justify-between gap-2 text-sm">
        <span>
          Consumed:
          <strong class="font-mono">{{ formatDuration(progress.consumedMs) }}</strong>
        </span>
        <span v-if="!progress.isOvertime">
          Remaining:
          <strong class="font-mono">{{ formatDuration(progress.remainingMs) }}</strong>
        </span>
        <span v-else class="text-warning">
          Overtime:
          <strong class="font-mono">{{ formatDuration(progress.overtimeMs) }}</strong>
        </span>
        <span class="font-mono">{{ percentLabel }}%</span>
      </div>
    </div>
  </section>
</template>
