<script lang="ts" setup>
const props = defineProps<{
  cells: string[][]
  startRow: number
  startCol: number
  rowCount: number
  colCount: number
  cellWidth: number
  cellHeight: number
}>()

const visibleLines = computed(() => {
  const lines: { row: number; text: string }[] = []
  const endRow = Math.min(props.startRow + props.rowCount, props.cells.length)
  const endCol = props.startCol + props.colCount
  for (let r = props.startRow; r < endRow; r++) {
    const row = props.cells[r]
    if (!row) continue
    let text = ''
    const colEnd = Math.min(endCol, row.length)
    for (let c = props.startCol; c < colEnd; c++) {
      text += row[c]
    }
    lines.push({ row: r, text })
  }
  return lines
})
</script>

<template>
  <div :style="{ transform: `translate(${startCol * cellWidth}px, ${startRow * cellHeight}px)` }"
       class="canvas-rows font-mono">
    <div
      v-for="line in visibleLines"
      :key="line.row"
      :style="{ height: cellHeight + 'px', lineHeight: cellHeight + 'px' }"
      class="canvas-row font-mono"
    >{{ line.text }}
    </div>
  </div>
</template>

<style scoped>
.canvas-rows {
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none;
}

.canvas-row {
  white-space: pre;
  font-size: 14px;
  color: var(--ui-text-highlighted);
  user-select: none;
}
</style>
