<script setup lang="ts">
import { ref, watch } from "vue";
import type { Activity } from "~/types";
import type { UpdatePayload } from "~/composables/useTimeLog";

const props = defineProps<{
  activity: Activity | null;
}>();

const emit = defineEmits<{
  (e: "save", payload: UpdatePayload): void;
  (e: "close"): void;
}>();

const dialogEl = ref<HTMLDialogElement | null>(null);
const title = ref("");
const description = ref("");
const titleError = ref("");

watch(
  () => props.activity,
  (activity) => {
    titleError.value = "";
    if (activity) {
      title.value = activity.title;
      description.value = activity.description;
      dialogEl.value?.showModal();
    } else {
      dialogEl.value?.close();
    }
  }
);

function close(): void {
  titleError.value = "";
  emit("close");
  dialogEl.value?.close();
}

function save(): void {
  const trimmed = title.value.trim();
  if (!props.activity) return;
  if (!trimmed) {
    titleError.value = "Please enter a title before saving.";
    return;
  }
  emit("save", {
    id: props.activity.id,
    title: trimmed,
    description: description.value.trim()
  });
  titleError.value = "";
  dialogEl.value?.close();
}

function onBackdropClick(event: MouseEvent): void {
  if (event.target === dialogEl.value) close();
}
</script>

<template>
  <dialog ref="dialogEl" class="modal" @click="onBackdropClick" @close="emit('close')">
    <div class="modal-box">
      <div class="flex items-start justify-between gap-4">
        <div>
          <h3 class="text-base font-semibold">Edit activity</h3>
          <p class="text-sm text-base-content/70">Update the title and description. Recorded time is not changed.</p>
        </div>
        <button type="button" class="btn btn-circle btn-ghost btn-sm" aria-label="Close" title="Close" @click="close">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="h-4 w-4" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" stroke-linecap="round" />
          </svg>
        </button>
      </div>

      <form class="mt-4 grid gap-4" novalidate @submit.prevent="save">
        <label class="form-control">
          <span class="label-text mb-1 block text-xs font-medium">Title</span>
          <input
            v-model="title"
            type="text"
            class="input input-bordered input-sm w-full"
            :class="{ 'input-error': titleError }"
            aria-required="true"
            :aria-invalid="titleError ? 'true' : 'false'"
            :aria-describedby="titleError ? 'edit-title-error' : undefined"
          />
          <p v-if="titleError" id="edit-title-error" role="alert" class="mt-1 text-xs text-error">
            {{ titleError }}
          </p>
        </label>

        <label class="form-control">
          <span class="label-text mb-1 block text-xs font-medium">Description (optional)</span>
          <textarea
            v-model="description"
            class="textarea textarea-bordered h-16 text-sm"
          ></textarea>
        </label>

        <div class="mt-2 flex justify-end gap-2">
          <button type="button" class="btn btn-ghost btn-sm" @click="close">Cancel</button>
          <button type="submit" class="btn btn-primary btn-sm">Save</button>
        </div>
      </form>
    </div>
  </dialog>
</template>
