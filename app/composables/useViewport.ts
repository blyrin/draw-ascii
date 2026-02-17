export function useViewport(canvasEl: Ref<HTMLElement | null>) {
  const scrollTop = ref(0)
  const scrollLeft = ref(0)
  const clientWidth = ref(0)
  const clientHeight = ref(0)
  const cellWidth = ref(8)
  const cellHeight = ref(16)

  const visibleRows = computed(() => {
    const start = Math.floor(scrollTop.value / cellHeight.value)
    const count = Math.ceil(clientHeight.value / cellHeight.value) + 2
    return { start, count }
  })

  const visibleCols = computed(() => {
    const start = Math.floor(scrollLeft.value / cellWidth.value)
    const count = Math.ceil(clientWidth.value / cellWidth.value) + 2
    return { start, count }
  })

  function measureCell() {
    const span = document.createElement('span')
    span.className = 'font-mono'
    span.style.cssText = 'position:absolute;visibility:hidden;font-size:14px;white-space:pre;'
    span.textContent = 'M'
    document.body.appendChild(span)
    const rect = span.getBoundingClientRect()
    cellWidth.value = Math.round(rect.width * 100) / 100
    cellHeight.value = Math.round(rect.height * 100) / 100
    document.body.removeChild(span)
  }

  function onScroll() {
    if (!canvasEl.value) return
    scrollTop.value = canvasEl.value.scrollTop
    scrollLeft.value = canvasEl.value.scrollLeft
  }

  function updateSize() {
    if (!canvasEl.value) return
    clientWidth.value = canvasEl.value.clientWidth
    clientHeight.value = canvasEl.value.clientHeight
  }

  onMounted(() => {
    measureCell()
    updateSize()
    if (canvasEl.value) {
      canvasEl.value.addEventListener('scroll', onScroll, { passive: true })
    }
    window.addEventListener('resize', updateSize)
  })

  onBeforeUnmount(() => {
    if (canvasEl.value) {
      canvasEl.value.removeEventListener('scroll', onScroll)
    }
    window.removeEventListener('resize', updateSize)
  })

  return {
    scrollTop,
    scrollLeft,
    clientWidth,
    clientHeight,
    cellWidth,
    cellHeight,
    visibleRows,
    visibleCols,
    measureCell,
    updateSize,
  }
}
