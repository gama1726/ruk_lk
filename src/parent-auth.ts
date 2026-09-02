/**
 * @file Авторизация родителя.
 */

import { create } from 'zustand'
import { ApiError, apiGet, apiPost, apiRequest, isApiConfigured } from '@/apiClient'
import { PARENT_CONSENT_MESSAGE } from '@/parent-consent'

export type ParentMemberOptionDto = {
  memberIndex: number
  relation: string
  displayName: string
  isCustomer: boolean
  servicesBlocked: boolean
  emailAvailable: boolean
  emailHint: string | null
}

export type ParentFamilyResponseDto = {
  studentId: string
  studentFullName: string
  studentAdult: boolean
  members: ParentMemberOptionDto[]
}

export type ParentMeResponseDto = {
  studentId: string
  studentFullName: string
  studentAdult: boolean
  relation: string
  parentFullName: string
  isCustomer: boolean
  servicesBlocked: boolean
  dataAccessAllowed: boolean
  consentRequiredMessage: string | null
}

export type ParentSession = {
  studentId: string
  studentFullName: string
  parentFullName: string
  relation: string
  isCustomer: boolean
  servicesBlocked: boolean
  dataAccessAllowed: boolean
  consentRequiredMessage: string | null
}

type ParentAuthState = {
  session: ParentSession | null
  pendingFamily: ParentFamilyResponseDto | null
  pendingChallenge: { deliveryHint: string } | null
  status: 'loading' | 'ready'
  restoreSession: () => Promise<void>
  identify: (studentId: string) => Promise<string | null>
  selectMember: (memberIndex: number) => Promise<string | null>
  sendCode: () => Promise<string | null>
  confirmCode: (code: string) => Promise<string | null>
  signOut: () => Promise<void>
}

function toSession(me: ParentMeResponseDto): ParentSession {
  return {
    studentId: me.studentId,
    studentFullName: me.studentFullName,
    parentFullName: me.parentFullName,
    relation: me.relation,
    isCustomer: me.isCustomer,
    servicesBlocked: me.servicesBlocked,
    dataAccessAllowed: me.dataAccessAllowed,
    consentRequiredMessage: me.consentRequiredMessage ?? PARENT_CONSENT_MESSAGE,
  }
}

export const useParentAuth = create<ParentAuthState>((set) => ({
  session: null,
  pendingFamily: null,
  pendingChallenge: null,
  status: isApiConfigured() ? 'loading' : 'ready',

  async restoreSession() {
    if (!isApiConfigured()) {
      set({ status: 'ready' })
      return
    }

    set({ status: 'loading' })
    try {
      const me = await apiGet<ParentMeResponseDto>('/api/auth/parent/me')
      set({ session: toSession(me), pendingFamily: null, pendingChallenge: null, status: 'ready' })
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        try {
          const challenge = await apiGet<{ deliveryHint: string }>('/api/auth/parent/pending-challenge')
          set({ session: null, pendingChallenge: challenge, pendingFamily: null, status: 'ready' })
          return
        } catch {
          // no challenge
        }
        try {
          const family = await apiGet<ParentFamilyResponseDto>('/api/auth/parent/pending-family')
          set({ session: null, pendingFamily: family, pendingChallenge: null, status: 'ready' })
          return
        } catch {
          set({ session: null, pendingFamily: null, pendingChallenge: null, status: 'ready' })
        }
        return
      }
      set({ session: null, pendingFamily: null, pendingChallenge: null, status: 'ready' })
    }
  },

  async identify(studentId) {
    const trimmed = studentId.trim()
    if (!trimmed) return 'Укажите номер зачётки ребёнка'

    if (!isApiConfigured()) {
      set({
        pendingFamily: {
          studentId: trimmed,
          studentFullName: 'Евмененко Константин Михайлович',
          studentAdult: true,
          members: [
            {
              memberIndex: 0,
              relation: 'Отец',
              displayName: 'Евмененко Михаил Романович',
              isCustomer: true,
              servicesBlocked: true,
              emailAvailable: false,
              emailHint: null,
            },
          ],
        },
        pendingChallenge: null,
        session: null,
      })
      return null
    }

    try {
      const family = await apiPost<ParentFamilyResponseDto>('/api/auth/parent/identify', {
        studentId: trimmed,
      })
      set({ pendingFamily: family, pendingChallenge: null, session: null })
      return null
    } catch (error) {
      if (error instanceof ApiError) return error.message || 'Студент не найден'
      return error instanceof Error ? error.message : 'Не удалось проверить зачётку'
    }
  },

  async selectMember(memberIndex) {
    if (!isApiConfigured()) {
      return null
    }
    try {
      await apiPost('/api/auth/parent/select-member', { memberIndex })
      return null
    } catch (error) {
      if (error instanceof ApiError) return error.message
      return error instanceof Error ? error.message : 'Не удалось выбрать родителя'
    }
  },

  async sendCode() {
    if (!isApiConfigured()) {
      set({ pendingChallenge: { deliveryHint: 'тестовый вход' }, pendingFamily: null })
      return null
    }
    try {
      const challenge = await apiPost<{ deliveryHint: string }>('/api/auth/parent/send-code', {})
      set({ pendingChallenge: challenge, pendingFamily: null })
      return null
    } catch (error) {
      if (error instanceof ApiError) return error.message || 'Не удалось отправить код'
      return error instanceof Error ? error.message : 'Не удалось отправить код'
    }
  },

  async confirmCode(code) {
    const digits = code.replace(/\s/g, '')
    if (!/^\d{6}$/.test(digits)) return 'Нужен код из 6 цифр'

    if (!isApiConfigured()) {
      set({
        session: {
          studentId: '831857',
          studentFullName: 'Евмененко Константин Михайлович',
          parentFullName: 'Евмененко Михаил Романович',
          relation: 'Отец',
          isCustomer: true,
          servicesBlocked: true,
          dataAccessAllowed: false,
          consentRequiredMessage: PARENT_CONSENT_MESSAGE,
        },
        pendingChallenge: null,
        pendingFamily: null,
      })
      return null
    }

    try {
      const me = await apiPost<ParentMeResponseDto>('/api/auth/parent/verify-code', { code: digits })
      set({ session: toSession(me), pendingChallenge: null, pendingFamily: null })
      return null
    } catch (error) {
      if (error instanceof ApiError) return error.message || 'Неверный код'
      return error instanceof Error ? error.message : 'Не удалось подтвердить код'
    }
  },

  async signOut() {
    if (isApiConfigured()) {
      try {
        await apiRequest('/api/auth/parent/logout', { method: 'POST' })
      } catch {
        // ignore
      }
    }
    set({ session: null, pendingFamily: null, pendingChallenge: null })
  },
}))
