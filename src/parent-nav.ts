import type { NavIconId } from '@/icons/nav'
import { paths } from '@/paths'

export type ParentNavItem = {
  to: string
  label: string
  icon?: NavIconId
  /** false — только опрос; остальное требует dataAccessAllowed */
  requiresDataAccess?: boolean
}

export const parentSidebarTop: ParentNavItem[] = [
  { to: paths.parentHome, label: 'Главная', icon: 'profile', requiresDataAccess: false },
  { to: paths.parentSurvey, label: 'Опрос университета', icon: 'requests', requiresDataAccess: false },
]

export const parentSidebarBottom: ParentNavItem[] = [
  { to: paths.parentProfile, label: 'Профиль', icon: 'profile', requiresDataAccess: false },
]

export const parentSidebarGroups: { id: string; label: string; icon: NavIconId; items: ParentNavItem[] }[] = [
  {
    id: 'study',
    label: 'Обучение',
    icon: 'program',
    items: [
      { to: paths.parentSchedule, label: 'Расписание', icon: 'schedule' },
      { to: paths.parentRecordBook, label: 'Зачётная книжка', icon: 'recordBook' },
      { to: paths.parentAttendance, label: 'Посещаемость', icon: 'attendance' },
      { to: paths.parentOrders, label: 'Приказы', icon: 'orders' },
    ],
  },
  {
    id: 'finance',
    label: 'Финансы',
    icon: 'payments',
    items: [{ to: paths.parentPayments, label: 'Оплата обучения', icon: 'payments' }],
  },
]
