import type { CellPos } from '~/types/canvas'

export function useTextCursor(
  canvas: ReturnType<typeof import('./useCanvas').useCanvas>,
  history: ReturnType<typeof import('./useHistory').useHistory>,
) {
  const cursorPos = ref<CellPos | null>(null)
  const startCol = ref(0)
  const isActive = ref(false)
  let snapshotPushed = false

  function activate(row: number, col: number) {
    cursorPos.value = { row, col }
    startCol.value = col
    isActive.value = true
    snapshotPushed = false
  }

  function deactivate() {
    cursorPos.value = null
    isActive.value = false
    snapshotPushed = false
  }

  function ensureSnapshot() {
    if (!snapshotPushed) {
      history.pushSnapshot()
      snapshotPushed = true
    }
  }

  function handleKey(e: KeyboardEvent) {
    if (!isActive.value || !cursorPos.value) return false

    if (e.key === 'Escape') {
      deactivate()
      return true
    }

    if (e.key === 'Enter') {
      ensureSnapshot()
      cursorPos.value = { row: cursorPos.value.row + 1, col: startCol.value }
      return true
    }

    if (e.key === 'Backspace') {
      ensureSnapshot()
      if (cursorPos.value.col > 0) {
        cursorPos.value = { row: cursorPos.value.row, col: cursorPos.value.col - 1 }
        canvas.setCell(cursorPos.value.row, cursorPos.value.col, ' ')
      }
      return true
    }

    if (e.key === 'ArrowLeft') {
      if (cursorPos.value.col > 0) {
        cursorPos.value = { row: cursorPos.value.row, col: cursorPos.value.col - 1 }
      }
      return true
    }
    if (e.key === 'ArrowRight') {
      cursorPos.value = { row: cursorPos.value.row, col: cursorPos.value.col + 1 }
      return true
    }
    if (e.key === 'ArrowUp') {
      if (cursorPos.value.row > 0) {
        cursorPos.value = { row: cursorPos.value.row - 1, col: cursorPos.value.col }
      }
      return true
    }
    if (e.key === 'ArrowDown') {
      cursorPos.value = { row: cursorPos.value.row + 1, col: cursorPos.value.col }
      return true
    }

    // Printable character
    if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
      ensureSnapshot()
      canvas.setCell(cursorPos.value.row, cursorPos.value.col, e.key)
      cursorPos.value = { row: cursorPos.value.row, col: cursorPos.value.col + 1 }
      return true
    }

    return false
  }

  return {
    cursorPos,
    isActive,
    activate,
    deactivate,
    handleKey,
  }
}
