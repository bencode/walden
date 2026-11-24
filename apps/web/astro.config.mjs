import { unified } from '@astrojs/markdown-remark'
import mdx from '@astrojs/mdx'
import sitemap from '@astrojs/sitemap'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'astro/config'
import rehypeExternalLinks from 'rehype-external-links'
import rehypeKatex from 'rehype-katex'
import remarkMath from 'remark-math'
import { reviewSidecar } from './src/integrations/review-sidecar'

const remarkStripFirstH1 = () => (tree) => {
  const first = tree.children?.[0]
  if (first && first.type === 'heading' && first.depth === 1) {
    tree.children.shift()
  }
}

// Convert ```mermaid fenced blocks into raw <pre class="mermaid">…</pre>
// so Shiki skips them and the client-side mermaid script can render
// them in place. Runs before Shiki since it's a remark (mdast) plugin.
const remarkMermaid = () => (tree) => {
  const escapeHtml = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  const walk = (node) => {
    if (!node.children) return
    for (let i = 0; i < node.children.length; i += 1) {
      const child = node.children[i]
      if (child.type === 'code' && child.lang === 'mermaid') {
        node.children[i] = {
          type: 'html',
          value: `<pre class="mermaid">${escapeHtml(child.value)}</pre>`,
        }
      } else {
        walk(child)
      }
    }
  }
  walk(tree)
}

const shikiConfig = {
  themes: { light: 'github-light-default', dark: 'github-dark-default' },
  // Emit both themes as CSS variables only; global.css picks one per colour scheme.
  defaultColor: false,
  wrap: false,
}

// 外链（http/https 且非本站）自动开新标签页
const externalLinksConfig = [
  rehypeExternalLinks,
  { target: '_blank', rel: ['noopener', 'noreferrer'] },
]

const markdownProcessor = unified({
  remarkPlugins: [remarkStripFirstH1, remarkMermaid, remarkMath],
  rehypePlugins: [rehypeKatex, externalLinksConfig],
})

export default defineConfig({
  site: 'https://blog.qijun.io',
  compressHTML: true,
  integrations: [mdx(), sitemap(), reviewSidecar()],
  vite: {
    plugins: [tailwindcss()],
  },
  markdown: {
    processor: markdownProcessor,
    shikiConfig,
  },
})
