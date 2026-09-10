/**
 * @file Публичные feature-флаги с backend (`GET /api/features`).
 */

import { create } from 'zustand'
import { apiGet, isApiConfigured } from '@/apiClient'

export type AppFeatures = {
  attendanceEnabled: boolean
}

type FeaturesState = {
  features: AppFeatures | null
  status: 'idle' | 'loading' | 'ready'
  load: () => Promise<void>
}

const offlineDefaults: AppFeatures = {
  attendanceEnabled: true,
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
        const features = await apiGet<AppFeatures>('/api/features')
        set({ features, status: 'ready' })
      } catch {
        // Старый backend без /api/features — не прячем раздел молча навсегда.
        set({ features: { attendanceEnabled: true }, status: 'ready' })
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
