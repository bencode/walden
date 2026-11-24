import { beforeAll, describe, expect, it } from 'vitest'
import { type Output, type ReplData, toOutput } from './output'
import { loadScheme, type Scheme } from './repl'

const data: ReplData = {
  posts: [
    { title: 'Newest essay', date: '2026-09-02', kind: 'essay', href: '/posts/b/' },
    { title: 'A thought', date: '2026-08-25', kind: 'thought', href: '/posts/a/' },
  ],
  places: { blog: '/', lab: 'https://lab.qijun.io/' },
}

let scheme: Scheme
const evaluate = (src: string): Output => toOutput(scheme.B, scheme.run(src), data, 'blog.qijun.io')

beforeAll(async () => {
  scheme = await loadScheme(data)
})

describe('header REPL', () => {
  it('reads English possessives and questions as macro calls', () => {
    expect(evaluate("(qijun's blog)")).toMatchObject({ go: '/' })
    expect(evaluate("(qijun's lab)")).toMatchObject({ go: 'https://lab.qijun.io/' })
    expect(evaluate("(qijun's read)")).toEqual({
      inline: expect.stringContaining('read.qijun.io 还在建'),
    })
    expect(evaluate("(what's new)").block).toContain('Newest essay')
    expect(evaluate("(who's qijun)").block).toContain('Qijun')
    expect(evaluate("(where's qijun)").block).toContain('blog.qijun.io/')
    expect(evaluate("(what's this)").block).toContain("(what's new)")
    expect(evaluate("(what's up)").inline).toContain('what 还不知道 up')
  })

  it('treats posts as data that list functions can query', () => {
    expect(evaluate("(length (qijun's posts))").inline).toContain('2')
    expect(evaluate("(map title (qijun's posts))").inline).toContain(
      '&quot;Newest essay&quot; &quot;A thought&quot;',
    )
    const essays = evaluate("(filter essay? (qijun's posts))").block
    expect(essays).toContain('Newest essay')
    expect(essays).not.toContain('A thought')
    expect(evaluate("(open (car (qijun's posts)))")).toMatchObject({ go: '/posts/b/' })
  })

  it('runs the slogan, plain Scheme and reports errors', () => {
    expect(evaluate('(-> math study practice code)').inline).toContain(
      '(λ () (study math) (practice code))',
    )
    expect(evaluate("(map (λ (x) (* x x)) '(1 2 3))").inline).toContain('(1 4 9)')
    expect(evaluate('(foo)').inline).toContain('还没定义 foo')
  })

  it('never turns typed script addresses into links or navigation', () => {
    const output = evaluate('(js-open "javascript:alert(1)")')
    expect(output.go).toBeUndefined()
    expect(output.inline).toContain('不能打开')
    const forged = evaluate(`(list 'post "<b>x</b>" 1 'essay "javascript:alert(1)")`).block
    expect(forged).not.toContain('href')
    expect(forged).toContain('&lt;b&gt;')
  })
})
