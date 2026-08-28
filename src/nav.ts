/**
 * @file Структура меню кабинета (сайдбар в стиле портала).
 * @see {@link sidebarTop}, {@link sidebarGroups}
 */

import type { NavIconId } from '@/icons/nav'
import { paths } from '@/paths'

/** Пункт навигации */
export type NavItem = {
  to: string
  label: string
  icon?: NavIconId
}

/** Раскрывающаяся группа в сайдбаре */
export type NavGroup = {
  id: string
  label: string
  icon: NavIconId
  items: NavItem[]
}

/** Верхние пункты без группы — как у МИРЭА */
export const sidebarTop: NavItem[] = [
  { to: paths.profile, label: 'Профиль', icon: 'profile' },
  { to: paths.news, label: 'Новости', icon: 'news' },
  { to: paths.schedule, label: 'Расписание', icon: 'schedule' },
]

/** Раскрывающиеся разделы */
export const sidebarGroups: NavGroup[] = [
  {
    id: 'study',
    label: 'Обучение',
    icon: 'study',
    items: [
      { to: paths.attendance, label: 'Посещаемость', icon: 'attendance' },
      { to: paths.eJournal, label: 'Электронный журнал', icon: 'eJournal' },
      { to: paths.recordBook, label: 'Электронная зачётная книжка', icon: 'recordBook' },
      { to: paths.debts, label: 'Академические задолженности', icon: 'debts' },
      { to: paths.library, label: 'Читательский билет', icon: 'library' },
      { to: paths.teachers, label: 'Преподаватели', icon: 'teachers' },
      { to: paths.orders, label: 'Приказы', icon: 'orders' },
    ],
  },
  {
    id: 'program',
    label: 'Образовательная программа',
    icon: 'program',
    items: [
      { to: paths.studyPlan, label: 'Учебный план', icon: 'studyPlan' },
      { to: paths.roadmap, label: 'Траектория обучения', icon: 'roadmap' },
    ],
  },
  {
    id: 'services',
    label: 'Сервисы',
    icon: 'services',
    items: [
      { to: paths.requests, label: 'Заявления', icon: 'requests' },
      { to: paths.payments, label: 'Оплата обучения', icon: 'payments' },
      { to: paths.psychologist, label: 'Приём психолога', icon: 'psychologist' },
      { to: paths.portfolio, label: 'Портфолио', icon: 'portfolio' },
      { to: paths.settings, label: 'Настройки', icon: 'settings' },
      { to: paths.passPhoto, label: 'Фото для пропуска', icon: 'passPhoto' },
      { to: paths.esports, label: 'Киберспорт', icon: 'esports' },
    ],
  },
]

/** Полное меню для drawer на mobile */
export function buildMenu(options?: { attendance?: boolean }) {
  const groups = getSidebarGroups(options)
  return [
    { title: 'Разделы', items: sidebarTop },
    ...groups.map((g) => ({ title: g.label, items: g.items })),
  ]
}

/** @deprecated Используйте {@link buildMenu} с учётом филиала */
export const menu = buildMenu()

/** Короткий набор вкладок внизу экрана на mobile */
export const mobileTabs: NavItem[] = [
  { to: paths.profile, label: 'Профиль', icon: 'profile' },
  { to: paths.schedule, label: 'Расписание', icon: 'schedule' },
  { to: paths.news, label: 'Новости', icon: 'news' },
  { to: paths.services, label: 'Сервисы', icon: 'services' },
]

/** Группы сайдбара; {@code attendance: false} — скрыть посещаемость (филиалы). */
export function getSidebarGroups(options?: { attendance?: boolean }): NavGroup[] {
  const showAttendance = options?.attendance !== false
  return sidebarGroups.map((group) => {
    if (group.id !== 'study') return group
    return {
      ...group,
      items: showAttendance
        ? group.items
        : group.items.filter((item) => item.to !== paths.attendance),
    }
  })
}
