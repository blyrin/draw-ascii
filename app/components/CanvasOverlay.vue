<script lang="ts" setup>
import type { CellPos, CellRect, ResizeHandle } from '~/types/canvas'

defineProps<{
  cellWidth: number
  cellHeight: number
  previewCells?: { row: number; col: number; char: string }[]
  selection?: CellRect | null
  cursorPos?: CellPos | null
  placingPreview?: { data: string[][]; row: number; col: number } | null
  resizeHandles?: { row: number; col: number; handle: ResizeHandle }[] | null
  resizePreview?: { row: number; col: number; char: string }[] | null
}>()

const cursorVisible = ref(true)
let blinkTimer: ReturnType<typeof setInterval> | undefined

onMounted(() => {
  blinkTimer = setInterval(() => {
    cursorVisible.value = !cursorVisible.value
  }, 530)
})

onBeforeUnmount(() => {
  if (blinkTimer) clearInterval(blinkTimer)
})
</script>

<template>
  <div class="canvas-overlay">
    <!-- 绘制中的预览单元格 -->
    <div
      v-for="(cell, i) in previewCells"
      :key="'p' + i"
      :style="{
        left: cell.col * cellWidth + 'px',
        top: cell.row * cellHeight + 'px',
        width: cellWidth + 'px',
        height: cellHeight + 'px',
        lineHeight: cellHeight + 'px',
      }"
      class="preview-cell font-mono"
    >{{ cell.char }}
    </div>

    <!-- 模板放置预览 -->
    <template v-if="placingPreview">
      <div
        v-for="(row, ri) in placingPreview.data"
        :key="'tp' + ri"
        :style="{
          left: placingPreview.col * cellWidth + 'px',
          top: (placingPreview.row + ri) * cellHeight + 'px',
          height: cellHeight + 'px',
          lineHeight: cellHeight + 'px',
        }"
        class="template-preview-row font-mono"
      >{{ row.join('') }}
      </div>
    </template>

    <!-- 选择区高亮 -->
    <div
      v-if="selection"
      :style="{
        left: selection.startCol * cellWidth + 'px',
        top: selection.startRow * cellHeight + 'px',
        width: (selection.endCol - selection.startCol + 1) * cellWidth + 'px',
        height: (selection.endRow - selection.startRow + 1) * cellHeight + 'px',
      }"
      class="selection-rect"
    />

    <!-- 缩放控制点 -->
    <div
      v-for="(h, i) in resizeHandles"
      :key="'rh' + i"
      :style="{
        left: h.col * cellWidth - 3 + 'px',
        top: h.row * cellHeight - 3 + 'px',
        width: '7px',
        height: '7px',
      }"
      class="resize-handle"
    />

    <!-- 缩放预览 -->
    <div
      v-for="(cell, i) in resizePreview"
      :key="'rp' + i"
      :style="{
        left: cell.col * cellWidth + 'px',
        top: cell.row * cellHeight + 'px',
        width: cellWidth + 'px',
        height: cellHeight + 'px',
        lineHeight: cellHeight + 'px',
      }"
      class="preview-cell font-mono"
    >{{ cell.char }}
    </div>

    <!-- 文本光标 -->
    <div
      v-if="cursorPos && cursorVisible"
      :style="{
        left: cursorPos.col * cellWidth + 'px',
        top: cursorPos.row * cellHeight + 'px',
        width: cellWidth + 'px',
        height: cellHeight + 'px',
      }"
      class="text-cursor"
    />
  </div>
</template>

<style scoped>
.canvas-overlay {
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none;
}

.preview-cell {
  position: absolute;
  text-align: center;
  font-size: 14px;
  color: var(--color-primary);
  background: color-mix(in srgb, var(--color-primary) 15%, transparent);
}

.template-preview-row {
  position: absolute;
  white-space: pre;
  font-size: 14px;
  color: var(--color-primary);
  opacity: 0.7;
}

.selection-rect {
  position: absolute;
  background: color-mix(in srgb, var(--color-primary) 20%, transparent);
  border: 1px solid var(--color-primary);
  border-radius: 1px;
}

.resize-handle {
  position: absolute;
  background: var(--color-primary);
  border: 1px solid white;
  border-radius: 1px;
  pointer-events: none;
  z-index: 10;
}

.text-cursor {
  position: absolute;
  border-left: 2px solid var(--color-primary);
}
</style>
