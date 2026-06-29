/**
 * @file Кэш зачётной книжки с API (один запрос на сессию).
 */

import { create } from 'zustand'
import { isApiConfigured } from '@/apiClient'
import {
  fetchRecordBook,
  mapRecordBookToRows,
  mockRecordBookRows,
  semestersFromRows,
  type RecordBookDto,
} from '@/record-book'
import type { GradeRow } from '@/mocks/record-book-types'
import { student } from '@/mocks/student'

type RecordBookState = {
  rows: GradeRow[]
  semesters: number[]
  status: 'idle' | 'loading' | 'ready'
  load: (programId?: string) => Promise<void>
  reset: () => void
}

function mockState(programId = student.programs[0].id): Pick<RecordBookState, 'rows' | 'semesters' | 'status'> {
  const rows = mockRecordBookRows(programId)
  return {
    rows,
    semesters: semestersFromRows(rows),
    status: 'ready',
  }
}

export const useRecordBook = create<RecordBookState>((set, get) => ({
  rows: isApiConfigured() ? [] : mockRecordBookRows(),
  semesters: isApiConfigured() ? [] : semestersFromRows(mockRecordBookRows()),
  status: isApiConfigured() ? 'idle' : 'ready',

  async load(programId) {
    const resolvedProgramId = programId ?? student.programs[0].id

    if (!isApiConfigured()) {
      set(mockState(resolvedProgramId))
      return
    }

    if (get().status === 'loading') return

    set({ status: 'loading' })

    try {
      const dto: RecordBookDto = await fetchRecordBook()
      const rows = mapRecordBookToRows(dto, dto.studentId || resolvedProgramId)
      set({
        rows,
        semesters: dto.semesters.length > 0 ? dto.semesters : semestersFromRows(rows),
        status: 'ready',
      })
    } catch {
      set({ rows: [], semesters: [], status: 'ready' })
    }
  },

  reset() {
    if (!isApiConfigured()) {
      set(mockState())
      return
    }
    set({ rows: [], semesters: [], status: 'idle' })
  },
}))
