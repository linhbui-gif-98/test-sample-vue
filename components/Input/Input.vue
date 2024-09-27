<!-- Input.vue -->
<template>
  <input
      class="border border-gray-400 border-solid w-full p-[10px_15px] rounded"
      :value="modelValue"
      :class="size"
      :type="type"
      :placeholder="placeholder"
      @input="handleInputChange"
      @keyup="handleInputKeyup"
      @focus="handleInputFocus"
      @blur="handleInputBlur"
  />
</template>

<script lang="ts" setup>
import { defineProps, defineEmits } from 'vue';
const props = withDefaults(
    defineProps<{
      placeholder?: string,
      type?: string,
      modelValue?: string,
      size?: string,
    }>(),
    {
      size: 'medium',
    },
)

const emits = defineEmits(['update:modelValue', 'focus', 'blur', 'keyup']);
const handleInputChange = (e: Event) => {
  const target = e.target as HTMLInputElement;
  emits('update:modelValue', target.value);
};

const handleInputFocus = (e: Event) => emits('focus', e);
const handleInputBlur = (e: Event) => emits('blur', e);
const handleInputKeyup = (e: KeyboardEvent) => emits('keyup', e);
</script>