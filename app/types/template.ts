export interface Template {
  id: string
  name: string
  category: TemplateCategory
  content: string
}

export type TemplateCategory = 'basic' | 'form' | 'layout' | 'feedback' | 'data' | 'navigation'

export const categoryLabels: Record<TemplateCategory, string> = {
  basic: '基础',
  form: '表单',
  layout: '布局',
  feedback: '反馈',
  data: '数据',
  navigation: '导航',
}
