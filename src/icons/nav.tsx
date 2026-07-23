/**
 * @file Иконки пунктов сайдбара (outline, currentColor).
 * Смысл как у типичного ЛК, визуально отличный от МИРЭА.
 */

import type { ReactElement } from 'react'

export type NavIconId = 'profile' | 'news' | 'schedule' | 'study' | 'program' | 'services'

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

/** Новости — колокольчик с точкой (не диалоги) */
function NewsIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
      <path d="M6 10a6 6 0 0 1 12 0c0 4.5 1.5 5.5 1.5 5.5H4.5S6 14.5 6 10Z" {...stroke} />
      <path d="M10 18.5a2 2 0 0 0 4 0" {...stroke} />
      <circle cx="17.5" cy="6.5" r="2" fill="currentColor" stroke="none" />
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

/** Обучение — раскрытая книга (не карандаш) */
function StudyIcon({ className }: IconProps) {
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

/** Сервисы — сетка приложений (не ключ/отвёртка) */
function ServicesIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
      <rect x="4" y="4" width="6.5" height="6.5" rx="1.5" {...stroke} />
      <rect x="13.5" y="4" width="6.5" height="6.5" rx="1.5" {...stroke} />
      <rect x="4" y="13.5" width="6.5" height="6.5" rx="1.5" {...stroke} />
      <rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.5" {...stroke} />
    </svg>
  )
}

const icons: Record<NavIconId, (props: IconProps) => ReactElement> = {
  profile: ProfileIcon,
  news: NewsIcon,
  schedule: ScheduleIcon,
  study: StudyIcon,
  program: ProgramIcon,
  services: ServicesIcon,
}

type NavIconProps = IconProps & {
  id: NavIconId
}

export function NavIcon({ id, className }: NavIconProps) {
  const Icon = icons[id]
  return <Icon className={className} />
}
