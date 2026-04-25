<script lang="ts" setup>
import type { CellPos, ResizeHandle, ToolType } from '~/types/canvas'
import type { Template } from '~/types/template'

// 画布基础逻辑
const canvas = useCanvas()
const tool = useTool()
const history = useHistory(canvas)
const exportUtil = useExport(canvas)
const templates = useTemplates()

// 绘图工具逻辑
const drawRect = useDrawRect(canvas, history)
const drawLine = useDrawLine(canvas, history)
const textCursor = useTextCursor(canvas, history)
const erase = useErase(canvas, history)
const selection = useSelection(canvas, history)
const resize = useResize(canvas, history)

// 视口状态
const canvasEl = ref<HTMLElement | null>(null)
const viewport = useViewport(canvasEl)
const drag = useDrag(canvasEl, viewport)

// 界面状态
const showExport = ref(false)
const exportText = ref('')
const hoverPos = ref<CellPos | null>(null)
const previewCells = ref<{ row: number; col: number; char: string }[]>([])
const placingPreview = ref<{ data: string[][]; row: number; col: number } | null>(null)

// 网格背景尺寸跟随字符尺寸变化
const gridStyle = computed(() => ({
  backgroundSize: `${viewport.cellWidth.value}px ${viewport.cellHeight.value}px`,
  backgroundImage: `linear-gradient(to right, var(--ui-border-muted) 1px, transparent 1px), linear-gradient(to bottom, var(--ui-border-muted) 1px, transparent 1px)`,
  width: canvas.state.width * viewport.cellWidth.value + 'px',
  height: canvas.state.height * viewport.cellHeight.value + 'px',
}))

// 根据当前操作显示鼠标样式
const cursorClass = computed(() => {
  if (resize.isResizing.value && resize.activeHandle.value) {
    return resize.getCursorForHandle(resize.activeHandle.value)
  }
  // 悬停在缩放控制点附近时显示缩放光标
  const t = tool.activeTool.value
  if (t === 'select' && selection.selection.value && resize.detectedBox.value && hoverPos.value) {
    const handle = resize.hitTestHandle(hoverPos.value.row, hoverPos.value.col, selection.selection.value)
    if (handle) return resize.getCursorForHandle(handle)
  }
  if (t === 'text') return 'cursor-text'
  if (t === 'erase') return 'cursor-cell'
  if (templates.placingTemplate.value) return 'cursor-copy'
  return 'cursor-crosshair'
})

// 根据当前选择区域生成缩放控制点
const resizeHandles = computed(() => {
  const sel = selection.selection.value
  if (!sel || tool.activeTool.value !== 'select' || !resize.detectedBox.value) return null

  const { startRow: r0, startCol: c0, endRow: r1, endCol: c1 } = sel
  return [
    { row: r0, col: c0, handle: 'top-left' as ResizeHandle },
    { row: r0, col: Math.round((c0 + c1) / 2), handle: 'top' as ResizeHandle },
    { row: r0, col: c1, handle: 'top-right' as ResizeHandle },
    { row: Math.round((r0 + r1) / 2), col: c0, handle: 'left' as ResizeHandle },
    { row: Math.round((r0 + r1) / 2), col: c1, handle: 'right' as ResizeHandle },
    { row: r1, col: c0, handle: 'bottom-left' as ResizeHandle },
    { row: r1, col: Math.round((c0 + c1) / 2), handle: 'bottom' as ResizeHandle },
    { row: r1, col: c1, handle: 'bottom-right' as ResizeHandle },
  ]
})

// 切换工具时清理当前临时操作，避免不同工具状态互相影响
function onToolChange(t: ToolType) {
  textCursor.deactivate()
  selection.clearSelection()
  resize.detectedBox.value = null
  templates.cancelPlacing()
  previewCells.value = []
  tool.setTool(t)
}

function onClear() {
  history.pushSnapshot()
  canvas.restoreCells(
    Array.from({ length: canvas.state.height }, () =>
      Array.from({ length: canvas.state.width }, () => ' '),
    ),
  )
}

function onExport() {
  exportText.value = exportUtil.getExportText()
  showExport.value = true
}

async function onCopyExport() {
  await exportUtil.copyToClipboard()
}

function onTemplateSelect(tpl: Template) {
  templates.startPlacing(tpl)
  tool.setTool('select')
}

function onCanvasMouseDown(e: MouseEvent) {
  if (e.button !== 0) return

  const pos = drag.pixelToCell(e.clientX, e.clientY)
  if (!pos) return

  const t = tool.activeTool.value

  // 放置模板时不进入拖拽流程，避免鼠标抬起后生成多余选择区
  if (templates.placingTemplate.value && templates.placingData.value) {
    templates.placeTemplate(canvas, history, pos.row, pos.col)
    placingPreview.value = null
    return
  }

  drag.onMouseDown(e)

  if (t === 'text') {
    textCursor.activate(pos.row, pos.col)
    return
  }

  if (t === 'erase') {
    erase.startErase()
    erase.eraseAt(pos.row, pos.col)
    return
  }

  if (t === 'select') {
    // 优先命中缩放控制点
    if (selection.selection.value && resize.detectedBox.value) {
      const handle = resize.hitTestHandle(pos.row, pos.col, selection.selection.value)
      if (handle) {
        resize.startResize(handle, selection.selection.value)
        return
      }
    }

    if (selection.isInSelection(pos.row, pos.col)) {
      selection.startMove(pos.row, pos.col)
    } else {
      selection.clearSelection()
      resize.detectedBox.value = null
    }
  }
}

function onCanvasMouseMove(e: MouseEvent) {
  const pos = drag.pixelToCell(e.clientX, e.clientY)
  if (pos) hoverPos.value = pos

  drag.onMouseMove(e)

  // 模板预览跟随鼠标所在单元格
  if (templates.placingData.value && pos) {
    placingPreview.value = { data: templates.placingData.value, row: pos.row, col: pos.col }
  }

  if (!drag.isDragging.value || !drag.dragStart.value || !drag.dragCurrent.value) return

  const start = drag.dragStart.value
  const current = drag.dragCurrent.value
  const t = tool.activeTool.value

  if (t === 'rectangle') {
    previewCells.value = drawRect.previewRect(start.row, start.col, current.row, current.col)
  } else if (t === 'line') {
    previewCells.value = drawLine.previewLine(start.row, start.col, current.row, current.col, tool.lineStyle.value)
  } else if (t === 'erase') {
    if (pos) erase.eraseAt(pos.row, pos.col)
  } else if (t === 'select') {
    if (resize.isResizing.value) {
      if (pos && selection.selection.value) {
        selection.selection.value = resize.updateResize(pos.row, pos.col, selection.selection.value)
      }
    } else if (selection.isMoving.value) {
      if (pos) selection.updateMove(pos.row, pos.col)
    } else {
      selection.setSelection(start.row, start.col, current.row, current.col)
    }
  }
}

function onCanvasMouseUp(e: MouseEvent) {
  if (!drag.isDragging.value || !drag.dragStart.value || !drag.dragCurrent.value) {
    drag.onMouseUp(e)
    return
  }

  const start = drag.dragStart.value
  const current = drag.dragCurrent.value
  const t = tool.activeTool.value

  if (t === 'rectangle') {
    drawRect.drawRect(start.row, start.col, current.row, current.col)
    previewCells.value = []
  } else if (t === 'line') {
    drawLine.drawLine(start.row, start.col, current.row, current.col, tool.lineStyle.value)
    previewCells.value = []
  } else if (t === 'erase') {
    erase.endErase()
  } else if (t === 'select') {
    if (resize.isResizing.value) {
      if (selection.selection.value) {
        resize.commitResize(selection.selection.value)
      } else {
        resize.cancelResize()
      }
    } else if (selection.isMoving.value) {
      selection.endMove()
    } else {
      // 选择完成后识别可缩放的框结构
      if (selection.selection.value) {
        const sel = selection.selection.value
        const region = canvas.getRegion(sel.startRow, sel.startCol, sel.endRow, sel.endCol)
        const box = resize.analyzeSelection(region)
        resize.detectedBox.value = box
        // 将选择区吸附到实际边框，保证控制点贴合边缘
        if (box) {
          selection.setSelection(
            sel.startRow + box.top,
            sel.startCol + box.left,
            sel.startRow + box.bottom,
            sel.startCol + box.right,
          )
          // 重新识别吸附后的区域，让边框偏移从 0 开始
          const snappedSel = selection.selection.value!
          const snappedRegion = canvas.getRegion(snappedSel.startRow, snappedSel.startCol, snappedSel.endRow, snappedSel.endCol)
          resize.detectedBox.value = resize.analyzeSelection(snappedRegion)
        }
      }
    }
  }

  drag.onMouseUp(e)
}

// 处理全局键盘快捷键
function onKeyDown(e: KeyboardEvent) {
  // 文本光标优先处理输入类按键
  if (textCursor.isActive.value) {
    if (textCursor.handleKey(e)) {
      e.preventDefault()
      return
    }
  }

  // 复制、剪切和撤销重做快捷键
  if (e.ctrlKey || e.metaKey) {
    if (e.key === 'z') {
      e.preventDefault()
      history.undo()
      return
    }
    if (e.key === 'y') {
      e.preventDefault()
      history.redo()
      return
    }
    if (e.key === 'c') {
      if (!selection.selection.value) return
      e.preventDefault()
      selection.copySelection()
      return
    }
    if (e.key === 'x') {
      if (!selection.selection.value) return
      e.preventDefault()
      selection.copySelection()
      selection.deleteSelection()
      return
    }
  }

  // 删除当前选择区
  if (e.key === 'Delete' || e.key === 'Backspace') {
    if (selection.selection.value) {
      e.preventDefault()
      selection.deleteSelection()
      return
    }
  }

  // 退出当前临时操作
  if (e.key === 'Escape') {
    if (resize.isResizing.value) {
      resize.cancelResize()
      return
    }
    templates.cancelPlacing()
    placingPreview.value = null
    selection.clearSelection()
    resize.detectedBox.value = null
    textCursor.deactivate()
    return
  }

  // 工具快捷键
  if (!e.ctrlKey && !e.metaKey && !e.altKey) {
    const shortcuts: Record<string, ToolType> = { v: 'select', r: 'rectangle', l: 'line', t: 'text', e: 'erase' }
    const t = shortcuts[e.key.toLowerCase()]
    if (t) {
      onToolChange(t)
      return
    }
  }
}

onMounted(() => {
  window.addEventListener('keydown', onKeyDown)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeyDown)
})
</script>

<template>
  <div class="flex flex-col h-full">
    <!-- 工具栏 -->
    <EditorToolbar
      :active-tool="tool.activeTool.value"
      :can-redo="history.canRedo.value"
      :can-undo="history.canUndo.value"
      :line-style="tool.lineStyle.value"
      @clear="onClear"
      @export="onExport"
      @redo="history.redo"
      @undo="history.undo"
      @update:active-tool="onToolChange"
      @update:line-style="tool.setLineStyle"
    />

    <div class="flex flex-1 overflow-hidden">
      <!-- 侧边栏 -->
      <EditorSidebar
        :active-category="templates.activeCategory.value"
        :categories="templates.categories.value"
        :templates="templates.filteredTemplates.value"
        @place="onTemplateSelect"
        @update:active-category="templates.activeCategory.value = $event"
      />

      <!-- 画布区域 -->
      <div
        ref="canvasEl"
        :class="cursorClass"
        class="flex-1 overflow-auto relative bg-default"
        @mousedown="onCanvasMouseDown"
        @mouseleave="hoverPos = null"
        @mousemove="onCanvasMouseMove"
        @mouseup="onCanvasMouseUp"
      >
        <div :style="gridStyle" class="relative">
          <CanvasRenderer
            :cell-height="viewport.cellHeight.value"
            :cell-width="viewport.cellWidth.value"
            :cells="canvas.state.cells"
            :col-count="viewport.visibleCols.value.count"
            :row-count="viewport.visibleRows.value.count"
            :start-col="viewport.visibleCols.value.start"
            :start-row="viewport.visibleRows.value.start"
          />
          <CanvasOverlay
            :cell-height="viewport.cellHeight.value"
            :cell-width="viewport.cellWidth.value"
            :cursor-pos="textCursor.cursorPos.value"
            :placing-preview="placingPreview"
            :preview-cells="previewCells"
            :resize-handles="resizeHandles"
            :resize-preview="resize.resizePreview.value"
            :selection="selection.selection.value"
          />
        </div>
      </div>
    </div>

    <!-- 状态栏 -->
    <EditorStatusBar
      :active-tool="tool.activeTool.value"
      :canvas-height="canvas.state.height"
      :canvas-width="canvas.state.width"
      :cursor-pos="hoverPos"
    />

    <!-- 导出弹窗 -->
    <ExportModal
      v-if="showExport"
      :text="exportText"
      @close="showExport = false"
      @copy="onCopyExport"
      @download="exportUtil.downloadFile()"
    />
  </div>
</template>
