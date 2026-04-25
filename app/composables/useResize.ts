import type { BoxStructure, CellRect, ResizeHandle } from '~/types/canvas'

const BOX_CORNERS = new Set(['┌', '┐', '└', '┘'])
const H_BORDER = new Set(['─', '┬', '┴'])
const V_BORDER = new Set(['│', '├', '┤'])
const H_DIVIDER_FILL = new Set(['─', '┼', '┬', '┴'])
const V_DIVIDER_FILL = new Set(['│', '┼', '├', '┤'])

export function useResize(
  canvas: ReturnType<typeof import('./useCanvas').useCanvas>,
  history: ReturnType<typeof import('./useHistory').useHistory>,
) {
  const isResizing = ref(false)
  const activeHandle = ref<ResizeHandle | null>(null)
  const detectedBox = ref<BoxStructure | null>(null)
  const resizePreview = ref<{ row: number; col: number; char: string }[] | null>(null)
  const originalRect = ref<CellRect | null>(null)
  const resizeAnchor = ref<{ row: number; col: number } | null>(null)

  // 识别选择区内是否存在完整框结构
  function analyzeSelection(region: string[][]): BoxStructure | null {
    const h = region.length
    const w = region[0]?.length ?? 0
    if (h < 3 || w < 3) return null

    // 查找第一个左上角，作为框结构起点
    let top = -1, left = -1, bottom = -1, right = -1

    outer_tl:
      for (let r = 0; r < h - 2; r++) {
        for (let c = 0; c < w - 2; c++) {
          if (region[r]![c] === '┌') {
            top = r
            left = c
            break outer_tl
          }
        }
      }
    if (top === -1) return null

    // 在同一行查找右上角
    for (let c = w - 1; c > left + 1; c--) {
      if (region[top]![c] === '┐') {
        right = c
        break
      }
    }
    if (right === -1) return null

    // 在同一列查找左下角
    for (let r = h - 1; r > top + 1; r--) {
      if (region[r]![left] === '└') {
        bottom = r
        break
      }
    }
    if (bottom === -1) return null

    // 校验右下角
    if (region[bottom]![right] !== '┘') return null

    // 校验上边
    for (let c = left + 1; c < right; c++) {
      if (!H_BORDER.has(region[top]![c]!)) return null
    }
    // 校验下边
    for (let c = left + 1; c < right; c++) {
      if (!H_BORDER.has(region[bottom]![c]!)) return null
    }
    // 校验左边
    for (let r = top + 1; r < bottom; r++) {
      if (!V_BORDER.has(region[r]![left]!)) return null
    }
    // 校验右边
    for (let r = top + 1; r < bottom; r++) {
      if (!V_BORDER.has(region[r]![right]!)) return null
    }

    // 扫描横向分隔线
    const hDividers: number[] = []
    for (let r = top + 1; r < bottom; r++) {
      if (region[r]![left] === '├' && region[r]![right] === '┤') {
        let valid = true
        for (let c = left + 1; c < right; c++) {
          if (!H_DIVIDER_FILL.has(region[r]![c]!)) {
            valid = false
            break
          }
        }
        if (valid) hDividers.push(r)
      }
    }

    // 扫描纵向分隔线
    const vDividers: number[] = []
    for (let c = left + 1; c < right; c++) {
      if (region[top]![c] === '┬' && region[bottom]![c] === '┴') {
        let valid = true
        for (let r = top + 1; r < bottom; r++) {
          if (!V_DIVIDER_FILL.has(region[r]![c]!)) {
            valid = false
            break
          }
        }
        if (valid) vDividers.push(c)
      }
    }

    // 按分隔线提取每个区域里的内容
    const hBounds = [top, ...hDividers, bottom]
    const vBounds = [left, ...vDividers, right]
    const interiorContent: string[][][] = []

    for (let si = 0; si < hBounds.length - 1; si++) {
      const sectionRow: string[][] = []
      for (let sj = 0; sj < vBounds.length - 1; sj++) {
        const lines: string[] = []
        for (let r = hBounds[si]! + 1; r < hBounds[si + 1]!; r++) {
          let line = ''
          for (let c = vBounds[sj]! + 1; c < vBounds[sj + 1]!; c++) {
            line += region[r]![c] ?? ' '
          }
          lines.push(line)
        }
        sectionRow.push(lines)
      }
      interiorContent.push(sectionRow)
    }

    return { top, left, bottom, right, hDividers, vDividers, interiorContent }
  }

  // 按新的选择区域重建框结构
  function rebuildBox(box: BoxStructure, newRect: CellRect): { row: number; col: number; char: string }[] {
    const cells: { row: number; col: number; char: string }[] = []
    const r0 = newRect.startRow
    const c0 = newRect.startCol
    const newH = newRect.endRow - newRect.startRow
    const newW = newRect.endCol - newRect.startCol
    const oldH = box.bottom - box.top
    const oldW = box.right - box.left

    if (newH < 2 || newW < 2) return cells

    // 按原比例计算分隔线的新位置
    const newHDividers: number[] = box.hDividers.map(origR => {
      const rel = origR - box.top
      return Math.max(1, Math.min(newH - 1, Math.round(rel / oldH * newH)))
    }).filter((v, i, a) => v > 0 && v < newH && a.indexOf(v) === i).sort((a, b) => a - b)

    const newVDividers: number[] = box.vDividers.map(origC => {
      const rel = origC - box.left
      return Math.max(1, Math.min(newW - 1, Math.round(rel / oldW * newW)))
    }).filter((v, i, a) => v > 0 && v < newW && a.indexOf(v) === i).sort((a, b) => a - b)

    const hDivSet = new Set(newHDividers)
    const vDivSet = new Set(newVDividers)

    // 先用空格清理新区域
    for (let r = 0; r <= newH; r++) {
      for (let c = 0; c <= newW; c++) {
        cells.push({ row: r0 + r, col: c0 + c, char: ' ' })
      }
    }

    // 绘制外边框
    cells.push({ row: r0, col: c0, char: '┌' })
    cells.push({ row: r0, col: c0 + newW, char: '┐' })
    cells.push({ row: r0 + newH, col: c0, char: '└' })
    cells.push({ row: r0 + newH, col: c0 + newW, char: '┘' })

    for (let c = 1; c < newW; c++) {
      let ch = '─'
      if (vDivSet.has(c)) ch = '┬'
      cells.push({ row: r0, col: c0 + c, char: ch })
      ch = '─'
      if (vDivSet.has(c)) ch = '┴'
      cells.push({ row: r0 + newH, col: c0 + c, char: ch })
    }

    for (let r = 1; r < newH; r++) {
      let ch = '│'
      if (hDivSet.has(r)) ch = '├'
      cells.push({ row: r0 + r, col: c0, char: ch })
      ch = '│'
      if (hDivSet.has(r)) ch = '┤'
      cells.push({ row: r0 + r, col: c0 + newW, char: ch })
    }

    // 绘制横向分隔线
    for (const hr of newHDividers) {
      for (let c = 1; c < newW; c++) {
        let ch = '─'
        if (vDivSet.has(c)) ch = '┼'
        cells.push({ row: r0 + hr, col: c0 + c, char: ch })
      }
    }

    // 绘制纵向分隔线
    for (const vc of newVDividers) {
      for (let r = 1; r < newH; r++) {
        if (hDivSet.has(r)) continue // 交叉点已由横向分隔线处理
        cells.push({ row: r0 + r, col: c0 + vc, char: '│' })
      }
    }

    // 放回原有内容，超出新区域的部分会被截断
    const hBounds = [0, ...newHDividers, newH]
    const vBounds = [0, ...newVDividers, newW]

    for (let si = 0; si < hBounds.length - 1 && si < box.interiorContent.length; si++) {
      for (let sj = 0; sj < vBounds.length - 1 && sj < box.interiorContent[si]!.length; sj++) {
        const lines = box.interiorContent[si]![sj]!
        const secTop = hBounds[si]! + 1
        const secLeft = vBounds[sj]! + 1
        const secH = hBounds[si + 1]! - hBounds[si]! - 1
        const secW = vBounds[sj + 1]! - vBounds[sj]! - 1
        for (let lr = 0; lr < Math.min(lines.length, secH); lr++) {
          const line = lines[lr]!
          for (let lc = 0; lc < Math.min(line.length, secW); lc++) {
            cells.push({ row: r0 + secTop + lr, col: c0 + secLeft + lc, char: line[lc]! })
          }
        }
      }
    }

    return cells
  }

  // 判断鼠标是否命中缩放控制点
  function hitTestHandle(row: number, col: number, selRect: CellRect): ResizeHandle | null {
    const { startRow: r0, startCol: c0, endRow: r1, endCol: c1 } = selRect

    // 边缘周围保留 1 格容差，便于鼠标命中
    const nearTop = row >= r0 - 1 && row <= r0 + 1
    const nearBottom = row >= r1 - 1 && row <= r1 + 1
    const nearLeft = col >= c0 - 1 && col <= c0 + 1
    const nearRight = col >= c1 - 1 && col <= c1 + 1

    // 必须靠近至少一条边
    if (!nearTop && !nearBottom && !nearLeft && !nearRight) return null

    // 角控制点优先
    if (nearTop && nearLeft) return 'top-left'
    if (nearTop && nearRight) return 'top-right'
    if (nearBottom && nearLeft) return 'bottom-left'
    if (nearBottom && nearRight) return 'bottom-right'

    // 边控制点
    if (nearTop && col >= c0 && col <= c1) return 'top'
    if (nearBottom && col >= c0 && col <= c1) return 'bottom'
    if (nearLeft && row >= r0 && row <= r1) return 'left'
    if (nearRight && row >= r0 && row <= r1) return 'right'

    return null
  }

  // 根据分隔线数量计算框的最小尺寸
  function getMinSize(box: BoxStructure): { minH: number; minW: number } {
    const nh = box.hDividers.length
    const nv = box.vDividers.length
    return {
      minH: nh === 0 ? 3 : nh * 2 + 3,
      minW: nv === 0 ? 3 : nv * 2 + 3,
    }
  }

  // 开始缩放并记录固定锚点
  function startResize(handle: ResizeHandle, selRect: CellRect) {
    isResizing.value = true
    activeHandle.value = handle
    originalRect.value = { ...selRect }

    // 锚点取当前控制点的对侧边或对角
    const { startRow: r0, startCol: c0, endRow: r1, endCol: c1 } = selRect
    switch (handle) {
      case 'top-left':
        resizeAnchor.value = { row: r1, col: c1 }
        break
      case 'top':
        resizeAnchor.value = { row: r1, col: c0 }
        break
      case 'top-right':
        resizeAnchor.value = { row: r1, col: c0 }
        break
      case 'left':
        resizeAnchor.value = { row: r0, col: c1 }
        break
      case 'right':
        resizeAnchor.value = { row: r0, col: c0 }
        break
      case 'bottom-left':
        resizeAnchor.value = { row: r0, col: c1 }
        break
      case 'bottom':
        resizeAnchor.value = { row: r0, col: c0 }
        break
      case 'bottom-right':
        resizeAnchor.value = { row: r0, col: c0 }
        break
    }
  }

  // 根据鼠标位置更新缩放预览
  function updateResize(row: number, col: number, selRect: CellRect): CellRect {
    if (!activeHandle.value || !originalRect.value || !detectedBox.value || !resizeAnchor.value) return selRect

    const anchor = resizeAnchor.value
    const handle = activeHandle.value
    const { minH, minW } = getMinSize(detectedBox.value)

    let r0 = selRect.startRow, c0 = selRect.startCol
    let r1 = selRect.endRow, c1 = selRect.endCol

    // 根据控制点更新对应边
    if (handle.includes('top')) r0 = Math.min(row, anchor.row - minH + 1)
    if (handle.includes('bottom')) r1 = Math.max(row, anchor.row + minH - 1)
    if (handle === 'top') {
      r0 = Math.min(row, anchor.row - minH + 1)
      c0 = originalRect.value.startCol
      c1 = originalRect.value.endCol
    }
    if (handle === 'bottom') {
      r1 = Math.max(row, anchor.row + minH - 1)
      c0 = originalRect.value.startCol
      c1 = originalRect.value.endCol
    }
    if (handle === 'left') {
      c0 = Math.min(col, anchor.col - minW + 1)
      r0 = originalRect.value.startRow
      r1 = originalRect.value.endRow
    }
    if (handle === 'right') {
      c1 = Math.max(col, anchor.col + minW - 1)
      r0 = originalRect.value.startRow
      r1 = originalRect.value.endRow
    }
    if (handle.includes('left') && handle !== 'left') c0 = Math.min(col, anchor.col - minW + 1)
    if (handle.includes('right') && handle !== 'right') c1 = Math.max(col, anchor.col + minW - 1)

    // 保证缩放后仍能容纳边框和分隔线
    if (r1 - r0 + 1 < minH) {
      if (handle.includes('top')) {
        r0 = r1 - minH + 1
      } else {
        r1 = r0 + minH - 1
      }
    }
    if (c1 - c0 + 1 < minW) {
      if (handle.includes('left')) {
        c0 = c1 - minW + 1
      } else {
        c1 = c0 + minW - 1
      }
    }

    // 画布坐标不能小于 0
    r0 = Math.max(0, r0)
    c0 = Math.max(0, c0)

    const newRect: CellRect = { startRow: r0, startCol: c0, endRow: r1, endCol: c1 }

    // 生成当前缩放预览
    resizePreview.value = rebuildBox(detectedBox.value, newRect)

    return newRect
  }

  // 提交缩放结果并刷新框结构
  function commitResize(newRect: CellRect) {
    if (!detectedBox.value || !originalRect.value) {
      cancelResize()
      return
    }

    history.pushSnapshot()

    // 清理原区域
    const orig = originalRect.value
    canvas.clearRegion(orig.startRow, orig.startCol, orig.endRow, orig.endCol)

    // 写入新区域
    const cells = rebuildBox(detectedBox.value, newRect)
    canvas.setCells(cells)

    const region = canvas.getRegion(newRect.startRow, newRect.startCol, newRect.endRow, newRect.endCol)
    detectedBox.value = analyzeSelection(region)

    cancelResize()
  }

  // 取消当前缩放过程
  function cancelResize() {
    isResizing.value = false
    activeHandle.value = null
    resizePreview.value = null
    originalRect.value = null
    resizeAnchor.value = null
  }

  // 根据控制点类型返回对应鼠标样式
  function getCursorForHandle(handle: ResizeHandle): string {
    switch (handle) {
      case 'top-left':
      case 'bottom-right':
        return 'cursor-nwse-resize'
      case 'top-right':
      case 'bottom-left':
        return 'cursor-nesw-resize'
      case 'top':
      case 'bottom':
        return 'cursor-ns-resize'
      case 'left':
      case 'right':
        return 'cursor-ew-resize'
    }
  }

  return {
    isResizing,
    activeHandle,
    detectedBox,
    resizePreview,
    originalRect,
    analyzeSelection,
    hitTestHandle,
    startResize,
    updateResize,
    commitResize,
    cancelResize,
    getCursorForHandle,
  }
}
