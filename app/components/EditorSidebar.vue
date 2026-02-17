<script lang="ts" setup>
import type { Template, TemplateCategory } from '~/types/template'
import { categoryLabels } from '~/types/template'

defineProps<{
  templates: Template[]
  categories: TemplateCategory[]
  activeCategory: TemplateCategory | null
}>()

const emit = defineEmits<{
  'update:activeCategory': [cat: TemplateCategory | null]
  'place': [template: Template]
}>()
</script>

<template>
  <div class="w-56 border-r border-default flex flex-col h-full overflow-hidden">
    <div class="px-3 py-2 text-sm font-medium border-b border-default">
      模板
    </div>

    <!-- Category filter -->
    <div class="flex flex-wrap gap-1 px-2 py-2 border-b border-default">
      <UButton
        :color="activeCategory === null ? 'primary' : 'neutral'"
        :variant="activeCategory === null ? 'solid' : 'ghost'"
        size="xs"
        @click="emit('update:activeCategory', null)"
      >
        全部
      </UButton>
      <UButton
        v-for="cat in categories"
        :key="cat"
        :color="activeCategory === cat ? 'primary' : 'neutral'"
        :variant="activeCategory === cat ? 'solid' : 'ghost'"
        size="xs"
        @click="emit('update:activeCategory', cat)"
      >
        {{ categoryLabels[cat] }}
      </UButton>
    </div>

    <!-- Template list -->
    <div class="flex-1 overflow-y-auto">
      <button
        v-for="tpl in templates"
        :key="tpl.id"
        class="w-full text-left px-3 py-2 hover:bg-elevated transition-colors border-b border-muted group"
        @click="emit('place', tpl)"
      >
        <div class="text-sm font-medium group-hover:text-primary">{{ tpl.name }}</div>
        <pre class="text-[10px] leading-tight mt-1 text-muted overflow-hidden max-h-20 font-mono">{{
            tpl.content
          }}</pre>
      </button>
    </div>
  </div>
</template>
