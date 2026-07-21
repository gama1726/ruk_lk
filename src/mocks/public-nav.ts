/**
 * @file Публичная навигация и соцсети на экране входа.
 */

import { paths } from '@/paths'

export type PublicNavItem = {
  to: string
  label: string
}

/** Верхнее меню как на портале */
export const publicNav: PublicNavItem[] = [
  { to: paths.resources, label: 'Ресурсы (dev)' },
  { to: paths.resources, label: 'Дистанционное обучение (dev)' },
  { to: paths.support, label: 'Техническая поддержка (dev)' },
  { to: paths.support, label: 'Обращение в приёмную (dev)' },
]

export type SocialLink = {
  id: string
  label: string
  url: string
}

export const socialLinks: SocialLink[] = [
  { id: 'vk', label: 'VK', url: 'https://vk.com' },
  { id: 'tg', label: 'Telegram', url: 'https://t.me' },
  { id: 'yt', label: 'YouTube', url: 'https://youtube.com' },
]
