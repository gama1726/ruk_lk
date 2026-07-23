/**
 * @file Настройки профиля в памяти сессии.
 * @remarks Контакты и уведомления — mock UI до подключения backend.
 * @see {@link student} — начальные значения из мока
 */

import { create } from 'zustand'
import { student } from '@/mocks/student'

/** Ключи переключателей уведомлений */
export type NotificationKey = 'deanery' | 'grades' | 'payments' | 'system'

export type NotificationPrefs = Record<NotificationKey, boolean>

export const notificationLabels: Record<NotificationKey, string> = {
  deanery: 'Сообщения деканата',
  grades: 'Оценки и зачёты',
  payments: 'Оплата обучения',
  system: 'Системные уведомления',
}

type SettingsState = {
  personalEmail: string
  phone: string
  notifications: NotificationPrefs
  /**
   * @param email - новая личная почта
   * @returns текст ошибки или `null` при успехе
   */
  setPersonalEmail: (email: string) => string | null
  /**
   * @param phone - номер в произвольном формате
   * @returns текст ошибки или `null` при успехе
   */
  setPhone: (phone: string) => string | null
  /**
   * @param key - раздел уведомлений
   * @param enabled - включено или нет
   */
  setNotification: (key: NotificationKey, enabled: boolean) => void
  /**
   * Mock-смена пароля: проверка полей без сохранения.
   * @param current - текущий пароль (не логируем)
   * @param next - новый пароль
   * @param confirm - повтор нового пароля
   * @returns текст ошибки или `null` при успехе
   */
  changePassword: (current: string, next: string, confirm: string) => string | null
}

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * Стор настроек аккаунта.
 * @remarks После F5 значения снова из {@link student}.
 */
export const useSettings = create<SettingsState>((set) => ({
  personalEmail: student.personalEmail,
  phone: student.phone,
  notifications: {
    deanery: true,
    grades: true,
    payments: true,
    system: false,
  },

  setPersonalEmail(email) {
    const trimmed = email.trim()
    if (!trimmed) return 'Укажите почту'
    if (!emailPattern.test(trimmed)) return 'Похоже, почта указана с ошибкой'
    set({ personalEmail: trimmed })
    return null
  },

  setPhone(phone) {
    const digits = phone.replace(/\D/g, '')
    if (digits.length < 10) return 'Укажите корректный номер'
    set({ phone })
    return null
  },

  setNotification(key, enabled) {
    set((s) => ({ notifications: { ...s.notifications, [key]: enabled } }))
  },

  changePassword(current, next, confirm) {
    if (!current) return 'Введите текущий пароль'
    if (current.length < 4) return 'Текущий пароль указан неверно'
    if (!next || next.length < 6) return 'Новый пароль — не короче 6 символов'
    if (next !== confirm) return 'Пароли не совпадают'
    return null
  },
}))
