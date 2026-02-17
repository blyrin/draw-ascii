<script lang="ts" setup>
import type { LineStyle, ToolType } from '~/types/canvas'

defineProps<{
  activeTool: ToolType
  lineStyle: LineStyle
  canUndo: boolean
  canRedo: boolean
}>()

const emit = defineEmits<{
  'update:activeTool': [tool: ToolType]
  'update:lineStyle': [style: LineStyle]
  'undo': []
  'redo': []
  'clear': []
  'export': []
}>()

const tools: { id: ToolType; icon: string; label: string; shortcut: string }[] = [
  { id: 'select', icon: 'i-lucide-pointer', label: '选择', shortcut: 'V' },
  { id: 'rectangle', icon: 'i-lucide-square', label: '矩形', shortcut: 'R' },
  { id: 'line', icon: 'i-lucide-minus', label: '线条', shortcut: 'L' },
  { id: 'text', icon: 'i-lucide-type', label: '文本', shortcut: 'T' },
  { id: 'erase', icon: 'i-lucide-eraser', label: '擦除', shortcut: 'E' },
]

const lineStyles: { id: LineStyle; label: string }[] = [
  { id: 'solid', label: '实线 ───' },
  { id: 'arrow-end', label: '单箭头 ──→' },
  { id: 'arrow-both', label: '双箭头 ←─→' },
]
</script>

<template>
  <div class="select-none flex items-center gap-1 px-3 py-1.5 border-b border-default">
    <img alt="Draw ASCII Logo" class="w-6 h-6" draggable="false" src="/favicon.svg" />
    <span class="font-bold">Draw ASCII</span>
    <USeparator class="h-6 mx-1" orientation="vertical" />

    <div class="flex-1" />

    <!-- Tool buttons -->
    <UTooltip v-for="tool in tools" :key="tool.id" :text="`${tool.label} (${tool.shortcut})`">
      <UButton
        :color="activeTool === tool.id ? 'primary' : 'neutral'"
        :icon="tool.icon"
        :variant="activeTool === tool.id ? 'solid' : 'ghost'"
        size="sm"
        @click="emit('update:activeTool', tool.id)"
      />
    </UTooltip>

    <!-- Line style (only when line tool active) -->
    <USeparator class="h-6 mx-1" orientation="vertical" />
    <USelect
      :disabled="activeTool !== 'line'"
      :items="lineStyles.map((s: any) => ({ label: s.label, value: s.id }))"
      :model-value="lineStyle"
      class="w-36 font-mono line-select"
      size="sm"
      @update:model-value="emit('update:lineStyle', $event as LineStyle)"
    />

    <div class="flex-1" />

    <USeparator class="h-6 mx-1" orientation="vertical" />

    <!-- Undo / Redo -->
    <UTooltip text="撤销 (Ctrl+Z)">
      <UButton :disabled="!canUndo" color="neutral" icon="i-lucide-undo-2" size="sm" variant="ghost"
               @click="emit('undo')" />
    </UTooltip>
    <UTooltip text="重做 (Ctrl+Y)">
      <UButton :disabled="!canRedo" color="neutral" icon="i-lucide-redo-2" size="sm" variant="ghost"
               @click="emit('redo')" />
    </UTooltip>

    <USeparator class="h-6 mx-1" orientation="vertical" />

    <!-- Clear & Export -->
    <UTooltip text="清空画布">
      <UButton color="neutral" icon="i-lucide-trash-2" size="sm" variant="ghost" @click="emit('clear')" />
    </UTooltip>
    <UTooltip text="导出">
      <UButton color="neutral" icon="i-lucide-download" size="sm" variant="ghost" @click="emit('export')" />
    </UTooltip>
  </div>
</template>
