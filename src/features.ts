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

export const useAppFeatures = create<FeaturesState>((set, get) => ({
  features: isApiConfigured() ? null : offlineDefaults,
  status: isApiConfigured() ? 'idle' : 'ready',

  async load() {
    if (!isApiConfigured()) {
      set({ features: offlineDefaults, status: 'ready' })
      return
    }
    if (get().status === 'loading') return
    set({ status: 'loading' })
    try {
      const features = await apiGet<AppFeatures>('/api/features')
      set({ features, status: 'ready' })
    } catch {
      set({ features: { attendanceEnabled: false }, status: 'ready' })
    }
  },
}))

/** Текущее значение флага посещаемости (false, пока не загружено). */
export function isAttendanceFeatureEnabled(): boolean {
  return useAppFeatures.getState().features?.attendanceEnabled === true
}
