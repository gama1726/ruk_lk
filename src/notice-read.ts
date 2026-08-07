/**
 * @file Состояние прочитанности новостей в сессии браузера.
 */

import { create } from 'zustand'

type ReadState = {
  overrides: Record<string, boolean>
  isRead: (id: string) => boolean
  setRead: (id: string, read: boolean) => void
}

export const useReadState = create<ReadState>((set, get) => ({
  overrides: {},

  isRead(id) {
    return get().overrides[id] ?? false
  },

  setRead(id, read) {
    set((s) => ({ overrides: { ...s.overrides, [id]: read } }))
  },
}))

/**
 * Сколько непрочитанных среди переданных id.
 */
export function countUnread(ids: string[], overrides: Record<string, boolean>): number {
  return ids.filter((id) => !(overrides[id] ?? false)).length
}
