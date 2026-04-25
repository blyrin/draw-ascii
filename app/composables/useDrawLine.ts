import type { LineStyle } from '~/types/canvas'

type Direction = 'left' | 'right' | 'up' | 'down'

const BOX_CHARS = new Set('┌┐└┘─│┼├┤┬┴')

function getConnector(existing: string, directions: Direction | Direction[]): string | null {
  if (!BOX_CHARS.has(existing)) return null

  const connections: Record<string, Set<Direction>> = {
    '─': new Set(['left', 'right']),
    '│': new Set(['up', 'down']),
    '┌': new Set(['right', 'down']),
    '┐': new Set(['left', 'down']),
    '└': new Set(['right', 'up']),
    '┘': new Set(['left', 'up']),
    '├': new Set(['up', 'down', 'right']),
    '┤': new Set(['up', 'down', 'left']),
    '┬': new Set(['left', 'right', 'down']),
    '┴': new Set(['left', 'right', 'up']),
    '┼': new Set(['left', 'right', 'up', 'down']),
  }

  const dirs = connections[existing]
  if (!dirs) return null

  const newDirs = new Set(dirs)
  const dirsToAdd = Array.isArray(directions) ? directions : [directions]
  for (const direction of dirsToAdd) {
    newDirs.add(direction)
  }

  // 根据连接方向找到最接近的框线字符
  for (const [char, charDirs] of Object.entries(connections)) {
    if (charDirs.size === newDirs.size && [...newDirs].every(d => charDirs.has(d))) {
      return char
    }
  }
  return '┼'
}

export function useDrawLine(
  canvas: ReturnType<typeof import('./useCanvas').useCanvas>,
  history: ReturnType<typeof import('./useHistory').useHistory>,
) {
  function computeLinePoints(
    startRow: number, startCol: number,
    endRow: number, endCol: number,
    style: LineStyle,
  ): { row: number; col: number; char: string }[] {
    const points: { row: number; col: number; char: string }[] = []
    const dx = endCol - startCol
    const dy = endRow - startRow

    if (dx === 0 && dy === 0) return points

    const isHorizontal = Math.abs(dx) >= Math.abs(dy)

    if (isHorizontal) {
      const step = dx > 0 ? 1 : -1
      for (let c = startCol; c !== endCol + step; c += step) {
        const existing = canvas.getCell(startRow, c)
        const dir1: Direction = step > 0 ? 'right' : 'left'
        const dir2: Direction = step > 0 ? 'left' : 'right'
        let char = '─'

        if (c === endCol && style === 'arrow-end') {
          char = step > 0 ? '→' : '←'
        } else if (c === startCol && style === 'arrow-both') {
          char = step > 0 ? '←' : '→'
        } else if (c === endCol && style === 'arrow-both') {
          char = step > 0 ? '→' : '←'
        } else {
          const lineDirs = c === startCol ? dir1 : c === endCol ? dir2 : [dir1, dir2]
          const connector = getConnector(existing, lineDirs)
          if (connector) char = connector
        }

        points.push({ row: startRow, col: c, char })
      }
    } else {
      const step = dy > 0 ? 1 : -1
      for (let r = startRow; r !== endRow + step; r += step) {
        const existing = canvas.getCell(r, startCol)
        const dir1: Direction = step > 0 ? 'down' : 'up'
        const dir2: Direction = step > 0 ? 'up' : 'down'
        let char = '│'

        if (r === endRow && style === 'arrow-end') {
          char = step > 0 ? '↓' : '↑'
        } else if (r === startRow && style === 'arrow-both') {
          char = step > 0 ? '↑' : '↓'
        } else if (r === endRow && style === 'arrow-both') {
          char = step > 0 ? '↓' : '↑'
        } else {
          const lineDirs = r === startRow ? dir1 : r === endRow ? dir2 : [dir1, dir2]
          const connector = getConnector(existing, lineDirs)
          if (connector) char = connector
        }

        points.push({ row: r, col: startCol, char })
      }
    }

    return points
  }

  function drawLine(startRow: number, startCol: number, endRow: number, endCol: number, style: LineStyle) {
    const points = computeLinePoints(startRow, startCol, endRow, endCol, style)
    if (points.length === 0) return
    history.pushSnapshot()
    canvas.setCells(points)
  }

  function previewLine(startRow: number, startCol: number, endRow: number, endCol: number, style: LineStyle) {
    return computeLinePoints(startRow, startCol, endRow, endCol, style)
  }

  return { drawLine, previewLine }
}
