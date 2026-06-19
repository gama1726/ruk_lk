/**
 * @file Типы достижений портфолио.
 */

export type PortfolioStatus = 'draft' | 'moderation' | 'approved' | 'rejected'

export type AchievementTypeId = 'olympiad' | 'conference' | 'volunteer' | 'sport' | 'project'

export type Achievement = {
  id: string
  typeId: AchievementTypeId
  typeLabel: string
  title: string
  date: string
  documentName?: string
  status: PortfolioStatus
}

export const portfolioStatusLabel: Record<PortfolioStatus, string> = {
  draft: 'черновик',
  moderation: 'на модерации',
  approved: 'принято',
  rejected: 'отклонено',
}

export const achievementTypes: { id: AchievementTypeId; label: string }[] = [
  { id: 'olympiad', label: 'Олимпиада / конкурс' },
  { id: 'conference', label: 'Конференция / доклад' },
  { id: 'volunteer', label: 'Волонтёрство' },
  { id: 'sport', label: 'Спорт' },
  { id: 'project', label: 'Проект / хакатон' },
]
