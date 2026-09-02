/**
 * @file Иконки ролей родителя для экрана входа.
 */

type IconProps = {
  className?: string
}

export function FatherRoleIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <circle cx="32" cy="22" r="12" stroke="currentColor" strokeWidth="2.5" />
      <path
        d="M14 58c2.5-12 10-18 18-18s15.5 6 18 18"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path
        d="M22 30c-2-3-1-7 2-9M42 30c2-3 1-7-2-9"
        stroke="#9ca3af"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path d="M24 27c3 2 13 2 16 0" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M26 29.5c2.5 1.5 9.5 1.5 12 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

export function MotherRoleIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <circle cx="32" cy="22" r="12" stroke="currentColor" strokeWidth="2.5" />
      <path
        d="M14 58c2.5-12 10-18 18-18s15.5 6 18 18"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path d="M20 14c4-4 20-4 24 0" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M18 18c6-2 22-2 28 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

export function GuardianRoleIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <circle cx="32" cy="22" r="12" stroke="currentColor" strokeWidth="2.5" />
      <path
        d="M14 58c2.5-12 10-18 18-18s15.5 6 18 18"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function roleIcon(kind: string) {
  if (kind === 'father') return FatherRoleIcon
  if (kind === 'mother') return MotherRoleIcon
  return GuardianRoleIcon
}

export function roleTitle(kind: string) {
  if (kind === 'father') return 'Отец'
  if (kind === 'mother') return 'Мать'
  return 'Законный представитель'
}
