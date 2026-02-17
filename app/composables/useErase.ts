export function useErase(
  canvas: ReturnType<typeof import('./useCanvas').useCanvas>,
  history: ReturnType<typeof import('./useHistory').useHistory>,
) {
  let snapshotPushed = false

  function startErase() {
    snapshotPushed = false
  }

  function eraseAt(row: number, col: number) {
    if (!snapshotPushed) {
      history.pushSnapshot()
      snapshotPushed = true
    }
    canvas.setCell(row, col, ' ')
  }

  function endErase() {
    snapshotPushed = false
  }

  return { startErase, eraseAt, endErase }
}
