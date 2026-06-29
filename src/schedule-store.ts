/**
 * @file Кэш расписания: загрузка всех недель месяца для календаря.
 */

import { create } from 'zustand'
import { isApiConfigured } from '@/apiClient'
import { lessonsInMonth } from '@/mocks/lessons'
import type { Lesson } from '@/mocks/lesson-types'
import { student } from '@/mocks/student'
import {
  fetchSchedule,
  mapScheduleLesson,
  weekAnchorsForMonth,
} from '@/schedule'

type ScheduleState = {
  lessons: Lesson[]
  group: string
  loadedYear: number | null
  loadedMonth: number | null
  status: 'idle' | 'loading' | 'ready'
  loadMonth: (programId: string, year: number, month: number) => Promise<void>
  reset: () => void
}

function emptyState(): Pick<ScheduleState, 'lessons' | 'group' | 'loadedYear' | 'loadedMonth' | 'status'> {
  return {
    lessons: [],
    group: '',
    loadedYear: null,
    loadedMonth: null,
    status: isApiConfigured() ? 'idle' : 'ready',
  }
}

function mockMonthState(programId: string, year: number, month: number) {
  return {
    lessons: lessonsInMonth(programId || student.programs[0].id, year, month),
    group: '',
    loadedYear: year,
    loadedMonth: month,
    status: 'ready' as const,
  }
}

export const useSchedule = create<ScheduleState>((set, get) => ({
  ...emptyState(),
  ...(isApiConfigured()
    ? {}
    : mockMonthState(student.programs[0].id, 2026, 5)),

  async loadMonth(programId, year, month) {
    const resolvedProgramId = programId || student.programs[0].id

    if (!isApiConfigured()) {
      set(mockMonthState(resolvedProgramId, year, month))
      return
    }

    const current = get()
    if (
      current.status === 'loading' ||
      (current.loadedYear === year && current.loadedMonth === month && current.lessons.length > 0)
    ) {
      return
    }

    set({ status: 'loading' })

    try {
      const anchors = weekAnchorsForMonth(year, month)
      const results = await Promise.all(anchors.map((anchor) => fetchSchedule(anchor)))

      const byId = new Map<string, Lesson>()
      let group = ''

      for (const dto of results) {
        if (!group && dto.group) group = dto.group
        const pid = resolvedProgramId || dto.group
        for (const row of dto.lessons) {
          const lesson = mapScheduleLesson(row, pid)
          const [ly, lm] = lesson.date.split('-').map(Number)
          if (ly === year && lm - 1 === month) {
            byId.set(lesson.id, lesson)
          }
        }
      }

      const lessons = [...byId.values()].sort(
        (a, b) => a.date.localeCompare(b.date) || a.start.localeCompare(b.start),
      )

      set({
        lessons,
        group,
        loadedYear: year,
        loadedMonth: month,
        status: 'ready',
      })
    } catch {
      set({ ...emptyState(), status: 'ready' })
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
