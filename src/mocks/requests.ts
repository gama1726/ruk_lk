/**
 * @file Мок заявлений и хранилище в сессии.
 * @remarks Студент: Мишичкин Г.Д. После F5 — снова seed.
 */

import { create } from 'zustand'
import type { RequestItem, RequestTypeId } from './requests-types'
import { requestTypes } from './requests-types'

const seed: RequestItem[] = [
  {
    id: 'req-1187',
    typeId: 'study-place',
    typeLabel: 'Справка с места учёбы',
    createdAt: '2026-05-28',
    status: 'ready',
    comment: 'Для оформления пропуска на практику в ООО «Кооператив-Цифра»',
    delivery: 'Лично в деканате',
  },
  {
    id: 'req-1172',
    typeId: 'study-period',
    typeLabel: 'Справка о периоде обучения',
    createdAt: '2026-05-20',
    status: 'processing',
    comment: 'Нужна с гербовой печатью, срок — до 1 июня',
    delivery: 'Электронная копия',
  },
  {
    id: 'req-1154',
    typeId: 'dean',
    typeLabel: 'Заявление в деканат',
    createdAt: '2026-05-12',
    status: 'sent',
    comment: 'Прошу разрешить сдачу задолженности по дисциплине «Право» в дополнительную сессию',
    delivery: 'Лично в деканате',
  },
  {
    id: 'req-1120',
    typeId: 'academic-leave',
    typeLabel: 'Заявление на академический отпуск',
    createdAt: '2026-04-03',
    status: 'rejected',
    comment: 'По семейным обстоятельствам. Отказано: недостаточно документов',
    delivery: 'Лично в деканате',
  },
  {
    id: 'req-1098',
    typeId: 'dean',
    typeLabel: 'Заявление в деканат',
    createdAt: '2026-03-18',
    status: 'archived',
    comment: 'Перенос консультации по «Web-технологиям» на 25 марта',
    delivery: 'Электронная копия',
  },
  {
    id: 'req-1042',
    typeId: 'study-place',
    typeLabel: 'Справка с места учёбы',
    createdAt: '2026-02-10',
    status: 'archived',
    comment: 'Для оформления социальной карты студента',
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
