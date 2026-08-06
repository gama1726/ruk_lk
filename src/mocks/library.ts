/**
 * @file Библиотека (мок).
 */

export type LibraryBook = {
  id: string
  title: string
  author: string
  takenAt: string
  dueDate: string
  status: 'on-hand' | 'overdue'
}

export type LibraryCard = {
  number: string
  holder: string
  validUntil: string
  status: 'active' | 'blocked'
}

export const libraryCard: LibraryCard = {
  number: 'RUC-LIB-2023-1842',
  holder: 'Иванов А.С.',
  validUntil: '2027-06-30',
  status: 'active',
}

/** Одна книга на руках, без задолженности */
export const booksOnHand: LibraryBook[] = [
  {
    id: 'lib-b-91',
    title: 'Базы данных',
    author: 'Коннолли Т., Бегг К.',
    takenAt: '2026-06-01',
    dueDate: '2026-07-15',
    status: 'on-hand',
  },
]

export const libraryDebts: LibraryBook[] = []

/**
 * @param iso - `YYYY-MM-DD`
 */
export function formatLibraryDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  return new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long' }).format(new Date(y, m - 1, d))
}
