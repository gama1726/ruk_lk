/**
 * @file Иконки пунктов сайдбара — Lucide (единый outline-стиль).
 * @see https://lucide.dev
 */

import type { LucideIcon } from 'lucide-react'
import {
  BarChart3,
  Book,
  BookOpen,
  Briefcase,
  Building2,
  CalendarCheck,
  CalendarDays,
  Camera,
  CreditCard,
  File,
  FileText,
  Folder,
  GraduationCap,
  Hand,
  LayoutGrid,
  List,
  Map,
  MessagesSquare,
  PackageX,
  PenLine,
  Settings,
  UserCircle,
  Wrench,
} from 'lucide-react'

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

const icons: Record<NavIconId, LucideIcon> = {
  profile: UserCircle,
  news: MessagesSquare,
  schedule: CalendarDays,
  study: PenLine,
  studyPlan: BookOpen,
  program: GraduationCap,
  services: Wrench,
  roadmap: Map,
  requests: Folder,
  payments: CreditCard,
  dormitory: Building2,
  bypassList: List,
  psychologist: Hand,
  portfolio: LayoutGrid,
  settings: Settings,
  passPhoto: Camera,
  attendance: CalendarCheck,
  recordBook: FileText,
  grades: BarChart3,
  debts: PackageX,
  library: Book,
  teachers: Briefcase,
  orders: File,
}

type NavIconProps = {
  id: NavIconId
  className?: string
}

export function NavIcon({ id, className }: NavIconProps) {
  const Icon = icons[id]
  return <Icon className={className} size={20} strokeWidth={1.75} aria-hidden />
}
