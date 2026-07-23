/**
 * @file Иконки пунктов сайдбара (outline, currentColor).
 * Смысл как у типичного ЛК, визуально отличный от МИРЭА.
 */

import type { ReactElement } from 'react'

export type NavIconId =
  | 'profile'
  | 'news'
  | 'schedule'
  | 'study'
  | 'studyPlan'
  | 'program'
  | 'services'
  | 'roadmap'
  | 'requests'
  | 'payments'
  | 'dormitory'
  | 'bypassList'
  | 'psychologist'
  | 'portfolio'
  | 'settings'
  | 'passPhoto'
  | 'attendance'
  | 'recordBook'
  | 'grades'
  | 'debts'
  | 'library'
  | 'teachers'
  | 'orders'

type IconProps = {
  className?: string
}

const stroke = {
  fill: 'none' as const,
  stroke: 'currentColor',
  strokeWidth: 1.75,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}

/** Профиль — силуэт в круге (не дом, как у МИРЭА) */
function ProfileIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
      <circle cx="12" cy="12" r="9" {...stroke} />
      <circle cx="12" cy="10" r="3" {...stroke} />
      <path d="M6.5 18.2c1.4-2.2 3.3-3.2 5.5-3.2s4.1 1 5.5 3.2" {...stroke} />
    </svg>
  )
}

/** Новости — два overlapping диалога */
function NewsIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
      <path
        d="M4.5 4.5h9.5a2.5 2.5 0 0 1 2.5 2.5v5a2.5 2.5 0 0 1-2.5 2.5H9.5L6 17.5v-3H4.5A2.5 2.5 0 0 1 2 12V7a2.5 2.5 0 0 1 2.5-2.5Z"
        {...stroke}
      />
      <path
        d="M10 10.5h9.5A2.5 2.5 0 0 1 22 13v5a2.5 2.5 0 0 1-2.5 2.5H18v3l-3.5-3H10A2.5 2.5 0 0 1 7.5 18v-5A2.5 2.5 0 0 1 10 10.5Z"
        {...stroke}
      />
    </svg>
  )
}

/** Расписание — календарь с полосой дней */
function ScheduleIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
      <rect x="3.5" y="5" width="17" height="15" rx="2.5" {...stroke} />
      <path d="M3.5 9.5h17M8 3.5v3M16 3.5v3" {...stroke} />
      <path d="M8 13h.01M12 13h.01M16 13h.01M8 16.5h.01M12 16.5h.01" {...stroke} strokeWidth={2.25} />
    </svg>
  )
}

/** Обучение — карандаш и линия (как у типового ЛК) */
function StudyIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
      <path d="M4 20h4L19.5 8.5a2.1 2.1 0 0 0 0-3L18.5 4.5a2.1 2.1 0 0 0-3 0L4 16v4Z" {...stroke} />
      <path d="M14 6.5 17.5 10" {...stroke} />
      <path d="M4 20l1.2-4.2" {...stroke} />
    </svg>
  )
}

/** Учебный план — раскрытая книга */
function StudyPlanIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
      <path d="M12 6.5c-1.8-1.4-4.2-2-6.5-2v12.5c2.3 0 4.7.6 6.5 2 1.8-1.4 4.2-2 6.5-2V4.5c-2.3 0-4.7.6-6.5 2Z" {...stroke} />
      <path d="M12 6.5v12.5" {...stroke} />
    </svg>
  )
}

/** Образовательная программа — академическая шапочка */
function ProgramIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
      <path d="M3 10.5 12 5l9 5.5-9 5.5L3 10.5Z" {...stroke} />
      <path d="M7 13v4.2c0 .8 2.2 2.3 5 2.3s5-1.5 5-2.3V13" {...stroke} />
      <path d="M21 10.5v5.5" {...stroke} />
    </svg>
  )
}

/** Сервисы — ключ и отвёртка */
function ServicesIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
      <path
        d="M14.5 5.5a3.2 3.2 0 0 1 4 4l-8.2 8.2-2.8-.9-.9-2.8 8-8.5Z"
        {...stroke}
      />
      <path d="M4.5 8.5 8 5l2 2-1.5 1.5L11 11l-2.5-.5L7 12.5 5 10.5l1.5-1.5L4.5 8.5Z" {...stroke} />
      <path d="M5 19.5 8.5 16" {...stroke} />
    </svg>
  )
}

/** Траектория — сложенная карта с маршрутом */
function RoadmapIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
      <path d="M9 4.5 3.5 6.5v13L9 17.5l6 2 5.5-2v-13L15 6.5 9 4.5Z" {...stroke} />
      <path d="M9 4.5v13M15 6.5v13" {...stroke} />
      <path d="M6.5 11.5c1.2-1.5 2.3-1.5 3.5 0s2.3 1.5 3.5 0 2.3-1.5 3.5 0" {...stroke} />
    </svg>
  )
}

/** Заявления — папка */
function RequestsIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
      <path d="M3.5 7.5V18a2 2 0 0 0 2 2h13a2 2 0 0 0 2-2V9.5a2 2 0 0 0-2-2h-6.2L10.5 5.5H5.5a2 2 0 0 0-2 2Z" {...stroke} />
    </svg>
  )
}

/** Оплата — карта */
function PaymentsIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
      <rect x="2.5" y="5.5" width="19" height="13" rx="2" {...stroke} />
      <path d="M2.5 10h19" {...stroke} />
      <path d="M6.5 14.5h4" {...stroke} />
    </svg>
  )
}

/** Общежитие — здание */
function DormitoryIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
      <path d="M4.5 20.5V6.5L12 3.5l7.5 3v14" {...stroke} />
      <path d="M9 20.5v-5h6v5" {...stroke} />
      <path d="M8 9.5h.01M12 9.5h.01M16 9.5h.01M8 13h.01M12 13h.01M16 13h.01" {...stroke} strokeWidth={2.25} />
    </svg>
  )
}

/** Обходной лист — список */
function BypassListIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
      <path d="M8 6.5h12M8 12h12M8 17.5h12" {...stroke} />
      <path d="M4 6.5h.01M4 12h.01M4 17.5h.01" {...stroke} strokeWidth={2.5} />
    </svg>
  )
}

/** Психолог — открытая ладонь */
function PsychologistIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
      <path
        d="M8 11.5V7.2a1.7 1.7 0 0 1 3.4 0V11M11.4 11V6.5a1.7 1.7 0 0 1 3.4 0V11M14.8 11V7.8a1.7 1.7 0 0 1 3.4 0v6.7c0 3.2-2.6 5-5.7 5H11c-2.8 0-4.5-1.5-5.5-3.2L4 13.5a1.5 1.5 0 0 1 2.4-1.8L8 13.5"
        {...stroke}
      />
    </svg>
  )
}

/** Портфолио — сетка 2×2 */
function PortfolioIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
      <rect x="4" y="4" width="6.5" height="6.5" rx="1.5" {...stroke} />
      <rect x="13.5" y="4" width="6.5" height="6.5" rx="1.5" {...stroke} />
      <rect x="4" y="13.5" width="6.5" height="6.5" rx="1.5" {...stroke} />
      <rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.5" {...stroke} />
    </svg>
  )
}

/** Настройки — шестерёнка */
function SettingsIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
      <circle cx="12" cy="12" r="3" {...stroke} />
      <path
        d="M12 3.5v2.2M12 18.3v2.2M4.9 6.5l1.6 1.6M17.5 15.9l1.6 1.6M3.5 12h2.2M18.3 12h2.2M4.9 17.5l1.6-1.6M17.5 8.1l1.6-1.6"
        {...stroke}
      />
    </svg>
  )
}

/** Фото пропуска — камера */
function PassPhotoIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
      <path d="M4.5 8.5h3l1.5-2h6l1.5 2h3a1.5 1.5 0 0 1 1.5 1.5v8a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 18v-8a1.5 1.5 0 0 1 1.5-1.5Z" {...stroke} />
      <circle cx="12" cy="13.5" r="3.2" {...stroke} />
    </svg>
  )
}

/** Посещаемость — календарь-сетка */
function AttendanceIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
      <rect x="3.5" y="5" width="17" height="15" rx="2" {...stroke} />
      <path d="M3.5 9.5h17M8 3.5v3M16 3.5v3" {...stroke} />
      <path d="M8 13h8M8 16.5h5" {...stroke} />
    </svg>
  )
}

/** Зачётка — документ со строками */
function RecordBookIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
      <path d="M7 3.5h8.5L19.5 7.5V20a1.5 1.5 0 0 1-1.5 1.5H7A1.5 1.5 0 0 1 5.5 20V5A1.5 1.5 0 0 1 7 3.5Z" {...stroke} />
      <path d="M15 3.5V8h4.5M8.5 12h7M8.5 15.5h7M8.5 19h4" {...stroke} />
    </svg>
  )
}

/** Успеваемость — столбчатая диаграмма */
function GradesIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
      <path d="M4 20h16" {...stroke} />
      <path d="M7 20V12M12 20V7M17 20v-5" {...stroke} />
    </svg>
  )
}

/** Задолженности — коробка с крестиком */
function DebtsIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
      <rect x="4" y="4" width="16" height="16" rx="2.5" {...stroke} />
      <path d="M9 9l6 6M15 9l-6 6" {...stroke} />
    </svg>
  )
}

/** Читательский билет — книга */
function LibraryIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
      <path d="M5 5.5A2 2 0 0 1 7 3.5h11.5v15H7a2 2 0 0 0-2 2V5.5Z" {...stroke} />
      <path d="M7 18.5a2 2 0 0 1 2-2h9.5" {...stroke} />
    </svg>
  )
}

/** Преподаватели — портфель */
function TeachersIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
      <rect x="3.5" y="8" width="17" height="12" rx="2" {...stroke} />
      <path d="M9 8V6.5A1.5 1.5 0 0 1 10.5 5h3A1.5 1.5 0 0 1 15 6.5V8M3.5 13h17" {...stroke} />
    </svg>
  )
}

/** Приказы — лист с загнутым углом */
function OrdersIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
      <path d="M6.5 3.5h8L18.5 7.5V20a1.5 1.5 0 0 1-1.5 1.5h-10A1.5 1.5 0 0 1 5.5 20V5A1.5 1.5 0 0 1 7 3.5Z" {...stroke} />
      <path d="M14 3.5V8h4.5M8.5 12.5h7M8.5 16h5" {...stroke} />
    </svg>
  )
}

const icons: Record<NavIconId, (props: IconProps) => ReactElement> = {
  profile: ProfileIcon,
  news: NewsIcon,
  schedule: ScheduleIcon,
  study: StudyIcon,
  studyPlan: StudyPlanIcon,
  program: ProgramIcon,
  services: ServicesIcon,
  roadmap: RoadmapIcon,
  requests: RequestsIcon,
  payments: PaymentsIcon,
  dormitory: DormitoryIcon,
  bypassList: BypassListIcon,
  psychologist: PsychologistIcon,
  portfolio: PortfolioIcon,
  settings: SettingsIcon,
  passPhoto: PassPhotoIcon,
  attendance: AttendanceIcon,
  recordBook: RecordBookIcon,
  grades: GradesIcon,
  debts: DebtsIcon,
  library: LibraryIcon,
  teachers: TeachersIcon,
  orders: OrdersIcon,
}

type NavIconProps = IconProps & {
  id: NavIconId
}

export function NavIcon({ id, className }: NavIconProps) {
  const Icon = icons[id]
  return <Icon className={className} />
}
