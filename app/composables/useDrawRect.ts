export function useDrawRect(
  canvas: ReturnType<typeof import('./useCanvas').useCanvas>,
  history: ReturnType<typeof import('./useHistory').useHistory>,
) {
  function drawRect(startRow: number, startCol: number, endRow: number, endCol: number) {
    const r0 = Math.min(startRow, endRow)
    const r1 = Math.max(startRow, endRow)
    const c0 = Math.min(startCol, endCol)
    const c1 = Math.max(startCol, endCol)

    if (r1 - r0 < 1 || c1 - c0 < 1) return

    history.pushSnapshot()
    const changes: { row: number; col: number; char: string }[] = []

    // 绘制四个角
    changes.push({ row: r0, col: c0, char: '┌' })
    changes.push({ row: r0, col: c1, char: '┐' })
    changes.push({ row: r1, col: c0, char: '└' })
    changes.push({ row: r1, col: c1, char: '┘' })

    // 绘制上下边
    for (let c = c0 + 1; c < c1; c++) {
      changes.push({ row: r0, col: c, char: '─' })
      changes.push({ row: r1, col: c, char: '─' })
    }

    // 绘制左右边
    for (let r = r0 + 1; r < r1; r++) {
      changes.push({ row: r, col: c0, char: '│' })
      changes.push({ row: r, col: c1, char: '│' })
    }

    canvas.setCells(changes)
  }

  function previewRect(startRow: number, startCol: number, endRow: number, endCol: number): {
    row: number
    col: number
    char: string
  }[] {
    const r0 = Math.min(startRow, endRow)
    const r1 = Math.max(startRow, endRow)
    const c0 = Math.min(startCol, endCol)
    const c1 = Math.max(startCol, endCol)

    if (r1 - r0 < 1 || c1 - c0 < 1) return []

    const preview: { row: number; col: number; char: string }[] = []
    preview.push({ row: r0, col: c0, char: '┌' })
    preview.push({ row: r0, col: c1, char: '┐' })
    preview.push({ row: r1, col: c0, char: '└' })
    preview.push({ row: r1, col: c1, char: '┘' })

    for (let c = c0 + 1; c < c1; c++) {
      preview.push({ row: r0, col: c, char: '─' })
      preview.push({ row: r1, col: c, char: '─' })
    }
    for (let r = r0 + 1; r < r1; r++) {
      preview.push({ row: r, col: c0, char: '│' })
      preview.push({ row: r, col: c1, char: '│' })
    }

    return preview
  }

  return { drawRect, previewRect }
}
