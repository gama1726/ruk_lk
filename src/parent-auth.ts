/**
 * @file Авторизация родителя.
 */

import { create } from 'zustand'
import { ApiError, apiGet, apiPost, apiRequest, isApiConfigured } from '@/apiClient'
import { PARENT_CONSENT_MESSAGE } from '@/parent-consent'
import type { LoginCodeChannel } from '@/auth'

export type ParentRelationKind = 'father' | 'mother' | 'guardian'

export type ParentMemberOption = {
  memberIndex: number
  relationKind: ParentRelationKind
  loginAvailable: boolean
}

export type ParentFamilyState = {
  members: ParentMemberOption[]
}

export type ParentDeliveryState = {
  emailAvailable: boolean
  maxAvailable: boolean
  maxPhoneChanged: boolean
  maskedEmail: string | null
  maskedPhone: string | null
  canSendCode: boolean
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
  pendingFamily: ParentFamilyState | null
  pendingDelivery: ParentDeliveryState | null
  pendingChallenge: { deliveryHint: string; channel: LoginCodeChannel } | null
  status: 'loading' | 'ready'
  restoreSession: () => Promise<void>
  identify: (studentId: string) => Promise<string | null>
  selectMember: (memberIndex: number) => Promise<string | null>
  fetchMaxBindLink: () => Promise<{ url: string } | string>
  refreshPendingDelivery: () => Promise<string | null>
  sendLoginCode: (channel: LoginCodeChannel) => Promise<string | null>
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
  pendingDelivery: null,
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
      set({ session: toSession(me), pendingFamily: null, pendingDelivery: null, pendingChallenge: null, status: 'ready' })
      return
    } catch (error) {
      if (!(error instanceof ApiError && error.status === 401)) {
        set({ session: null, pendingFamily: null, pendingDelivery: null, pendingChallenge: null, status: 'ready' })
        return
      }
    }

    try {
      const challenge = await apiGet<{ deliveryHint: string; channel: LoginCodeChannel }>(
        '/api/auth/parent/pending-challenge'
      )
      set({ session: null, pendingFamily: null, pendingDelivery: null, pendingChallenge: challenge, status: 'ready' })
      return
    } catch {
      // continue
    }

    try {
      const delivery = await apiGet<ParentDeliveryState>('/api/auth/parent/pending-delivery')
      set({ session: null, pendingFamily: null, pendingDelivery: delivery, pendingChallenge: null, status: 'ready' })
      return
    } catch {
      // continue
    }

    try {
      const family = await apiGet<ParentFamilyState>('/api/auth/parent/pending-family')
      set({ session: null, pendingFamily: family, pendingDelivery: null, pendingChallenge: null, status: 'ready' })
    } catch {
      set({ session: null, pendingFamily: null, pendingDelivery: null, pendingChallenge: null, status: 'ready' })
    }
  },

  async identify(studentId) {
    const trimmedId = studentId.trim()
    if (!trimmedId) return 'Укажите номер зачётки ребёнка'

    if (!isApiConfigured()) {
      set({
        pendingFamily: {
          members: [{ memberIndex: 0, relationKind: 'father', loginAvailable: true }],
        },
        pendingDelivery: null,
        pendingChallenge: null,
        session: null,
      })
      return null
    }

    try {
      const family = await apiPost<ParentFamilyState>('/api/auth/parent/identify', { studentId: trimmedId })
      set({ pendingFamily: family, pendingDelivery: null, pendingChallenge: null, session: null })
      return null
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        return error.message || 'Родители для указанной зачётки не найдены. Проверьте номер или обратитесь в деканат.'
      }
      if (error instanceof ApiError) return error.message || 'Не удалось проверить данные'
      return error instanceof Error ? error.message : 'Не удалось проверить данные'
    }
  },

  async selectMember(memberIndex) {
    if (!isApiConfigured()) {
      set({
        pendingDelivery: {
          emailAvailable: false,
          maxAvailable: false,
          maxPhoneChanged: false,
          maskedEmail: null,
          maskedPhone: '+7 (***) ***-**-67',
          canSendCode: true,
        },
        pendingChallenge: null,
        session: null,
      })
      return null
    }

    try {
      const delivery = await apiPost<ParentDeliveryState>('/api/auth/parent/select-member', { memberIndex })
      set({ pendingDelivery: delivery, pendingChallenge: null, session: null })
      return null
    } catch (error) {
      if (error instanceof ApiError) return error.message || 'Не удалось выбрать родителя'
      return error instanceof Error ? error.message : 'Не удалось выбрать родителя'
    }
  },

  async fetchMaxBindLink() {
    if (!isApiConfigured()) {
      return { url: 'https://max.ru/example?start=token' }
    }
    try {
      return await apiGet<{ url: string; expiresInSeconds: number }>('/api/auth/parent/max-bind-link')
    } catch (error) {
      if (error instanceof ApiError) return error.message || 'Не удалось получить ссылку MAX'
      return error instanceof Error ? error.message : 'Не удалось получить ссылку MAX'
    }
  },

  async refreshPendingDelivery() {
    if (!isApiConfigured()) {
      return null
    }
    try {
      const delivery = await apiPost<ParentDeliveryState>('/api/auth/parent/refresh-delivery', {})
      set({ pendingDelivery: delivery })
      return null
    } catch (error) {
      if (error instanceof ApiError) return error.message || 'Не удалось обновить данные'
      return error instanceof Error ? error.message : 'Не удалось обновить данные'
    }
  },

  async sendLoginCode(channel) {
    if (!isApiConfigured()) {
      set({
        pendingChallenge: { deliveryHint: channel === 'MAX' ? '+7 (***) ***-**-67' : 't***@mail.ru', channel },
        pendingFamily: null,
        pendingDelivery: null,
        session: null,
      })
      return null
    }

    try {
      const challenge = await apiPost<{ deliveryHint: string; channel: LoginCodeChannel }>(
        '/api/auth/parent/send-code',
        { channel }
      )
      set({ pendingChallenge: challenge, pendingFamily: null, pendingDelivery: null, session: null })
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
          studentFullName: 'Студент',
          parentFullName: 'Родитель',
          relation: 'Отец',
          isCustomer: true,
          servicesBlocked: false,
          dataAccessAllowed: true,
          consentRequiredMessage: null,
        },
        pendingChallenge: null,
        pendingFamily: null,
        pendingDelivery: null,
      })
      return null
    }

    try {
      const me = await apiPost<ParentMeResponseDto>('/api/auth/parent/verify-code', { code: digits })
      set({ session: toSession(me), pendingChallenge: null, pendingFamily: null, pendingDelivery: null })
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
    set({ session: null, pendingChallenge: null, pendingFamily: null, pendingDelivery: null })
  },
}))
