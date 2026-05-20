export type Book = {
  id: string
  title: string
  subtitle?: string
  dirPrefix: string
}

export const books: readonly Book[] = [
  {
    id: 'ir',
    title: 'Introduction to Information Retrieval',
    subtitle: '《信息检索导论》读书笔记',
    dirPrefix: 'introduction-to-information-retrieval',
  },
]

export const getBook = (id: string): Book | undefined => books.find((b) => b.id === id)

export const bookOfEntry = (entryId: string): Book | undefined =>
  books.find((b) => entryId.startsWith(`${b.dirPrefix}/`))

export const slugInBook = (entryId: string, book: Book): string =>
  entryId.slice(book.dirPrefix.length + 1)

export const titleFromBody = (body: string | undefined, fallback: string): string => {
  if (!body) return fallback
  const match = body.match(/^#\s+(.+)$/m)
  return match ? match[1].trim() : fallback
}
