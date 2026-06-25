/**
 * @file Кэш профиля студента с API (один запрос на сессию).
 */

import { create } from 'zustand'
import { isApiConfigured } from '@/apiClient'
import { fetchStudentProfile, mockStudentProfile, type StudentProfileDto } from '@/profile'

type StudentProfileState = {
  profile: StudentProfileDto | null
  status: 'idle' | 'loading' | 'ready'
  load: () => Promise<void>
  reset: () => void
}

export const useStudentProfile = create<StudentProfileState>((set, get) => ({
  profile: isApiConfigured() ? null : mockStudentProfile(),
  status: isApiConfigured() ? 'idle' : 'ready',

  async load() {
    if (!isApiConfigured()) {
      set({ profile: mockStudentProfile(), status: 'ready' })
      return
    }
    if (get().status === 'loading') return
    set({ status: 'loading' })
    try {
      const profile = await fetchStudentProfile()
      set({ profile, status: 'ready' })
    } catch {
      set({ profile: null, status: 'ready' })
    }
  },

  reset() {
    set({
      profile: isApiConfigured() ? null : mockStudentProfile(),
      status: isApiConfigured() ? 'idle' : 'ready',
    })
  },
}))
