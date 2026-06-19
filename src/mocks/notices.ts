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

const categoryLabel: Record<NoticeCategory, string> = {
  dekanat: 'Деканат',
  teachers: 'Преподаватели',
  system: 'Система',
  finance: 'Финансы',
  requests: 'Заявления',
}

/**
 * Человекочитаемая категория уведомления.
 * @param category - код категории
 */
export function noticeCategoryLabel(category: NoticeCategory): string {
  return categoryLabel[category]
}

/** Лента для главной: сначала непрочитанные */
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
]

/**
 * Важные уведомления для главной (первые три).
 */
export function homeNotices(): Notice[] {
  return [...notices].sort((a, b) => Number(a.read) - Number(b.read)).slice(0, 3)
}

export function unreadCount(): number {
  return notices.filter((n) => !n.read).length
}
