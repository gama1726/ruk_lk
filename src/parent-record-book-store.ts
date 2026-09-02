/**
 * @file Кэш зачётной книжки для родительского кабинета.
 */

import { create } from 'zustand'
import { ApiError, isApiConfigured } from '@/apiClient'
import {
  fetchParentRecordBook,
  filterGradedRecordBook,
  mapRecordBookToRows,
  mockRecordBookRows,
  semestersFromRows,
  type RecordBookDto,
} from '@/record-book'
import type { GradeRow } from '@/mocks/record-book-types'
import { student } from '@/mocks/student'
import type { RecordBookMeta } from '@/record-book-store'

type ParentRecordBookState = {
  rows: GradeRow[]
  semesters: number[]
  meta: RecordBookMeta | null
  status: 'idle' | 'loading' | 'ready' | 'error'
  error: string | null
  load: () => Promise<void>
  reset: () => void
}

function metaFromDto(dto: RecordBookDto): RecordBookMeta {
  return {
    studentFullName: dto.studentFullName,
    recordBook: dto.recordBook,
    faculty: dto.faculty,
    specialty: dto.specialty,
    specialization: dto.specialization,
    studyForm: dto.studyForm,
    group: dto.group,
    currentCourse: dto.currentCourse,
    studentState: dto.studentState,
    asOfDate: dto.asOfDate,
    passedCount: dto.passedCount,
    failedCount: dto.failedCount,
    itemsCount: dto.itemsCount,
  }
}

function toVisibleState(rows: GradeRow[], meta: RecordBookMeta | null = null) {
  const graded = filterGradedRecordBook(rows)
  return {
    rows: graded,
    semesters: semestersFromRows(graded),
    meta,
    status: 'ready' as const,
    error: null,
  }
}

function mockState(programId = student.programs[0].id) {
  const rows = mockRecordBookRows(programId)
  const graded = filterGradedRecordBook(rows)
  return {
    rows: graded,
    semesters: semestersFromRows(graded),
    meta: null,
    status: 'ready' as const,
    error: null,
  }
}

export const useParentRecordBook = create<ParentRecordBookState>((set, get) => ({
  rows: isApiConfigured() ? [] : mockState().rows,
  semesters: isApiConfigured() ? [] : mockState().semesters,
  meta: null,
  status: isApiConfigured() ? 'idle' : 'ready',
  error: null,

  async load() {
    if (!isApiConfigured()) {
      set(mockState())
      return
    }

    if (get().status === 'loading') return

    set({ status: 'loading', error: null })

    try {
      const dto = await fetchParentRecordBook()
      const rows = mapRecordBookToRows(dto, dto.studentId)
      set(toVisibleState(rows, metaFromDto(dto)))
    } catch (error) {
      let message = 'Не удалось загрузить зачётную книжку'
      if (error instanceof ApiError) {
        message = error.message || message
      } else if (error instanceof Error) {
        message = error.message
      }
      set({ rows: [], semesters: [], meta: null, status: 'error', error: message })
    }
  },

  reset() {
    if (!isApiConfigured()) {
      set(mockState())
      return
    }
    set({ rows: [], semesters: [], meta: null, status: 'idle', error: null })
  },
}))
