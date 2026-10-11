<script setup lang="ts">
import { ref } from "vue";
import { ACTIVITY_TYPES } from "~/constants";
import type { ActivityType } from "~/types";

export interface ActivityFormStartPayload {
  type: ActivityType;
  title: string;
  description: string;
}

const emit = defineEmits<{
  (e: "start", payload: ActivityFormStartPayload): void;
}>();

const dialogEl = ref<HTMLDialogElement | null>(null);
const type = ref<ActivityType>("Development");
const title = ref("");
const description = ref("");
const titleError = ref("");

function open(): void {
  titleError.value = "";
  dialogEl.value?.showModal();
}

function close(): void {
  titleError.value = "";
  dialogEl.value?.close();
}

function submit(): void {
  const trimmed = title.value.trim();
  if (!trimmed) {
    titleError.value = "Please enter a title before starting.";
    return;
  }
  titleError.value = "";
  emit("start", {
    type: type.value,
    title: trimmed,
    description: description.value.trim()
  });
  title.value = "";
  description.value = "";
  dialogEl.value?.close();
}

function onBackdropClick(event: MouseEvent): void {
  if (event.target === dialogEl.value) close();
}

defineExpose({ open });
</script>

<template>
  <dialog ref="dialogEl" class="modal" @click="onBackdropClick">
    <div class="modal-box">
      <div class="flex items-start justify-between gap-4">
        <div>
          <h3 class="text-base font-semibold">New activity</h3>
          <p class="text-sm text-base-content/70">Starting a new activity pauses the one that is running.</p>
        </div>
        <button type="button" class="btn btn-circle btn-ghost btn-sm" aria-label="Close" title="Close" @click="close">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="h-4 w-4" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" stroke-linecap="round" />
          </svg>
        </button>
      </div>

      <form class="mt-4 grid gap-4" novalidate @submit.prevent="submit">
        <label class="form-control">
          <span class="label-text mb-1 block text-xs font-medium">Activity type</span>
          <select v-model="type" class="select select-bordered select-sm w-full">
            <option v-for="option in ACTIVITY_TYPES" :key="option" :value="option">{{ option }}</option>
          </select>
        </label>

        <label class="form-control">
          <span class="label-text mb-1 block text-xs font-medium">Title</span>
          <input
            v-model="title"
            type="text"
            class="input input-bordered input-sm w-full"
            :class="{ 'input-error': titleError }"
            placeholder="e.g. Fix checkout bug"
            aria-required="true"
            :aria-invalid="titleError ? 'true' : 'false'"
            :aria-describedby="titleError ? 'title-error' : undefined"
          />
          <p v-if="titleError" id="title-error" role="alert" class="mt-1 text-xs text-error">
            {{ titleError }}
          </p>
        </label>

        <label class="form-control">
          <span class="label-text mb-1 block text-xs font-medium">Description (optional)</span>
          <textarea
            v-model="description"
            class="textarea textarea-bordered h-16 text-sm"
            placeholder="Optional notes for the daily report"
          ></textarea>
        </label>

        <div class="mt-2 flex justify-end gap-2">
          <button type="button" class="btn btn-ghost btn-sm" @click="close">Cancel</button>
          <button type="submit" class="btn btn-primary btn-sm">Start</button>
        </div>
      </form>
    </div>
  </dialog>
</template>
