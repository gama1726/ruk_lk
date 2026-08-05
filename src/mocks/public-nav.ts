/**
 * @file Моки соцсетей на экране входа (пока заглушки URL).
 */

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
