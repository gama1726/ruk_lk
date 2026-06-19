/**
 * @file Уведомления и новости на главной.
 */

export type NoticeCategory = 'dekanat' | 'teachers' | 'system' | 'finance' | 'requests'

export type Notice = {
  id: string
  category: NoticeCategory
  title: string
  preview: string
  date: string
  read: boolean
}

export type NoticeFilter = 'all' | NoticeCategory

const categoryLabel: Record<NoticeCategory, string> = {
  dekanat: 'Деканат',
  teachers: 'Преподаватели',
  system: 'Система',
  finance: 'Финансы',
  requests: 'Заявления',
}

/** Подписи фильтров на странице новостей */
export const noticeFilters: { id: NoticeFilter; label: string }[] = [
  { id: 'all', label: 'Все' },
  { id: 'dekanat', label: 'Деканат' },
  { id: 'teachers', label: 'Преподаватели' },
  { id: 'system', label: 'Система' },
  { id: 'finance', label: 'Финансы' },
  { id: 'requests', label: 'Заявления' },
]

/**
 * Человекочитаемая категория уведомления.
 * @param category - код категории
 */
export function noticeCategoryLabel(category: NoticeCategory): string {
  return categoryLabel[category]
}

/** Полный список уведомлений */
export const notices: Notice[] = [
  {
    id: 'n1',
    category: 'dekanat',
    title: 'График летней сессии',
    preview: 'Опубликовано расписание экзаменов на июнь–июль.',
    date: '2026-06-18',
    read: false,
  },
  {
    id: 'n2',
    category: 'finance',
    title: 'Напоминание об оплате',
    preview: 'Следующий платёж по договору — до 25 июня.',
    date: '2026-06-17',
    read: true,
  },
  {
    id: 'n3',
    category: 'requests',
    title: 'Справка готова к выдаче',
    preview: 'Заявление №1042 можно забрать в деканате.',
    date: '2026-06-16',
    read: true,
  },
  {
    id: 'n4',
    category: 'teachers',
    title: 'Консультация по «Базы данных»',
    preview: 'Смирнова Е.А. — среда, 15:00, ауд. Б-311.',
    date: '2026-06-15',
    read: true,
  },
  {
    id: 'n5',
    category: 'system',
    title: 'Плановые работы в личном кабинете',
    preview: 'В ночь на 22 июня возможны кратковременные перебои.',
    date: '2026-06-14',
    read: true,
  },
  {
    id: 'n6',
    category: 'dekanat',
    title: 'Сбор справок для воинского учёта',
    preview: 'Студентам очной формы — до 30 июня.',
    date: '2026-06-12',
    read: true,
  },
]

/**
 * Важные уведомления для главной (первые три, непрочитанные выше).
 * @param readMap - карта прочитанности из {@link useReadState}
 */
export function homeNotices(readMap: Record<string, boolean>) {
  return [...notices].sort((a, b) => Number(readMap[a.id]) - Number(readMap[b.id])).slice(0, 3)
}

/**
 * Фильтрация ленты по категории.
 * @param filter - выбранный фильтр
 */
export function filterNotices(filter: NoticeFilter): Notice[] {
  if (filter === 'all') return notices
  return notices.filter((n) => n.category === filter)
}
