export default defineNuxtConfig({
  compatibilityDate: '2025-01-15',
  sourcemap: false,
  experimental: {
    payloadExtraction: true,
  },
  devtools: {
    enabled: false,
  },
  modules: [
    '@nuxt/ui',
  ],
  app: {
    head: {
      htmlAttrs: { lang: 'zh-CN' },
      title: 'Draw ASCII',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'ASCII 线框编辑器 - 绘制 ASCII 艺术和线框图' },
        { name: 'og:title', content: 'Draw ASCII' },
        { name: 'og:description', content: 'ASCII 线框编辑器 - 绘制 ASCII 艺术和线框图' },
        { name: 'twitter:title', content: 'Draw ASCII' },
        { name: 'twitter:description', content: 'ASCII 线框编辑器 - 绘制 ASCII 艺术和线框图' },
      ], link: [
        { rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' },
      ],
    },
  },
  css: ['~/assets/css/main.css'],
  routeRules: {
    '/': { prerender: true },
  },
})
