/**
 * @file Состояние прочитанности уведомлений в сессии.
 * @remarks Не синхронизируется с сервером — только для mock UI.
 */

import { create } from 'zustand'
import { notices } from '@/mocks/notices'

type ReadState = {
  /** Переопределения поверх начального `read` из мока */
  overrides: Record<string, boolean>
  /**
   * Прочитано ли уведомление.
   * @param id - id уведомления
   */
  isRead: (id: string) => boolean
  /**
   * Пометить прочитанным / снять пометку.
   * @param id - id уведомления
   * @param read - новый статус
   */
  setRead: (id: string, read: boolean) => void
}

const initial: Record<string, boolean> = Object.fromEntries(notices.map((n) => [n.id, n.read]))

export const useReadState = create<ReadState>((set, get) => ({
  overrides: { ...initial },

  isRead(id) {
    return get().overrides[id] ?? true
  },

  setRead(id, read) {
    set((s) => ({ overrides: { ...s.overrides, [id]: read } }))
  },
}))

/**
 * Сколько непрочитанных с учётом локальных изменений.
 */
export function useUnreadCount(): number {
  const overrides = useReadState((s) => s.overrides)
  return notices.filter((n) => !overrides[n.id]).length
}
