/**
 * @file Клиентская авторизация (mock).
 * Пароль не сохраняем. Сессия только в памяти — задел под httpOnly-cookie / SSO.
 */

import { create } from 'zustand'

/** Установленная сессия после подтверждения кода */
type Session = {
  email: string
  name: string
}

/** Ошибка поля на форме входа */
type FieldError = {
  field: 'login' | 'password'
  message: string
}

type AuthState = {
  /** `null`, если пользователь не вошёл */
  session: Session | null
  /** Почта между шагом входа и вводом кода; пароль сюда не попадает */
  pendingEmail: string | null
  /**
   * Первый шаг входа: проверяем поля и запоминаем почту.
   * @param email - корпоративная почта или логин
   * @param password - проверяется и отбрасывается, в стор не пишется
   * @returns ошибку поля или `null`, если можно переходить к коду
   */
  signIn: (email: string, password: string) => FieldError | null
  /**
   * Второй шаг: подтверждение кода из письма.
   * @param code - шесть цифр
   * @returns текст ошибки или `null` при успехе
   */
  confirmCode: (code: string) => string | null
  /** Сбрасывает сессию и незавершённый вход */
  signOut: () => void
}

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * Хук доступа к сессии и методам входа/выхода.
 * @remarks Не кладём токены в `localStorage` / `sessionStorage`.
 */
export const useAuth = create<AuthState>((set) => ({
  session: null,
  pendingEmail: null,

  signIn(email, password) {
    const trimmed = email.trim()

    if (!trimmed) return { field: 'login', message: 'Укажите почту' }
    if (!emailPattern.test(trimmed)) return { field: 'login', message: 'Похоже, почта указана с ошибкой' }
    if (!password) return { field: 'password', message: 'Укажите пароль' }
    if (password.length < 4) return { field: 'password', message: 'Пароль слишком короткий' }

    set({ pendingEmail: trimmed })
    return null
  },

  confirmCode(code) {
    const digits = code.replace(/\s/g, '')

    if (!/^\d{6}$/.test(digits)) return 'Нужен код из 6 цифр'

    set((state) => ({
      session: {
        email: state.pendingEmail ?? 'ivanov.as@student.ruc.local',
        name: 'Иванов Артём Сергеевич',
      },
      pendingEmail: null,
    }))

    return null
  },

  signOut() {
    set({ session: null, pendingEmail: null })
  },
}))

/**
 * Маскирует локальную часть email на экране ввода кода.
 * @param email - полный адрес
 * @returns строка вида `i***v.as@student.ruc.local`
 */
export function maskEmail(email: string): string {
  const [local, domain] = email.split('@')
  if (!local || !domain) return email
  if (local.length <= 2) return `${local[0]}***@${domain}`
  return `${local[0]}***${local.slice(-2)}@${domain}`
}
