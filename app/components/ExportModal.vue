<script lang="ts" setup>
defineProps<{
  text: string
}>()

const emit = defineEmits<{
  'close': []
  'copy': []
  'download': []
}>()
</script>

<template>
  <UModal :open="true" description="预览并导出 ASCII 内容" title="导出 ASCII" @close="emit('close')">

    <template #body>
      <pre
        class="p-3 bg-elevated rounded text-sm font-mono overflow-auto max-h-80 whitespace-pre border border-default">{{
          text
        }}</pre>
    </template>

    <template #footer>
      <div class="flex justify-end gap-2">
        <UButton icon="i-lucide-copy" @click="emit('copy')">复制到剪贴板</UButton>
        <UButton color="neutral" icon="i-lucide-download" variant="outline" @click="emit('download')">下载 .md
        </UButton>
        <UButton color="neutral" variant="ghost" @click="emit('close')">关闭</UButton>
      </div>
    </template>
  </UModal>
</template>
