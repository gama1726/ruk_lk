/**
 * @file Клиентская авторизация.
 * При заданном `VITE_API_BASE_URL` — сессия через cookie backend; иначе mock в памяти.
 */

import { create } from 'zustand'
import { ApiError, apiGet, apiPost, apiRequest, isApiConfigured } from '@/apiClient'

/** Ответ `GET /api/auth/me` и `POST /api/auth/login` */
export type MeResponseDto = {
  studentId: string
  fullName: string
  programs: {
    id: string
    studentId: string
    level: string
    direction: string
    group: string
  }[]
}

/** Установленная сессия после входа */
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
  loginWithStudentId: (studentId: string, password: string) => Promise<FieldError | null>
  signIn: (email: string, password: string) => FieldError | null
  completeSso: (email: string, password: string) => FieldError | null
  confirmCode: (code: string) => string | null
  signOut: () => Promise<void>
}

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function toSession(me: MeResponseDto): Session {
  return {
    studentId: me.studentId,
    name: me.fullName.trim() || me.studentId,
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
      set({ session: toSession(me), status: 'ready' })
    } catch (error) {
      if (!(error instanceof ApiError) || error.status === 401) {
        set({ session: null, status: 'ready' })
        return
      }
      set({ session: null, status: 'ready' })
    }
  },

  async loginWithStudentId(studentId, password) {
    const trimmed = studentId.trim()

    if (!trimmed) return { field: 'login', message: 'Укажите номер зачётки' }
    if (!password) return { field: 'password', message: 'Укажите пароль' }

    if (!isApiConfigured()) {
      return { field: 'login', message: 'API не настроен: укажите VITE_API_BASE_URL в .env' }
    }

    try {
      const me = await apiPost<MeResponseDto>('/api/auth/login', {
        studentId: trimmed,
        password,
      })
      set({ session: toSession(me), pendingEmail: null })
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

  confirmCode(code) {
    const digits = code.replace(/\s/g, '')

    if (!/^\d{6}$/.test(digits)) return 'Нужен код из 6 цифр'

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
