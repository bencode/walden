import { getCollection } from 'astro:content'
import rss from '@astrojs/rss'
import type { APIContext } from 'astro'
import { siteDescription, siteName } from '../site'

export const GET = async (context: APIContext) => {
  const posts = await getCollection('posts', ({ data }) => !data.draft)
  return rss({
    title: siteName,
    description: siteDescription,
    site: context.site ?? context.url.origin,
    items: posts
      .toSorted((a, b) => b.data.date.valueOf() - a.data.date.valueOf())
      .map((post) => ({
        title: post.data.title,
        description: post.data.summary,
        pubDate: post.data.date,
        link: `/posts/${post.id}/`,
        categories: post.data.tags,
      })),
    customData: '<language>zh-CN</language>',
  })
}
