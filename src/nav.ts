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
      { to: paths.attendance, label: 'Посещаемость (dev)', icon: 'attendance' },
      { to: paths.recordBook, label: 'Электронная зачётная книжка', icon: 'recordBook' },
      { to: paths.grades, label: 'Успеваемость', icon: 'grades' },
      { to: paths.debts, label: 'Академические задолженности', icon: 'debts' },
      { to: paths.library, label: 'Читательский билет (dev)', icon: 'library' },
      { to: paths.teachers, label: 'Преподаватели (dev)', icon: 'teachers' },
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
      { to: paths.requests, label: 'Заявления (dev)', icon: 'requests' },
      { to: paths.payments, label: 'Оплата обучения', icon: 'payments' },
      { to: paths.dormitory, label: 'Заявки по общежитиям (dev)', icon: 'dormitory' },
      { to: paths.bypassList, label: 'Обходной лист (dev)', icon: 'bypassList' },
      { to: paths.psychologist, label: 'Приём психолога (dev)', icon: 'psychologist' },
      { to: paths.portfolio, label: 'Портфолио', icon: 'portfolio' },
      { to: paths.settings, label: 'Настройки (dev)', icon: 'settings' },
      { to: paths.passPhoto, label: 'Фото для пропуска', icon: 'passPhoto' },
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
  { to: paths.news, label: 'Новости', icon: 'news' },
  { to: paths.services, label: 'Сервисы', icon: 'services' },
]
