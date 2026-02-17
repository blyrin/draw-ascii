<template>
  <UDropdownMenu
    v-slot="{ open }"
    :content="{ align: 'start' }"
    :items="[{
      label: 'Starter',
      to: 'https://starter-template.nuxt.dev/',
      color: 'primary',
      checked: true,
      type: 'checkbox'
    }, {
      label: 'Landing',
      to: 'https://landing-template.nuxt.dev/'
    }, {
      label: 'Docs',
      to: 'https://docs-template.nuxt.dev/'
    }, {
      label: 'SaaS',
      to: 'https://saas-template.nuxt.dev/'
    }, {
      label: 'Dashboard',
      to: 'https://dashboard-template.nuxt.dev/'
    }, {
      label: 'Chat',
      to: 'https://chat-template.nuxt.dev/'
    }, {
      label: 'Portfolio',
      to: 'https://portfolio-template.nuxt.dev/'
    }, {
      label: 'Changelog',
      to: 'https://changelog-template.nuxt.dev/'
    }]"
    :modal="false"
    :ui="{ content: 'min-w-fit' }"
    size="xs"
  >
    <UButton
      :class="[open && 'bg-primary/15']"
      :ui="{
        trailingIcon: ['transition-transform duration-200', open ? 'rotate-180' : undefined].filter(Boolean).join(' ')
      }"
      class="-mb-1.5 font-semibold rounded-full truncate"
      label="Starter"
      size="xs"
      trailing-icon="i-lucide-chevron-down"
      variant="subtle"
    />
  </UDropdownMenu>
</template>
