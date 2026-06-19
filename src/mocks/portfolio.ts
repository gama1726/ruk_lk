/**
 * @file Портфолио достижений и хранилище в сессии.
 */

import { create } from 'zustand'
import type { Achievement, AchievementTypeId } from './portfolio-types'
import { achievementTypes } from './portfolio-types'

const seed: Achievement[] = [
  {
    id: 'pf-07',
    typeId: 'project',
    typeLabel: 'Проект / хакатон',
    title: 'Хакатон «Цифровая кооперация»',
    date: '2026-05-20',
    documentName: 'certificate-hackathon.pdf',
    status: 'moderation',
  },
  {
    id: 'pf-04',
    typeId: 'volunteer',
    typeLabel: 'Волонтёрство',
    title: 'День открытых дверей РУК',
    date: '2025-11-10',
    status: 'approved',
  },
  {
    id: 'pf-02',
    typeId: 'conference',
    typeLabel: 'Конференция / доклад',
    title: 'Студенческая научная конференция',
    date: '2025-04-18',
    documentName: 'conference-report.pdf',
    status: 'approved',
  },
]

type NewAchievement = {
  typeId: AchievementTypeId
  title: string
  date: string
}

type PortfolioStore = {
  items: Achievement[]
  /** @param data - поля нового достижения */
  add: (data: NewAchievement) => string
}

/**
 * Достижения в памяти сессии.
 */
export const usePortfolio = create<PortfolioStore>((set) => ({
  items: [...seed],

  add(data) {
    const typeLabel = achievementTypes.find((t) => t.id === data.typeId)?.label ?? data.typeId
    const id = `pf-${Date.now()}`
    const item: Achievement = {
      id,
      typeId: data.typeId,
      typeLabel,
      title: data.title.trim(),
      date: data.date,
      status: 'moderation',
    }
    set((s) => ({ items: [item, ...s.items] }))
    return id
  },
}))

/**
 * @param iso - `YYYY-MM-DD`
 */
export function formatAchievementDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  return new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }).format(
    new Date(y, m - 1, d),
  )
}
