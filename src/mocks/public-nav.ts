/**
 * @file Официальные соцсети университета в подвале входа и кабинетов.
 */

export type SocialLink = {
  id: string
  label: string
  url: string
}

export const socialLinks: SocialLink[] = [
  { id: 'vk', label: 'VK', url: 'https://vk.ru/ru.coop' },
  { id: 'max', label: 'MAX', url: 'https://max.ru/id5029088494_biz' },
  { id: 'rutube', label: 'RuTube', url: 'https://rutube.ru/channel/72667420/' },
]
