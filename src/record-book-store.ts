/**
 * @file Кэш зачётной книжки с API (один запрос на сессию).
 */

import { create } from 'zustand'
import { isApiConfigured } from '@/apiClient'
import {
  fetchRecordBook,
  filterGradedRecordBook,
  mapRecordBookToRows,
  mockRecordBookRows,
  semestersFromRows,
  type RecordBookDto,
} from '@/record-book'
import type { GradeRow } from '@/mocks/record-book-types'
import { student } from '@/mocks/student'

export type RecordBookMeta = {
  studentFullName: string
  recordBook: string
  faculty: string
  specialty: string
  specialization: string
  studyForm: string
  group: string
  currentCourse: string
  studentState: string
  asOfDate: string
  passedCount: number
  failedCount: number
  itemsCount: number
}

type RecordBookState = {
  rows: GradeRow[]
  semesters: number[]
  meta: RecordBookMeta | null
  status: 'idle' | 'loading' | 'ready'
  load: (programId?: string) => Promise<void>
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
  }
}

function mockState(programId = student.programs[0].id): Pick<
  RecordBookState,
  'rows' | 'semesters' | 'meta' | 'status'
> {
  return toVisibleState(mockRecordBookRows(programId))
}

const initialMock = mockState()

export const useRecordBook = create<RecordBookState>((set, get) => ({
  rows: isApiConfigured() ? [] : initialMock.rows,
  semesters: isApiConfigured() ? [] : initialMock.semesters,
  meta: null,
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
      set(toVisibleState(rows, metaFromDto(dto)))
    } catch {
      set({ rows: [], semesters: [], meta: null, status: 'ready' })
    }
  },

  reset() {
    if (!isApiConfigured()) {
      set(mockState())
      return
    }
    set({ rows: [], semesters: [], meta: null, status: 'idle' })
  },
}))
