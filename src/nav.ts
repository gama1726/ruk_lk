/**
 * @file Структура меню кабинета (сайдбар в стиле портала).
 * @see {@link sidebarTop}, {@link sidebarGroups}
 */

import { paths } from '@/paths'

/** Пункт навигации */
export type NavItem = {
  to: string
  label: string
}

/** Раскрывающаяся группа в сайдбаре */
export type NavGroup = {
  id: string
  label: string
  items: NavItem[]
}

/** Верхние пункты без группы — как у МИРЭА */
export const sidebarTop: NavItem[] = [
  { to: paths.profile, label: 'Профиль' },
  { to: paths.news, label: 'Новости и уведомления (dev)' },
  { to: paths.schedule, label: 'Расписание' },
]

/** Раскрывающиеся разделы */
export const sidebarGroups: NavGroup[] = [
  {
    id: 'study',
    label: 'Обучение',
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
    items: [
      { to: paths.studyPlan, label: 'Учебный план' },
      { to: paths.roadmap, label: 'Траектория обучения' },
    ],
  },
  {
    id: 'services',
    label: 'Сервисы',
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
  { to: paths.profile, label: 'Профиль' },
  { to: paths.schedule, label: 'Расписание' },
  { to: paths.news, label: 'Уведомления (dev)' },
  { to: paths.services, label: 'Сервисы' },
]
