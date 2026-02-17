import type { CellRect } from '~/types/canvas'

export function useSelection(
  canvas: ReturnType<typeof import('./useCanvas').useCanvas>,
  history: ReturnType<typeof import('./useHistory').useHistory>,
) {
  const selection = ref<CellRect | null>(null)
  const clipboard = ref<string[][] | null>(null)
  const isMoving = ref(false)
  const moveOffset = ref<{ row: number; col: number } | null>(null)
  const movingData = ref<string[][] | null>(null)

  function setSelection(startRow: number, startCol: number, endRow: number, endCol: number) {
    selection.value = {
      startRow: Math.min(startRow, endRow),
      startCol: Math.min(startCol, endCol),
      endRow: Math.max(startRow, endRow),
      endCol: Math.max(startCol, endCol),
    }
  }

  function clearSelection() {
    selection.value = null
    isMoving.value = false
    moveOffset.value = null
    movingData.value = null
  }

  function isInSelection(row: number, col: number): boolean {
    if (!selection.value) return false
    const s = selection.value
    return row >= s.startRow && row <= s.endRow && col >= s.startCol && col <= s.endCol
  }

  function copySelection() {
    if (!selection.value) return
    const s = selection.value
    clipboard.value = canvas.getRegion(s.startRow, s.startCol, s.endRow, s.endCol)

    // Also copy to system clipboard as text
    const text = clipboard.value.map(row => row.join('')).join('\n')
    navigator.clipboard.writeText(text).catch(() => {})
  }

  function deleteSelection() {
    if (!selection.value) return
    history.pushSnapshot()
    const s = selection.value
    canvas.clearRegion(s.startRow, s.startCol, s.endRow, s.endCol)
    clearSelection()
  }

  function startMove(row: number, col: number) {
    if (!selection.value) return
    const s = selection.value
    isMoving.value = true
    moveOffset.value = { row: row - s.startRow, col: col - s.startCol }
    movingData.value = canvas.getRegion(s.startRow, s.startCol, s.endRow, s.endCol)
    history.pushSnapshot()
    canvas.clearRegion(s.startRow, s.startCol, s.endRow, s.endCol)
  }

  function updateMove(row: number, col: number) {
    if (!isMoving.value || !moveOffset.value || !movingData.value || !selection.value) return
    const newStartRow = row - moveOffset.value.row
    const newStartCol = col - moveOffset.value.col
    const h = selection.value.endRow - selection.value.startRow
    const w = selection.value.endCol - selection.value.startCol
    selection.value = {
      startRow: newStartRow,
      startCol: newStartCol,
      endRow: newStartRow + h,
      endCol: newStartCol + w,
    }
  }

  function endMove() {
    if (!isMoving.value || !movingData.value || !selection.value) return
    canvas.pasteRegion(movingData.value, selection.value.startRow, selection.value.startCol)
    isMoving.value = false
    moveOffset.value = null
    movingData.value = null
  }

  return {
    selection,
    clipboard,
    isMoving,
    movingData,
    setSelection,
    clearSelection,
    isInSelection,
    copySelection,
    deleteSelection,
    startMove,
    updateMove,
    endMove,
  }
}
