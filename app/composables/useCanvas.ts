import type { CanvasState } from '~/types/canvas'

const DEFAULT_WIDTH = 300
const DEFAULT_HEIGHT = 200
const EXPAND_THRESHOLD = 5
const EXPAND_SIZE = 50

function createCells(height: number, width: number): string[][] {
  return Array.from({ length: height }, () => Array.from({ length: width }, () => ' '))
}

export function useCanvas() {
  const state = reactive<CanvasState>({
    cells: createCells(DEFAULT_HEIGHT, DEFAULT_WIDTH),
    width: DEFAULT_WIDTH,
    height: DEFAULT_HEIGHT,
  })

  function getCell(row: number, col: number): string {
    if (row < 0 || row >= state.height || col < 0 || col >= state.width) return ' '
    return state.cells[row]![col]!
  }

  function setCell(row: number, col: number, char: string) {
    ensureSize(row, col)
    if (row >= 0 && row < state.height && col >= 0 && col < state.width) {
      state.cells[row]![col] = char
    }
  }

  function setCells(changes: { row: number; col: number; char: string }[]) {
    for (const c of changes) {
      ensureSize(c.row, c.col)
    }
    for (const c of changes) {
      if (c.row >= 0 && c.row < state.height && c.col >= 0 && c.col < state.width) {
        state.cells[c.row]![c.col] = c.char
      }
    }
  }

  function clearRegion(startRow: number, startCol: number, endRow: number, endCol: number) {
    const r0 = Math.max(0, Math.min(startRow, endRow))
    const r1 = Math.min(state.height - 1, Math.max(startRow, endRow))
    const c0 = Math.max(0, Math.min(startCol, endCol))
    const c1 = Math.min(state.width - 1, Math.max(startCol, endCol))
    for (let r = r0; r <= r1; r++) {
      for (let c = c0; c <= c1; c++) {
        state.cells[r]![c] = ' '
      }
    }
  }

  function getRegion(startRow: number, startCol: number, endRow: number, endCol: number): string[][] {
    const r0 = Math.min(startRow, endRow)
    const r1 = Math.max(startRow, endRow)
    const c0 = Math.min(startCol, endCol)
    const c1 = Math.max(startCol, endCol)
    const result: string[][] = []
    for (let r = r0; r <= r1; r++) {
      const row: string[] = []
      for (let c = c0; c <= c1; c++) {
        row.push(getCell(r, c))
      }
      result.push(row)
    }
    return result
  }

  function pasteRegion(data: string[][], startRow: number, startCol: number) {
    for (let r = 0; r < data.length; r++) {
      for (let c = 0; c < data[r]!.length; c++) {
        setCell(startRow + r, startCol + c, data[r]![c]!)
      }
    }
  }

  function ensureSize(row: number, col: number) {
    let expanded = false
    if (row >= state.height - EXPAND_THRESHOLD) {
      const newHeight = Math.max(state.height + EXPAND_SIZE, row + EXPAND_SIZE)
      for (let i = state.height; i < newHeight; i++) {
        state.cells.push(Array.from({ length: state.width }, () => ' '))
      }
      state.height = newHeight
      expanded = true
    }
    if (col >= state.width - EXPAND_THRESHOLD) {
      const newWidth = Math.max(state.width + EXPAND_SIZE, col + EXPAND_SIZE)
      for (let r = 0; r < state.height; r++) {
        for (let i = state.width; i < newWidth; i++) {
          state.cells[r]!.push(' ')
        }
      }
      state.width = newWidth
      expanded = true
    }
    return expanded
  }

  function snapshotCells(): string[][] {
    return state.cells.map(row => [...row])
  }

  function restoreCells(snapshot: string[][]) {
    state.height = snapshot.length
    state.width = snapshot[0]?.length ?? DEFAULT_WIDTH
    state.cells = snapshot.map(row => [...row])
  }

  return {
    state,
    getCell,
    setCell,
    setCells,
    clearRegion,
    getRegion,
    pasteRegion,
    ensureSize,
    snapshotCells,
    restoreCells,
  }
}
