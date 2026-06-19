/**
 * @file Библиотека и ЭБС (мок).
 */

export type LibraryBook = {
  id: string
  title: string
  author: string
  takenAt: string
  dueDate: string
  status: 'on-hand' | 'overdue'
}

export type EbsResource = {
  id: string
  name: string
  description: string
  url: string
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

export const ebsResources: EbsResource[] = [
  {
    id: 'ebs-1',
    name: 'ЭБС «Лань»',
    description: 'Учебники по экономике и менеджменту',
    url: 'https://e.lanbook.com',
  },
  {
    id: 'ebs-2',
    name: 'ЭБС «Юрайт»',
    description: 'Право, IT, гуманитарные дисциплины',
    url: 'https://urait.ru',
  },
  {
    id: 'ebs-3',
    name: 'ЭБС IPR SMART',
    description: 'Научные публикации и монографии',
    url: 'https://www.iprbookshop.ru',
  },
]

/**
 * Заглушка перехода в ЭБС — внешний сервис подключится позже.
 * @param name - название ресурса для сообщения
 */
export function openEbsStub(name: string): void {
  window.alert(`Доступ к «${name}» откроется после авторизации через библиотечный портал РУК.`)
}

/**
 * @param iso - `YYYY-MM-DD`
 */
export function formatLibraryDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  return new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long' }).format(new Date(y, m - 1, d))
}
