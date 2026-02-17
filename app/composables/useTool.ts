import type { LineStyle, ToolType } from '~/types/canvas'

export function useTool() {
  const activeTool = ref<ToolType>('select')
  const lineStyle = ref<LineStyle>('solid')

  function setTool(tool: ToolType) {
    activeTool.value = tool
  }

  function setLineStyle(style: LineStyle) {
    lineStyle.value = style
  }

  return {
    activeTool,
    lineStyle,
    setTool,
    setLineStyle,
  }
}
