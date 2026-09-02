/**
 * @file Кэш расписания для родительского кабинета.
 */

import { create } from 'zustand'
import { ApiError, isApiConfigured } from '@/apiClient'
import { lessonsInMonth } from '@/mocks/lessons'
import type { Lesson } from '@/mocks/lesson-types'
import { student } from '@/mocks/student'
import { fetchParentScheduleMonth, mapScheduleLesson } from '@/schedule'

type MonthCacheEntry = {
  lessons: Lesson[]
  group: string
}

type ParentScheduleState = {
  lessons: Lesson[]
  group: string
  loadedYear: number | null
  loadedMonth: number | null
  status: 'idle' | 'loading' | 'ready' | 'error'
  error: string | null
  monthCache: Record<string, MonthCacheEntry>
  loadMonth: (studentId: string, year: number, month: number) => Promise<void>
  reset: () => void
}

function monthKey(year: number, month: number): string {
  return `${year}-${month}`
}

function emptyState(): Pick<
  ParentScheduleState,
  'lessons' | 'group' | 'loadedYear' | 'loadedMonth' | 'status' | 'error' | 'monthCache'
> {
  return {
    lessons: [],
    group: '',
    loadedYear: null,
    loadedMonth: null,
    status: isApiConfigured() ? 'idle' : 'ready',
    error: null,
    monthCache: {},
  }
}

function mockMonthState(programId: string, year: number, month: number) {
  const lessons = lessonsInMonth(programId || student.programs[0].id, year, month)
  return {
    lessons,
    group: student.programs[0].group,
    loadedYear: year,
    loadedMonth: month,
    status: 'ready' as const,
    error: null,
    monthCache: { [monthKey(year, month)]: { lessons, group: student.programs[0].group } },
  }
}

async function fetchMonthEntry(
  studentId: string,
  year: number,
  month: number,
): Promise<MonthCacheEntry> {
  const dto = await fetchParentScheduleMonth(year, month)
  const pid = studentId || dto.group
  const lessons = dto.lessons
    .map((row) => mapScheduleLesson(row, pid))
    .sort((a, b) => a.date.localeCompare(b.date) || a.start.localeCompare(b.start))
  return { lessons, group: dto.group }
}

export const useParentSchedule = create<ParentScheduleState>((set, get) => ({
  ...emptyState(),
  ...(isApiConfigured() ? {} : mockMonthState(student.programs[0].id, 2026, 5)),

  async loadMonth(studentId, year, month) {
    const resolvedStudentId = studentId || 'parent'

    if (!isApiConfigured()) {
      set(mockMonthState(resolvedStudentId, year, month))
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
        error: null,
      })
      return
    }

    set({ status: 'loading', loadedYear: year, loadedMonth: month, error: null })

    try {
      const entry = await fetchMonthEntry(resolvedStudentId, year, month)
      set((state) => ({
        lessons: entry.lessons,
        group: entry.group,
        loadedYear: year,
        loadedMonth: month,
        status: 'ready',
        error: null,
        monthCache: { ...state.monthCache, [key]: entry },
      }))
    } catch (error) {
      let message = 'Не удалось загрузить расписание'
      if (error instanceof ApiError) {
        message = error.message || message
      } else if (error instanceof Error) {
        message = error.message
      }
      set({
        lessons: [],
        group: '',
        loadedYear: year,
        loadedMonth: month,
        status: 'error',
        error: message,
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
