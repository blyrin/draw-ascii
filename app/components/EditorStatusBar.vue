<script lang="ts" setup>
import type { CellPos, ToolType } from '~/types/canvas'

defineProps<{
  cursorPos: CellPos | null
  activeTool: ToolType
  canvasWidth: number
  canvasHeight: number
}>()

const toolLabels: Record<ToolType, string> = {
  select: '选择',
  rectangle: '矩形',
  line: '线条',
  text: '文本',
  erase: '擦除',
}
</script>

<template>
  <div
    class="flex items-center justify-between px-3 py-1 text-xs text-muted border-t border-default bg-default">
    <div class="flex items-center gap-4">
      <span>工具: {{ toolLabels[activeTool] }}</span>
      <span v-if="cursorPos">行: {{ cursorPos.row }} 列: {{ cursorPos.col }}</span>
    </div>
    <div class="flex items-center gap-4">
      <span>{{ canvasWidth }} × {{ canvasHeight }}</span>
    </div>
  </div>
</template>
