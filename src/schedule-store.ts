/**
 * @file Кэш расписания: месяц целиком одним запросом + кэш месяцев в памяти.
 */

import { create } from 'zustand'
import { isApiConfigured } from '@/apiClient'
import { lessonsInMonth } from '@/mocks/lessons'
import type { Lesson } from '@/mocks/lesson-types'
import { student } from '@/mocks/student'
import { fetchScheduleMonth, mapScheduleLesson } from '@/schedule'

type MonthCacheEntry = {
  lessons: Lesson[]
  group: string
}

type ScheduleState = {
  lessons: Lesson[]
  group: string
  loadedYear: number | null
  loadedMonth: number | null
  status: 'idle' | 'loading' | 'ready'
  /** Кэш уже загруженных месяцев: `YYYY-M` → данные */
  monthCache: Record<string, MonthCacheEntry>
  loadMonth: (programId: string, year: number, month: number) => Promise<void>
  reset: () => void
}

function monthKey(year: number, month: number): string {
  return `${year}-${month}`
}

function emptyState(): Pick<
  ScheduleState,
  'lessons' | 'group' | 'loadedYear' | 'loadedMonth' | 'status' | 'monthCache'
> {
  return {
    lessons: [],
    group: '',
    loadedYear: null,
    loadedMonth: null,
    status: isApiConfigured() ? 'idle' : 'ready',
    monthCache: {},
  }
}

function mockMonthState(programId: string, year: number, month: number) {
  const lessons = lessonsInMonth(programId || student.programs[0].id, year, month)
  return {
    lessons,
    group: '',
    loadedYear: year,
    loadedMonth: month,
    status: 'ready' as const,
    monthCache: { [monthKey(year, month)]: { lessons, group: '' } },
  }
}

export const useSchedule = create<ScheduleState>((set, get) => ({
  ...emptyState(),
  ...(isApiConfigured() ? {} : mockMonthState(student.programs[0].id, 2026, 5)),

  async loadMonth(programId, year, month) {
    const resolvedProgramId = programId || student.programs[0].id

    if (!isApiConfigured()) {
      set(mockMonthState(resolvedProgramId, year, month))
      return
    }

    const current = get()
    const key = monthKey(year, month)

    if (current.status === 'loading' && current.loadedYear === year && current.loadedMonth === month) {
      return
    }

    const cached = current.monthCache[key]
    if (cached) {
      set({
        lessons: cached.lessons,
        group: cached.group,
        loadedYear: year,
        loadedMonth: month,
        status: 'ready',
      })
      return
    }

    set({ status: 'loading', loadedYear: year, loadedMonth: month })

    try {
      const dto = await fetchScheduleMonth(year, month)
      const pid = resolvedProgramId || dto.group
      const lessons = dto.lessons
        .map((row) => mapScheduleLesson(row, pid))
        .sort((a, b) => a.date.localeCompare(b.date) || a.start.localeCompare(b.start))

      const entry: MonthCacheEntry = { lessons, group: dto.group }
      set((state) => ({
        lessons,
        group: dto.group,
        loadedYear: year,
        loadedMonth: month,
        status: 'ready',
        monthCache: { ...state.monthCache, [key]: entry },
      }))
    } catch {
      set({
        lessons: [],
        group: '',
        loadedYear: year,
        loadedMonth: month,
        status: 'ready',
      })
    }
  },

  reset() {
    if (!isApiConfigured()) {
      set(mockMonthState(student.programs[0].id, 2026, 5))
      return
    }
    set(emptyState())
  },
}))
