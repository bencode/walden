// Header REPL: a real Scheme (BiwaScheme), loaded on first focus.
// The tricks live in prelude.scm; the js-* functions below are its bridge to the page.

import {
  type Biwa,
  type Effect,
  type Evaluation,
  promptLine,
  type ReplData,
  toOutput,
} from './output'
import prelude from './prelude.scm?raw'

export type { ReplData } from './output'
export type Scheme = { B: Biwa; run: (code: string) => Evaluation }

const DEFAULT = "(qijun's blog)"
const EFFECTS = ['go', 'open', 'help', 'who', 'where', 'source', 'unknown']
const MAX_ENTRIES = 4

export const loadScheme = async (data: ReplData): Promise<Scheme> => {
  const mod = await import('biwascheme')
  const B: Biwa = mod.default ?? mod
  let effect: Effect | null = null
  let lastError: { message?: string } | null = null
  B.define_libfunc('js-posts', 0, 0, () =>
    B.List(...data.posts.map((p) => B.List(B.Sym('post'), p.title, p.date, B.Sym(p.kind), p.href))),
  )
  for (const type of EFFECTS) {
    B.define_libfunc(`js-${type}`, 0, 2, (args: unknown[]) => {
      effect = { type, args: args.map((a) => B.to_display(a)) }
      return B.undef
    })
  }
  const interpreter = new B.Interpreter((e: { message?: string }) => {
    lastError = e
  })
  // BiwaScheme reports some errors through the handler and throws others; both become a result.
  const run = (code: string): Evaluation => {
    lastError = null
    effect = null
    try {
      const value = interpreter.evaluate(code)
      const error = lastError as { message?: string } | null
      return error ? { error: error.message ?? String(error), effect } : { value, effect }
    } catch (e) {
      return { error: e instanceof Error ? e.message : String(e), effect }
    }
  }
  run(prelude)
  return { B, run }
}

export const initRepl = (root: HTMLElement, data: ReplData) => {
  const input = root.querySelector<HTMLInputElement>('input')
  const inline = root.querySelector<HTMLElement>('[data-inline]')
  const term = document.querySelector<HTMLElement>('[data-repl-term]')
  if (!input || !inline || !term) return

  let scheme: Promise<Scheme> | null = null
  const load = () => {
    scheme ??= loadScheme(data)
    return scheme
  }
  const fitWidth = () => {
    input.style.width = `${Math.max(input.value.length, 2) + 1}ch`
  }
  const say = (html: string) => {
    inline.innerHTML = html
  }
  const push = (src: string, body: string) => {
    const entry = document.createElement('div')
    entry.className = 'repl-entry'
    entry.innerHTML = promptLine(src) + body
    term.prepend(entry)
    while (term.children.length > MAX_ENTRIES) term.lastElementChild?.remove()
  }

  const history: string[] = []
  let cursor = 0
  const recall = (step: number) => {
    if (history.length === 0) return
    cursor = Math.min(history.length, Math.max(0, cursor + step))
    input.value = history[cursor] ?? ''
    fitWidth()
  }
  const evaluate = async () => {
    const src = input.value.trim()
    if (!src) return
    history.push(src)
    cursor = history.length
    const loaded = await load().catch((error: unknown) => {
      console.error('REPL 解释器加载失败', error)
      return null
    })
    if (!loaded) return say('⇒ <span class="repl-err">解释器加载失败，请检查网络</span>')
    const output = toOutput(loaded.B, loaded.run(src), data, window.location.host)
    say(output.inline ?? '')
    if (output.block) push(src, output.block)
    if (output.go) window.location.assign(output.go)
  }
  const reset = () => {
    term.innerHTML = ''
    say('')
    input.value = DEFAULT
    fitWidth()
    input.blur()
  }
  const keys: Record<string, (e: KeyboardEvent) => void> = {
    Enter: (e) => {
      e.preventDefault()
      void evaluate()
    },
    Escape: reset,
    ArrowUp: (e) => {
      e.preventDefault()
      recall(-1)
    },
    ArrowDown: (e) => {
      e.preventDefault()
      recall(1)
    },
  }

  fitWidth()
  input.addEventListener('input', () => {
    fitWidth()
    say('')
  })
  input.addEventListener('focus', () => {
    load().catch((error) => console.error('REPL 解释器加载失败', error))
  })
  input.addEventListener('keydown', (e) => keys[e.key]?.(e))
  input.addEventListener('blur', () => {
    if (!input.value.trim()) reset()
  })
}
