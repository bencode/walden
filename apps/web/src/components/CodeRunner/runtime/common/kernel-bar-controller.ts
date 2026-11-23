// Page-level KernelBar controller.

import { getKernel, isLang } from '../registry'

type BarEls = {
  statusEl: HTMLElement
  resetBtn: HTMLButtonElement
  labelEl: HTMLElement
}

function queryBarEls(root: HTMLElement): BarEls | null {
  const statusEl = root.querySelector<HTMLElement>('.kernel-bar-status')
  const resetBtn = root.querySelector<HTMLButtonElement>('[data-action="reset-kernel"]')
  const labelEl = root.querySelector<HTMLElement>('.kernel-bar-label')
  if (!statusEl || !resetBtn || !labelEl) return null
  return { statusEl, resetBtn, labelEl }
}

export function initKernelBar(root: HTMLElement): void {
  const els = queryBarEls(root)
  if (!els) {
    console.error('KernelBar: missing required elements', root)
    return
  }
  const { statusEl, resetBtn, labelEl } = els

  const langRaw = root.dataset.lang ?? 'python'
  if (!isLang(langRaw)) {
    console.error('KernelBar: unknown lang', langRaw)
    return
  }

  const kernel = getKernel(langRaw)
  labelEl.textContent = kernel.label

  let initLabel = ''
  let initState: 'idle' | 'initializing' | 'ready' | 'error' = 'idle'
  let packageMsg: string | null = null

  function render(): void {
    if (initState === 'initializing') {
      statusEl.textContent = initLabel || '正在启动...'
      statusEl.dataset.state = 'loading'
      resetBtn.disabled = true
      return
    }
    if (initState === 'error') {
      statusEl.textContent = initLabel || '内核启动失败'
      statusEl.dataset.state = 'error'
      resetBtn.disabled = true
      return
    }
    if (packageMsg) {
      statusEl.textContent = packageMsg
      statusEl.dataset.state = 'loading'
      resetBtn.disabled = true
      return
    }
    if (initState === 'ready') {
      statusEl.textContent = '就绪'
      statusEl.dataset.state = 'ready'
      resetBtn.disabled = !kernel.supportsReset
      return
    }
    statusEl.textContent = '尚未启动（点任意 cell 的 ▶ 即可启动）'
    statusEl.dataset.state = 'idle'
    resetBtn.disabled = true
  }

  kernel.subscribe((state, message) => {
    initState = state
    initLabel = message ?? ''
    render()
  })

  kernel.subscribePackageLoad((msg) => {
    packageMsg = msg
    render()
  })

  resetBtn.addEventListener('click', async () => {
    resetBtn.disabled = true
    const original = resetBtn.textContent
    resetBtn.textContent = '重置中...'
    try {
      await kernel.reset()
      resetBtn.textContent = '已重置 ✓'
      setTimeout(() => {
        resetBtn.textContent = original
        resetBtn.disabled = false
      }, 1200)
    } catch (error) {
      console.error('KernelBar: reset failed', error)
      resetBtn.textContent = original
      resetBtn.disabled = false
    }
  })
}

export function initAllKernelBars(): void {
  document.querySelectorAll<HTMLElement>('.coderunner-kernel-bar').forEach((el) => {
    if (el.dataset.hydrated === 'true') return
    el.dataset.hydrated = 'true'
    initKernelBar(el)
  })
}
