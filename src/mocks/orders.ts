/**
 * @file Мок приказов и распоряжений.
 */

export type OrderStatus = 'published' | 'ready' | 'archived'

export const orderStatusLabel: Record<OrderStatus, string> = {
  published: 'опубликован',
  ready: 'готов к получению',
  archived: 'в архиве',
}

export type OrderDoc = {
  id: string
  programId: string
  type: string
  number: string
  date: string
  status: OrderStatus
  /** Предлагаемое имя файла — только для mock-скачивания */
  fileName: string
}

const orders: OrderDoc[] = [
  {
    id: 'o1',
    programId: 'b-2023',
    type: 'Приказ о зачислении',
    number: '1847-ст',
    date: '2023-08-28',
    status: 'archived',
    fileName: 'prikaz-zachislenie-1847.pdf',
  },
  {
    id: 'o2',
    programId: 'b-2023',
    type: 'Приказ о назначении стипендии',
    number: '412-ст',
    date: '2026-02-14',
    status: 'published',
    fileName: 'prikaz-stipendiya-412.pdf',
  },
  {
    id: 'o3',
    programId: 'b-2023',
    type: 'Приказ о допуске к экзаменам',
    number: '891-ст',
    date: '2026-06-01',
    status: 'ready',
    fileName: 'prikaz-dopusk-891.pdf',
  },
  {
    id: 'o4',
    programId: 'm-2025',
    type: 'Приказ о зачислении в магистратуру',
    number: '156-ст',
    date: '2025-09-01',
    status: 'published',
    fileName: 'prikaz-mag-156.pdf',
  },
]

/**
 * @param iso - `YYYY-MM-DD`
 */
export function formatOrderDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  return new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }).format(
    new Date(y, m - 1, d),
  )
}

/**
 * Приказы по программе.
 * @param programId - id программы
 */
export function ordersByProgram(programId: string): OrderDoc[] {
  return orders.filter((o) => o.programId === programId).sort((a, b) => b.date.localeCompare(a.date))
}

/**
 * Очищает имя файла перед mock-скачиванием.
 * @param name - исходное имя
 * @returns безопасное имя без path traversal
 */
export function safeFileName(name: string): string {
  const base = name.split(/[/\\]/).pop() ?? 'document.pdf'
  const cleaned = base.replace(/[^\w.\-а-яА-ЯёЁ]/g, '_')
  return cleaned.endsWith('.pdf') ? cleaned : `${cleaned}.pdf`
}

/**
 * Mock-скачивание: не открывает внешние URL, не доверяет mime.
 * @param fileName - имя из мока после {@link safeFileName}
 */
export function mockDownloadPdf(fileName: string): void {
  const safe = safeFileName(fileName)
  const blob = new Blob([`Mock PDF: ${safe}`], { type: 'application/pdf' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = safe
  link.rel = 'noopener noreferrer'
  link.click()
  URL.revokeObjectURL(url)
}
