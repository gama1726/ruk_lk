/**
 * @file Иконки ролей родителя для экрана входа — Lucide.
 * @see https://lucide.dev
 */

import type { LucideIcon } from 'lucide-react'
import { UserRound, Users } from 'lucide-react'

type IconProps = {
  className?: string
}

function RoleIcon({ Icon, className }: IconProps & { Icon: LucideIcon }) {
  return <Icon className={className} size={56} strokeWidth={1.75} aria-hidden />
}

export function FatherRoleIcon({ className }: IconProps) {
  return <RoleIcon Icon={UserRound} className={className} />
}

export function MotherRoleIcon({ className }: IconProps) {
  return <RoleIcon Icon={UserRound} className={className} />
}

export function GuardianRoleIcon({ className }: IconProps) {
  return <RoleIcon Icon={Users} className={className} />
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
