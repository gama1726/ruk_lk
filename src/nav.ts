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
  { to: paths.news, label: 'Новости и уведомления (dev)', icon: 'news' },
  { to: paths.schedule, label: 'Расписание', icon: 'schedule' },
]

/** Раскрывающиеся разделы */
export const sidebarGroups: NavGroup[] = [
  {
    id: 'study',
    label: 'Обучение',
    icon: 'study',
    items: [
      { to: paths.attendance, label: 'Посещаемость (dev)' },
      { to: paths.recordBook, label: 'Электронная зачётная книжка' },
      { to: paths.grades, label: 'Успеваемость' },
      { to: paths.debts, label: 'Академические задолженности' },
      { to: paths.library, label: 'Читательский билет (dev)' },
      { to: paths.teachers, label: 'Преподаватели (dev)' },
      { to: paths.orders, label: 'Приказы' },
    ],
  },
  {
    id: 'program',
    label: 'Образовательная программа',
    icon: 'program',
    items: [
      { to: paths.studyPlan, label: 'Учебный план' },
      { to: paths.roadmap, label: 'Траектория обучения' },
    ],
  },
  {
    id: 'services',
    label: 'Сервисы',
    icon: 'services',
    items: [
      { to: paths.requests, label: 'Заявления (dev)' },
      { to: paths.payments, label: 'Оплата обучения' },
      { to: paths.dormitory, label: 'Заявки по общежитиям (dev)' },
      { to: paths.bypassList, label: 'Обходной лист (dev)' },
      { to: paths.psychologist, label: 'Приём психолога (dev)' },
      { to: paths.portfolio, label: 'Портфолио' },
      { to: paths.settings, label: 'Настройки (dev)' },
      { to: paths.passPhoto, label: 'Фото для пропуска' },
    ],
  },
]

/** Полное меню для drawer на mobile */
export const menu = [
  { title: 'Разделы', items: sidebarTop },
  ...sidebarGroups.map((g) => ({ title: g.label, items: g.items })),
]

/** Короткий набор вкладок внизу экрана на mobile */
export const mobileTabs: NavItem[] = [
  { to: paths.profile, label: 'Профиль', icon: 'profile' },
  { to: paths.schedule, label: 'Расписание', icon: 'schedule' },
  { to: paths.news, label: 'Уведомления (dev)', icon: 'news' },
  { to: paths.services, label: 'Сервисы', icon: 'services' },
]
