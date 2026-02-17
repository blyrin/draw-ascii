import type { CellPos } from '~/types/canvas'

export function useDrag(
  canvasEl: Ref<HTMLElement | null>,
  viewport: ReturnType<typeof import('./useViewport').useViewport>,
) {
  const isDragging = ref(false)
  const dragStart = ref<CellPos | null>(null)
  const dragCurrent = ref<CellPos | null>(null)

  function pixelToCell(clientX: number, clientY: number): CellPos | null {
    if (!canvasEl.value) return null
    const rect = canvasEl.value.getBoundingClientRect()
    const x = clientX - rect.left + canvasEl.value.scrollLeft
    const y = clientY - rect.top + canvasEl.value.scrollTop
    return {
      col: Math.floor(x / viewport.cellWidth.value),
      row: Math.floor(y / viewport.cellHeight.value),
    }
  }

  function onMouseDown(e: MouseEvent) {
    if (e.button !== 0) return
    const pos = pixelToCell(e.clientX, e.clientY)
    if (!pos) return
    isDragging.value = true
    dragStart.value = pos
    dragCurrent.value = pos
  }

  function onMouseMove(e: MouseEvent) {
    if (!isDragging.value) return
    const pos = pixelToCell(e.clientX, e.clientY)
    if (pos) {
      dragCurrent.value = pos
    }
  }

  function onMouseUp(_e: MouseEvent) {
    isDragging.value = false
  }

  return {
    isDragging,
    dragStart,
    dragCurrent,
    pixelToCell,
    onMouseDown,
    onMouseMove,
    onMouseUp,
  }
}
