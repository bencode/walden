// What the header REPL shows for one evaluation. Pure: the page only applies the result.

import prelude from './prelude.scm?raw'

export type ReplPost = { title: string; date: string; kind: string; href: string }
export type ReplData = { posts: ReplPost[]; places: Record<string, string> }
export type Effect = { type: string; args: string[] }
export type Evaluation = { value?: unknown; error?: string; effect: Effect | null }
// inline: text after the input; block: lines pushed below the header; go: address to open.
export type Output = { inline?: string; block?: string; go?: string }
export type Biwa = typeof import('biwascheme').default

type SchemePair = { car: { name?: string }; to_array(): unknown[] }

const KINDS: Record<string, string> = {
  essay: '长文',
  thought: '想法',
  update: '动态',
  log: '记录',
}
const HELP: ReadonlyArray<[string, string]> = [
  ["(what's new)", '最近写了什么'],
  ["(who's qijun)", '我是谁'],
  ["(where's qijun)", '我在哪些地方'],
  ["(qijun's posts)", '全部文章，是一个列表，可以 map、filter'],
  ["(qijun's lab)", '跳到 lab，blog、github 同理'],
  ['(source)', '这些机关的源码'],
]
const HINT = "，试试 (what's this)"

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const line = (html: string, cls = '') => `<div class="repl-line ${cls}">${html}</div>`
const err = (text: string) => `⇒ <span class="repl-err">${esc(text)}</span>`
// Same-site places are paths; show them under the current host.
const placeLabel = (url: string, host: string) =>
  url.startsWith('/') ? `${host}${url}` : url.replace(/^https:\/\//, '')
// Only site paths and web addresses: a typed (js-open "javascript:…") must not run script.
const isSafeUrl = (url: string) => /^(\/(?!\/)|https?:\/\/)/.test(url)

const goTo = (url: string | undefined, label: string, host: string): Output => {
  if (!url) return { inline: err(`${label} 还在建，快了`) }
  if (!isSafeUrl(url)) return { inline: err(`不能打开 ${url}`) }
  return { inline: `⇒ 前往 ${esc(placeLabel(url, host))}`, go: url }
}

const effectOutput = (effect: Effect, data: ReplData, host: string): Output => {
  const [arg0 = '', arg1 = ''] = effect.args
  const outputs: Record<string, () => Output> = {
    go: () => goTo(data.places[arg0], `${arg0}.qijun.io`, host),
    open: () => goTo(arg0, arg0, host),
    unknown: () => ({ inline: err(`${arg0} 还不知道 ${arg1}`) + HINT }),
    help: () => ({
      block:
        HELP.map(([code, note]) =>
          line(`${esc(code)}  <span class="repl-dim">${note}</span>`),
        ).join('') + line('也可以写任意 Scheme。', 'repl-dim'),
    }),
    who: () => ({
      block: line('Qijun，网名大鱼。') + line('在这里写长文、想法、动态和记录。', 'repl-dim'),
    }),
    where: () => ({
      block: Object.entries(data.places)
        .map(([name, url]) =>
          line(`${name.padEnd(7)} <a href="${esc(url)}">${esc(placeLabel(url, host))}</a>`),
        )
        .join(''),
    }),
    source: () => ({ block: `<pre>${esc(prelude.trim())}</pre>` }),
  }
  return outputs[effect.type]?.() ?? {}
}

// Visitors can build their own (post …) lists, so every field is coerced and the link checked.
const postLine = (B: Biwa, p: SchemePair) => {
  const [title = '', date = '', kind = '', href = ''] = p
    .to_array()
    .slice(1)
    .map((x) => B.to_display(x) as string)
  const link = isSafeUrl(href) ? `<a href="${esc(href)}">${esc(title)}</a>` : esc(title)
  return line(
    `${esc(date.slice(5))}  ${link} <span class="repl-dim">${esc(KINDS[kind] ?? kind)}</span>`,
  )
}

const valueOutput = (B: Biwa, value: unknown): Output => {
  if (value === undefined || value === B.undef) return { inline: '⇒ 无返回值' }
  const isPair = (x: unknown): x is SchemePair => x instanceof B.Pair
  const isPost = (x: unknown): x is SchemePair =>
    isPair(x) && x.car instanceof B.Symbol && x.car.name === 'post'
  if (isPost(value)) return { block: postLine(B, value) }
  const items = isPair(value) ? value.to_array() : []
  if (items.length > 0 && items.every(isPost))
    return { block: items.map((p) => postLine(B, p as SchemePair)).join('') }
  const text: string = B.to_write(value)
  if (text.length > 60) return { block: line(`⇒ ${esc(text)}`) }
  return {
    inline: `⇒ <span class="${typeof value === 'string' ? 'repl-str' : 'repl-val'}">${esc(text)}</span>`,
  }
}

export const toOutput = (B: Biwa, result: Evaluation, data: ReplData, host: string): Output => {
  if (result.error) {
    const name = result.error.match(/unbound (?:symbol|variable):?\s*"?([^"\s]+)/i)?.[1]
    return { inline: err(name ? `还没定义 ${name}` : result.error) + HINT }
  }
  if (result.effect) return effectOutput(result.effect, data, host)
  return valueOutput(B, result.value)
}

export const promptLine = (src: string) => line(`λ&gt; ${esc(src)}`, 'repl-dim')
