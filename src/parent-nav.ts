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
  { to: paths.parentHome, label: 'Профиль', icon: 'profile', requiresDataAccess: false },
  { to: paths.parentSurvey, label: 'Опрос университета', icon: 'requests', requiresDataAccess: false },
  { to: paths.parentEvents, label: 'Мероприятия', icon: 'events', requiresDataAccess: false },
]

export const parentSidebarBottom: ParentNavItem[] = []

const parentStudyItemsBase: ParentNavItem[] = [
  { to: paths.parentSchedule, label: 'Расписание', icon: 'schedule' },
  { to: paths.parentRecordBook, label: 'Зачётная книжка ребёнка', icon: 'recordBook' },
  { to: paths.parentAttendance, label: 'Посещаемость', icon: 'attendance' },
  { to: paths.parentOrders, label: 'Приказы', icon: 'orders' },
]

export function getParentStudyItems(attendanceEnabled: boolean): ParentNavItem[] {
  if (attendanceEnabled) return parentStudyItemsBase
  return parentStudyItemsBase.filter((item) => item.to !== paths.parentAttendance)
}

export function getParentSidebarGroups(attendanceEnabled: boolean): {
  id: string
  label: string
  icon: NavIconId
  items: ParentNavItem[]
}[] {
  return [
    {
      id: 'study',
      label: 'Обучение',
      icon: 'program',
      items: getParentStudyItems(attendanceEnabled),
    },
    {
      id: 'finance',
      label: 'Финансы',
      icon: 'payments',
      items: [{ to: paths.parentPayments, label: 'Оплата обучения', icon: 'payments' }],
    },
  ]
}
