/**
 * @file Публичные feature-флаги с backend (`GET /api/features`).
 */

import { create } from 'zustand'
import { apiGet, isApiConfigured } from '@/apiClient'

export type AppFeatures = {
  attendanceEnabled: boolean
  startEnabled: boolean
}

type FeaturesState = {
  features: AppFeatures | null
  status: 'idle' | 'loading' | 'ready'
  load: () => Promise<void>
}

const offlineDefaults: AppFeatures = {
  attendanceEnabled: true,
  startEnabled: false,
}

let loadPromise: Promise<void> | null = null

export const useAppFeatures = create<FeaturesState>((set, get) => ({
  features: isApiConfigured() ? null : offlineDefaults,
  status: isApiConfigured() ? 'idle' : 'ready',

  async load() {
    if (!isApiConfigured()) {
      set({ features: offlineDefaults, status: 'ready' })
      return
    }
    if (get().status === 'ready' && get().features) return
    if (loadPromise) return loadPromise

    set({ status: 'loading' })
    loadPromise = (async () => {
      try {
        const raw = await apiGet<Partial<AppFeatures>>('/api/features')
        set({
          features: {
            attendanceEnabled: raw.attendanceEnabled === true,
            startEnabled: raw.startEnabled === true,
          },
          status: 'ready',
        })
      } catch {
        // Старый backend без /api/features — посещаемость не прячем, Start выкл.
        set({ features: { attendanceEnabled: true, startEnabled: false }, status: 'ready' })
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
