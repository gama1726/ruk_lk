/**
 * @file Клиентская авторизация.
 * Зачётка + пароль → код на почту из 1С → сессия (cookie backend).
 */

import { create } from 'zustand'
import { ApiError, apiGet, apiPost, apiRequest, isApiConfigured } from '@/apiClient'

/** Ответ `GET /api/auth/me` и `POST /api/auth/verify-code` */
export type MeResponseDto = {
  studentId: string
  fullName: string
  email: string
  programs: {
    id: string
    studentId: string
    level: string
    direction: string
    group: string
  }[]
}

/** Ответ `POST /api/auth/login` — до ввода кода */
export type LoginChallengeDto = {
  studentId: string
  email: string
  fullName: string
}

/** Установленная сессия после подтверждения кода */
export type Session = {
  studentId: string
  name: string
  email?: string
}

/** Ошибка поля на форме входа */
export type FieldError = {
  field: 'login' | 'password'
  message: string
}

type AuthState = {
  session: Session | null
  pendingEmail: string | null
  status: 'loading' | 'ready'
  restoreSession: () => Promise<void>
  startStudentLogin: (studentId: string, password: string) => Promise<FieldError | null>
  signIn: (email: string, password: string) => FieldError | null
  completeSso: (email: string, password: string) => FieldError | null
  confirmCode: (code: string) => Promise<string | null>
  signOut: () => Promise<void>
}

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function toSession(me: MeResponseDto): Session {
  return {
    studentId: me.studentId,
    name: me.fullName.trim() || me.studentId,
    email: me.email || undefined,
  }
}

/**
 * Хук доступа к сессии и методам входа/выхода.
 * @remarks Токены не кладём в `localStorage` / `sessionStorage`.
 */
export const useAuth = create<AuthState>((set) => ({
  session: null,
  pendingEmail: null,
  status: isApiConfigured() ? 'loading' : 'ready',

  async restoreSession() {
    if (!isApiConfigured()) {
      set({ status: 'ready' })
      return
    }

    set({ status: 'loading' })

    try {
      const me = await apiGet<MeResponseDto>('/api/auth/me')
      set({ session: toSession(me), pendingEmail: null, status: 'ready' })
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        try {
          const pending = await apiGet<LoginChallengeDto>('/api/auth/pending-challenge')
          set({ session: null, pendingEmail: pending.email, status: 'ready' })
          return
        } catch {
          set({ session: null, pendingEmail: null, status: 'ready' })
          return
        }
      }
      set({ session: null, pendingEmail: null, status: 'ready' })
    }
  },

  async startStudentLogin(studentId, password) {
    const trimmed = studentId.trim()

    if (!trimmed) return { field: 'login', message: 'Укажите номер зачётки' }
    if (!password) return { field: 'password', message: 'Укажите пароль' }

    if (!isApiConfigured()) {
      set({ pendingEmail: `${trimmed}@student.ruc.local` })
      return null
    }

    try {
      const challenge = await apiPost<LoginChallengeDto>('/api/auth/login', {
        studentId: trimmed,
        password,
      })
      set({
        pendingEmail: challenge.email,
        session: null,
      })
      return null
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        return { field: 'password', message: 'Неверный номер зачётки или пароль' }
      }
      const message = error instanceof Error ? error.message : 'Не удалось войти'
      return { field: 'login', message }
    }
  },

  signIn(email, password) {
    const trimmed = email.trim()

    if (!trimmed) return { field: 'login', message: 'Укажите почту' }
    if (!emailPattern.test(trimmed)) return { field: 'login', message: 'Похоже, почта указана с ошибкой' }
    if (!password) return { field: 'password', message: 'Укажите пароль' }
    if (password.length < 4) return { field: 'password', message: 'Пароль слишком короткий' }

    set({ pendingEmail: trimmed })
    return null
  },

  completeSso(email, password) {
    const trimmed = email.trim()

    if (!trimmed) return { field: 'login', message: 'Укажите почту' }
    if (!emailPattern.test(trimmed)) return { field: 'login', message: 'Похоже, почта указана с ошибкой' }
    if (!password) return { field: 'password', message: 'Укажите пароль' }
    if (password.length < 4) return { field: 'password', message: 'Пароль слишком короткий' }

    set({
      session: {
        studentId: '23И0142',
        email: trimmed,
        name: 'Иванов Артём Сергеевич',
      },
      pendingEmail: null,
    })

    return null
  },

  async confirmCode(code) {
    const digits = code.replace(/\s/g, '')

    if (!/^\d{6}$/.test(digits)) return 'Нужен код из 6 цифр'

    if (isApiConfigured()) {
      try {
        const me = await apiPost<MeResponseDto>('/api/auth/verify-code', { code: digits })
        set({
          session: toSession(me),
          pendingEmail: null,
        })
        return null
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          return error.message || 'Неверный код подтверждения'
        }
        return error instanceof Error ? error.message : 'Не удалось подтвердить код'
      }
    }

    set((state) => ({
      session: {
        studentId: '23И0142',
        email: state.pendingEmail ?? 'ivanov.as@student.ruc.local',
        name: 'Иванов Артём Сергеевич',
      },
      pendingEmail: null,
    }))

    return null
  },

  async signOut() {
    if (isApiConfigured()) {
      try {
        await apiRequest('/api/auth/logout', { method: 'POST' })
      } catch {
        // локально всё равно сбрасываем сессию
      }
    }

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
