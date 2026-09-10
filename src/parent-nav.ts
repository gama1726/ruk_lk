import type { NavIconId } from '@/icons/nav'
import { ATTENDANCE_FEATURE_ENABLED } from '@/campus'
import { paths } from '@/paths'

export type ParentNavItem = {
  to: string
  label: string
  icon?: NavIconId
  /** false — только опрос; остальное требует dataAccessAllowed */
  requiresDataAccess?: boolean
}

export const parentSidebarTop: ParentNavItem[] = [
  { to: paths.parentHome, label: 'Профиль', icon: 'profile', requiresDataAccess: false },
  { to: paths.parentSurvey, label: 'Опрос университета', icon: 'requests', requiresDataAccess: false },
  { to: paths.parentEvents, label: 'Мероприятия', icon: 'events', requiresDataAccess: false },
]

export const parentSidebarBottom: ParentNavItem[] = []

const parentStudyItems: ParentNavItem[] = [
  { to: paths.parentSchedule, label: 'Расписание', icon: 'schedule' },
  { to: paths.parentRecordBook, label: 'Зачётная книжка ребёнка', icon: 'recordBook' },
  ...(ATTENDANCE_FEATURE_ENABLED
    ? ([{ to: paths.parentAttendance, label: 'Посещаемость', icon: 'attendance' }] as ParentNavItem[])
    : []),
  { to: paths.parentOrders, label: 'Приказы', icon: 'orders' },
]

export const parentSidebarGroups: {
  id: string
  label: string
  icon: NavIconId
  items: ParentNavItem[]
}[] = [
  {
    id: 'study',
    label: 'Обучение',
    icon: 'program',
    items: parentStudyItems,
  },
  {
    id: 'finance',
    label: 'Финансы',
    icon: 'payments',
    items: [{ to: paths.parentPayments, label: 'Оплата обучения', icon: 'payments' }],
  },
]
