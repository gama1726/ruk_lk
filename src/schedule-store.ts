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

function shiftMonth(year: number, month: number, delta: number): { year: number; month: number } {
  const date = new Date(year, month + delta, 1)
  return { year: date.getFullYear(), month: date.getMonth() }
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

async function fetchMonthEntry(
  programId: string,
  year: number,
  month: number,
): Promise<MonthCacheEntry> {
  const dto = await fetchScheduleMonth(year, month)
  const pid = programId || dto.group
  const lessons = dto.lessons
    .map((row) => mapScheduleLesson(row, pid))
    .sort((a, b) => a.date.localeCompare(b.date) || a.start.localeCompare(b.start))
  return { lessons, group: dto.group }
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
      void prefetchAdjacent(resolvedProgramId, year, month)
      return
    }

    set({ status: 'loading', loadedYear: year, loadedMonth: month })

    try {
      const entry = await fetchMonthEntry(resolvedProgramId, year, month)
      set((state) => ({
        lessons: entry.lessons,
        group: entry.group,
        loadedYear: year,
        loadedMonth: month,
        status: 'ready',
        monthCache: { ...state.monthCache, [key]: entry },
      }))
      void prefetchAdjacent(resolvedProgramId, year, month)
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

/** Фоновая подгрузка соседних месяцев (не трогает loading текущего). */
async function prefetchAdjacent(programId: string, year: number, month: number) {
  if (!isApiConfigured()) return

  const neighbors = [shiftMonth(year, month, -1), shiftMonth(year, month, 1)]
  await Promise.all(
    neighbors.map(async ({ year: y, month: m }) => {
      const key = monthKey(y, m)
      if (useSchedule.getState().monthCache[key]) return
      try {
        const entry = await fetchMonthEntry(programId, y, m)
        useSchedule.setState((state) => {
          if (state.monthCache[key]) return state
          return { monthCache: { ...state.monthCache, [key]: entry } }
        })
      } catch {
        // тихо: prefetch не должен ломать UI
      }
    }),
  )
}
