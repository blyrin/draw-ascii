export interface CellPos {
  row: number
  col: number
}

export interface CellRect {
  startRow: number
  startCol: number
  endRow: number
  endCol: number
}

export interface CanvasState {
  cells: string[][]
  width: number
  height: number
}

export type ToolType = 'select' | 'rectangle' | 'line' | 'text' | 'erase'

export type LineStyle = 'solid' | 'arrow-end' | 'arrow-both'

export type ResizeHandle =
  | 'top-left' | 'top' | 'top-right'
  | 'left' | 'right'
  | 'bottom-left' | 'bottom' | 'bottom-right'

export interface BoxStructure {
  top: number
  left: number
  bottom: number
  right: number
  hDividers: number[]
  vDividers: number[]
  interiorContent: string[][][]
}
