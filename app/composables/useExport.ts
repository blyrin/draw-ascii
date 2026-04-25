export function useExport(canvas: ReturnType<typeof import('./useCanvas').useCanvas>) {
  function getExportText(): string {
    const cells = canvas.state.cells
    let minRow = cells.length, maxRow = 0
    let minCol = cells[0]?.length ?? 0, maxCol = 0

    for (let r = 0; r < cells.length; r++) {
      for (let c = 0; c < cells[r]!.length; c++) {
        if (cells[r]![c] !== ' ') {
          minRow = Math.min(minRow, r)
          maxRow = Math.max(maxRow, r)
          minCol = Math.min(minCol, c)
          maxCol = Math.max(maxCol, c)
        }
      }
    }

    if (minRow > maxRow) return ''

    const lines: string[] = []
    for (let r = minRow; r <= maxRow; r++) {
      let line = ''
      for (let c = minCol; c <= maxCol; c++) {
        line += cells[r]![c]
      }
      lines.push(line.trimEnd())
    }

    // 去掉末尾空行，避免导出内容多出无意义空白
    while (lines.length > 0 && lines[lines.length - 1] === '') {
      lines.pop()
    }

    return lines.join('\n')
  }

  async function copyToClipboard(): Promise<boolean> {
    const text = getExportText()
    if (!text) return false
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch {
      return false
    }
  }

  function downloadFile(filename: string = 'ascii-drawing.md') {
    const text = getExportText()
    if (!text) return
    const blob = new Blob([text], { type: 'text/markdown;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  return {
    getExportText,
    copyToClipboard,
    downloadFile,
  }
}
