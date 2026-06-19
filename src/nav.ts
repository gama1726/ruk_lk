import { paths } from '@/paths'

export type NavItem = {
  to: string
  label: string
}

export type NavSection = {
  title: string
  items: NavItem[]
}

export const menu: NavSection[] = [
  {
    title: 'Главное',
    items: [
      { to: paths.profile, label: 'Профиль' },
      { to: paths.news, label: 'Новости и уведомления' },
      { to: paths.schedule, label: 'Расписание' },
    ],
  },
  {
    title: 'Обучение',
    items: [
      { to: paths.attendance, label: 'Посещаемость' },
      { to: paths.recordBook, label: 'Зачётная книжка' },
      { to: paths.grades, label: 'Успеваемость' },
      { to: paths.debts, label: 'Задолженности' },
      { to: paths.studyPlan, label: 'Учебный план' },
      { to: paths.roadmap, label: 'Траектория' },
      { to: paths.teachers, label: 'Преподаватели' },
      { to: paths.orders, label: 'Приказы и документы' },
    ],
  },
  {
    title: 'Сервисы',
    items: [
      { to: paths.requests, label: 'Заявления и справки' },
      { to: paths.payments, label: 'Оплата и договоры' },
      { to: paths.dormitory, label: 'Общежитие' },
      { to: paths.bypassList, label: 'Обходной лист' },
      { to: paths.psychologist, label: 'Психолог' },
      { to: paths.portfolio, label: 'Портфолио' },
      { to: paths.library, label: 'Библиотека' },
    ],
  },
  {
    title: 'Аккаунт',
    items: [
      { to: paths.settings, label: 'Настройки' },
    ],
  },
]

export const mobileTabs: NavItem[] = [
  { to: paths.home, label: 'Главная' },
  { to: paths.schedule, label: 'Расписание' },
  { to: paths.news, label: 'Уведомления' },
  { to: paths.services, label: 'Сервисы' },
]
