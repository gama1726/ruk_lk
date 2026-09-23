/**
 * @file Публичные feature-флаги с backend (`GET /api/features`).
 */

import { create } from 'zustand'
import { apiGet, isApiConfigured } from '@/apiClient'

export type AppFeatures = {
  attendanceEnabled: boolean
  startEnabled: boolean
  /** Показывать Start в меню/сервисах (мост может быть включён отдельно). */
  startShowInLk: boolean
  /** Мост электронного журнала → pulse.ruc.su. */
  pulseEnabled: boolean
  /** Тестовая зачётка: разделы «в разработке» без ComingSoon. */
  previewEnabled: boolean
}

type FeaturesState = {
  features: AppFeatures | null
  status: 'idle' | 'loading' | 'ready'
  load: (force?: boolean) => Promise<void>
  reset: () => void
}

const offlineDefaults: AppFeatures = {
  attendanceEnabled: true,
  startEnabled: false,
  startShowInLk: false,
  pulseEnabled: false,
  previewEnabled: false,
}

let loadPromise: Promise<void> | null = null

export const useAppFeatures = create<FeaturesState>((set, get) => ({
  features: isApiConfigured() ? null : offlineDefaults,
  status: isApiConfigured() ? 'idle' : 'ready',

  reset() {
    loadPromise = null
    set({
      features: isApiConfigured() ? null : offlineDefaults,
      status: isApiConfigured() ? 'idle' : 'ready',
    })
  },

  async load(force = false) {
    if (!isApiConfigured()) {
      set({ features: offlineDefaults, status: 'ready' })
      return
    }
    if (!force && get().status === 'ready' && get().features) return
    if (!force && loadPromise) return loadPromise
    if (force) loadPromise = null

    set({ status: 'loading' })
    loadPromise = (async () => {
      try {
        const raw = await apiGet<Partial<AppFeatures>>('/api/features')
        set({
          features: {
            attendanceEnabled: raw.attendanceEnabled === true,
            startEnabled: raw.startEnabled === true,
            startShowInLk: raw.startShowInLk === true,
            pulseEnabled: raw.pulseEnabled === true,
            previewEnabled: raw.previewEnabled === true,
          },
          status: 'ready',
        })
      } catch {
        set({
          features: {
            attendanceEnabled: true,
            startEnabled: false,
            startShowInLk: false,
            pulseEnabled: false,
            previewEnabled: false,
          },
          status: 'ready',
        })
      } finally {
        loadPromise = null
      }
    })()

    return loadPromise
  },
}))

/** Текущее значение флага посещаемости (false, пока не загружено). */
export function isAttendanceFeatureEnabled(): boolean {
  return useAppFeatures.getState().features?.attendanceEnabled === true
}

/** Мост Start включён на backend. */
export function isStartFeatureEnabled(): boolean {
  return useAppFeatures.getState().features?.startEnabled === true
}

/** Пункт Start виден в меню ЛК. */
export function isStartShownInLk(): boolean {
  return useAppFeatures.getState().features?.startShowInLk === true
}

/** Мост Pulse (электронный журнал) включён на backend. */
export function isPulseFeatureEnabled(): boolean {
  return useAppFeatures.getState().features?.pulseEnabled === true
}

/** Разделы в разработке доступны текущей сессии. */
export function isPreviewFeaturesEnabled(): boolean {
  return useAppFeatures.getState().features?.previewEnabled === true
}
