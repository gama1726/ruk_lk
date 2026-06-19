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
  { to: paths.resources, label: 'Ресурсы' },
  { to: paths.resources, label: 'Дистанционное обучение' },
  { to: paths.support, label: 'Техническая поддержка' },
  { to: paths.support, label: 'Обращение в приёмную' },
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
