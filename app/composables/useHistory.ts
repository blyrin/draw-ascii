const MAX_HISTORY = 100

export function useHistory(canvas: ReturnType<typeof import('./useCanvas').useCanvas>) {
  const undoStack = ref<string[][][]>([])
  const redoStack = ref<string[][][]>([])

  const canUndo = computed(() => undoStack.value.length > 0)
  const canRedo = computed(() => redoStack.value.length > 0)

  function pushSnapshot() {
    undoStack.value.push(canvas.snapshotCells())
    if (undoStack.value.length > MAX_HISTORY) {
      undoStack.value.shift()
    }
    redoStack.value = []
  }

  function undo() {
    if (!canUndo.value) return
    const snapshot = undoStack.value.pop()!
    redoStack.value.push(canvas.snapshotCells())
    canvas.restoreCells(snapshot)
  }

  function redo() {
    if (!canRedo.value) return
    const snapshot = redoStack.value.pop()!
    undoStack.value.push(canvas.snapshotCells())
    canvas.restoreCells(snapshot)
  }

  return {
    pushSnapshot,
    undo,
    redo,
    canUndo,
    canRedo,
  }
}
