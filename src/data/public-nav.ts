/**
 * @file Публичная навигация (реальные и внутренние ссылки).
 */

import { moodleEostudUrl } from '@/data/resources'
import { paths } from '@/paths'

export type PublicNavItem = {
  label: string
  /** Внутренний маршрут */
  to?: string
  /** Внешняя ссылка */
  href?: string
}

/** Верхнее меню как на портале */
export const publicNav: PublicNavItem[] = [
  { to: paths.resources, label: 'Ресурсы' },
  { href: moodleEostudUrl, label: 'Дистанционное обучение' },
  { to: paths.support, label: 'Техническая поддержка (dev)' },
  { to: paths.support, label: 'Обращение в приёмную (dev)' },
]
