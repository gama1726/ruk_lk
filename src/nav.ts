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
  { to: paths.news, label: 'Новости и уведомления' },
  { to: paths.schedule, label: 'Расписание' },
]

/** Раскрывающиеся разделы */
export const sidebarGroups: NavGroup[] = [
  {
    id: 'study',
    label: 'Обучение',
    items: [
      { to: paths.attendance, label: 'Посещаемость' },
      { to: paths.recordBook, label: 'Электронная зачётная книжка' },
      { to: paths.grades, label: 'Успеваемость' },
      { to: paths.debts, label: 'Академические задолженности' },
      { to: paths.library, label: 'Читательский билет' },
      { to: paths.teachers, label: 'Преподаватели' },
      { to: paths.orders, label: 'Приказы' },
    ],
  },
  {
    id: 'program',
    label: 'Образовательная программа',
    items: [
      { to: paths.studyPlan, label: 'Учебный план' },
      { to: paths.roadmap, label: 'Траектория' },
    ],
  },
  {
    id: 'services',
    label: 'Сервисы',
    items: [
      { to: paths.requests, label: 'Заявления' },
      { to: paths.payments, label: 'Оплата услуг' },
      { to: paths.dormitory, label: 'Заявки по общежитиям' },
      { to: paths.bypassList, label: 'Обходной лист' },
      { to: paths.psychologist, label: 'Приём психолога' },
      { to: paths.portfolio, label: 'Портфолио' },
      { to: paths.settings, label: 'Настройки' },
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
  { to: paths.news, label: 'Уведомления' },
  { to: paths.services, label: 'Сервисы' },
]
