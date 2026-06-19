/**
 * @file Мок заявлений и хранилище в сессии.
 */

import { create } from 'zustand'
import type { RequestItem, RequestTypeId } from './requests-types'
import { requestTypes } from './requests-types'

const seed: RequestItem[] = [
  {
    id: 'req-1042',
    typeId: 'study-place',
    typeLabel: 'Справка с места учёбы',
    createdAt: '2026-06-10',
    status: 'ready',
    comment: 'Для работодателя',
    delivery: 'Лично в деканате',
  },
  {
    id: 'req-1058',
    typeId: 'study-period',
    typeLabel: 'Справка о периоде обучения',
    createdAt: '2026-06-14',
    status: 'processing',
    comment: 'Нужна с печатью',
    delivery: 'Электронная копия',
  },
  {
    id: 'req-1011',
    typeId: 'dean',
    typeLabel: 'Заявление в деканат',
    createdAt: '2026-05-20',
    status: 'archived',
    comment: 'Перенос сессии',
    delivery: 'Лично в деканате',
  },
]

type NewRequest = {
  typeId: RequestTypeId
  comment: string
  delivery: string
}

type RequestStore = {
  items: RequestItem[]
  /**
   * @param data - поля новой заявки
   * @returns id созданной записи
   */
  add: (data: NewRequest) => string
}

/**
 * Заявления в памяти сессии. После F5 — снова seed.
 */
export const useRequests = create<RequestStore>((set) => ({
  items: [...seed],

  add(data) {
    const typeLabel = requestTypes.find((t) => t.id === data.typeId)?.label ?? data.typeId
    const id = `req-${Date.now()}`
    const item: RequestItem = {
      id,
      typeId: data.typeId,
      typeLabel,
      createdAt: new Date().toISOString().slice(0, 10),
      status: 'sent',
      comment: data.comment,
      delivery: data.delivery,
    }
    set((s) => ({ items: [item, ...s.items] }))
    return id
  },
}))

/**
 * @param iso - `YYYY-MM-DD`
 */
export function formatRequestDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  return new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }).format(
    new Date(y, m - 1, d),
  )
}
