import { templates } from '~/data/templates'
import type { Template, TemplateCategory } from '~/types/template'

function parseTemplate(content: string): string[][] {
  const lines = content.split('\n')
  const maxLen = Math.max(...lines.map(l => l.length))
  return lines.map(line => {
    const chars = Array.from(line)
    while (chars.length < maxLen) chars.push(' ')
    return chars
  })
}

export function useTemplates() {
  const allTemplates = templates
  const activeCategory = ref<TemplateCategory | null>(null)
  const placingTemplate = ref<Template | null>(null)
  const placingData = ref<string[][] | null>(null)

  const categories = computed(() => {
    const cats = new Set(allTemplates.map(t => t.category))
    return [...cats] as TemplateCategory[]
  })

  const filteredTemplates = computed(() => {
    if (!activeCategory.value) return allTemplates
    return allTemplates.filter(t => t.category === activeCategory.value)
  })

  function startPlacing(template: Template) {
    placingTemplate.value = template
    placingData.value = parseTemplate(template.content)
  }

  function cancelPlacing() {
    placingTemplate.value = null
    placingData.value = null
  }

  function placeTemplate(
    canvas: ReturnType<typeof import('./useCanvas').useCanvas>,
    history: ReturnType<typeof import('./useHistory').useHistory>,
    row: number,
    col: number,
  ) {
    if (!placingData.value) return
    history.pushSnapshot()
    canvas.pasteRegion(placingData.value, row, col)
    placingTemplate.value = null
    placingData.value = null
  }

  return {
    allTemplates,
    categories,
    activeCategory,
    filteredTemplates,
    placingTemplate,
    placingData,
    startPlacing,
    cancelPlacing,
    placeTemplate,
  }
}
