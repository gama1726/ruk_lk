/**
 * @file Клиентская авторизация.
 * Зачётка → канал доставки → код → сессия (cookie backend).
 */

import { create } from 'zustand'
import { ApiError, apiGet, apiPost, apiRequest, isApiConfigured } from '@/apiClient'
import { maskPhone } from '@/mocks/format'
import { useRecordBook } from '@/record-book-store'
import { useSchedule } from '@/schedule-store'
import { useStudentProfile } from '@/student-profile-store'

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

export type LoginCodeChannel = 'EMAIL' | 'MAX'

/** Ответ `POST /api/auth/identify` */
export type IdentifyResponseDto = {
  studentId: string
  maskedEmail: string
  maskedPhone: string
  emailAvailable: boolean
  maxAvailable: boolean
}

/** Ответ `POST /api/auth/send-code` — до ввода кода */
export type LoginChallengeDto = {
  studentId: string
  email: string
  channel: LoginCodeChannel
  deliveryHint: string
}

export type AuthChannelsDto = {
  maxEnabled: boolean
}

export type PendingIdentification = {
  studentId: string
  maskedEmail: string
  maskedPhone: string
  emailAvailable: boolean
  maxAvailable: boolean
}

export type PendingLogin = {
  email: string
  channel: LoginCodeChannel
  deliveryHint: string
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
  pendingIdentification: PendingIdentification | null
  pendingLogin: PendingLogin | null
  status: 'loading' | 'ready'
  restoreSession: () => Promise<void>
  fetchLoginChannels: () => Promise<AuthChannelsDto>
  identifyStudent: (studentId: string) => Promise<FieldError | null>
  sendLoginCode: (channel: LoginCodeChannel) => Promise<string | null>
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

function toPendingIdentification(data: IdentifyResponseDto): PendingIdentification {
  return {
    studentId: data.studentId,
    maskedEmail: data.maskedEmail,
    maskedPhone: data.maskedPhone,
    emailAvailable: data.emailAvailable,
    maxAvailable: data.maxAvailable,
  }
}

/**
 * Хук доступа к сессии и методам входа/выхода.
 * @remarks Токены не кладём в `localStorage` / `sessionStorage`.
 */
export const useAuth = create<AuthState>((set) => ({
  session: null,
  pendingIdentification: null,
  pendingLogin: null,
  status: isApiConfigured() ? 'loading' : 'ready',

  async restoreSession() {
    if (!isApiConfigured()) {
      set({ status: 'ready' })
      return
    }

    set({ status: 'loading' })

    try {
      const me = await apiGet<MeResponseDto>('/api/auth/me')
      set({ session: toSession(me), pendingIdentification: null, pendingLogin: null })
      await useStudentProfile.getState().load()
      set({ status: 'ready' })
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        try {
          const pending = await apiGet<LoginChallengeDto>('/api/auth/pending-challenge')
          set({
            session: null,
            pendingIdentification: null,
            pendingLogin: {
              email: pending.email,
              channel: pending.channel ?? 'EMAIL',
              deliveryHint: pending.deliveryHint ?? pending.email,
            },
            status: 'ready',
          })
          return
        } catch {
          // нет активного challenge
        }

        try {
          const identified = await apiGet<IdentifyResponseDto>('/api/auth/pending-identification')
          set({
            session: null,
            pendingLogin: null,
            pendingIdentification: toPendingIdentification(identified),
            status: 'ready',
          })
          return
        } catch {
          set({ session: null, pendingIdentification: null, pendingLogin: null, status: 'ready' })
          return
        }
      }
      set({ session: null, pendingIdentification: null, pendingLogin: null, status: 'ready' })
    }
  },

  async fetchLoginChannels() {
    if (!isApiConfigured()) {
      return { maxEnabled: false }
    }
    return apiGet<AuthChannelsDto>('/api/auth/channels')
  },

  async identifyStudent(studentId) {
    const trimmed = studentId.trim()

    if (!trimmed) return { field: 'login', message: 'Укажите номер зачётки' }

    if (!isApiConfigured()) {
      set({
        pendingIdentification: {
          studentId: trimmed,
          maskedEmail: maskEmail(`${trimmed}@student.ruc.local`),
          maskedPhone: maskPhone('+79161234567'),
          emailAvailable: true,
          maxAvailable: true,
        },
        pendingLogin: null,
        session: null,
      })
      return null
    }

    try {
      const identified = await apiPost<IdentifyResponseDto>('/api/auth/identify', {
        studentId: trimmed,
      })
      set({
        pendingIdentification: toPendingIdentification(identified),
        pendingLogin: null,
        session: null,
      })
      return null
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        return { field: 'login', message: 'Студент с таким номером зачётки не найден' }
      }
      const message = error instanceof Error ? error.message : 'Не удалось проверить зачётку'
      return { field: 'login', message }
    }
  },

  async sendLoginCode(channel) {
    if (!isApiConfigured()) {
      set((state) => ({
        pendingLogin: {
          email: `${state.pendingIdentification?.studentId ?? '23И0142'}@student.ruc.local`,
          channel,
          deliveryHint:
            channel === 'MAX'
              ? (state.pendingIdentification?.maskedPhone ?? 'MAX')
              : (state.pendingIdentification?.maskedEmail ?? 'email'),
        },
        pendingIdentification: null,
      }))
      return null
    }

    try {
      const challenge = await apiPost<LoginChallengeDto>('/api/auth/send-code', { channel })
      set({
        pendingLogin: {
          email: challenge.email,
          channel: challenge.channel ?? 'EMAIL',
          deliveryHint: challenge.deliveryHint,
        },
        pendingIdentification: null,
      })
      return null
    } catch (error) {
      if (error instanceof ApiError) {
        return error.message || 'Не удалось отправить код'
      }
      return error instanceof Error ? error.message : 'Не удалось отправить код'
    }
  },

  signIn(email, password) {
    const trimmed = email.trim()

    if (!trimmed) return { field: 'login', message: 'Укажите почту' }
    if (!emailPattern.test(trimmed)) return { field: 'login', message: 'Похоже, почта указана с ошибкой' }
    if (!password) return { field: 'password', message: 'Укажите пароль' }
    if (password.length < 4) return { field: 'password', message: 'Пароль слишком короткий' }

    set({
      pendingLogin: {
        email: trimmed,
        channel: 'EMAIL',
        deliveryHint: trimmed,
      },
    })
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
      pendingIdentification: null,
      pendingLogin: null,
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
          pendingLogin: null,
          pendingIdentification: null,
        })
        await useStudentProfile.getState().load()
        return null
      } catch (error) {
        if (error instanceof ApiError) {
          if (error.status === 400) {
            const msg = error.message
            if (!msg || msg === 'Неверный запрос.') return 'Неверный код подтверждения'
            return msg
          }
          if (error.status === 401) {
            const msg = error.message
            if (!msg || msg === 'Сессия истекла. Войдите снова.') {
              return 'Сначала войдите по номеру зачётки'
            }
            return msg
          }
        }
        return error instanceof Error ? error.message : 'Не удалось подтвердить код'
      }
    }

    set((state) => ({
      session: {
        studentId: '23И0142',
        email: state.pendingLogin?.email ?? 'ivanov.as@student.ruc.local',
        name: 'Иванов Артём Сергеевич',
      },
      pendingLogin: null,
      pendingIdentification: null,
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

    set({ session: null, pendingIdentification: null, pendingLogin: null })
    useStudentProfile.getState().reset()
    useRecordBook.getState().reset()
    useSchedule.getState().reset()
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
