/**
 * @file Загрузка зачётной книжки с backend API.
 */

import { apiGet, isApiConfigured } from '@/apiClient'
import { gradesByProgram } from '@/mocks/record-book'
import type { GradeRow, GradeStatus } from '@/mocks/record-book-types'
import { student } from '@/mocks/student'

/** Строка `GET /api/student/record-book` */
export type RecordBookEntryDto = {
  id: string
  semester: number
  subject: string
  controlForm: string
  hours: number
  grade: string | null
  points: number | null
  teacher: string
  date: string | null
  displayDate: string
  status: string
  statusTitle: string
  creditUnits: number
  studyYear: string
  course: string
  periodControl: string
  practice: boolean
  planned: boolean
}

/** Ответ `GET /api/student/record-book` */
export type RecordBookDto = {
  studentId: string
  studentFullName: string
  recordBook: string
  asOfDate: string
  faculty: string
  specialty: string
  specialization: string
  studyForm: string
  group: string
  currentCourse: string
  studentState: string
  currentStudyPlan: string
  passedCount: number
  failedCount: number
  notGradedCount: number
  itemsCount: number
  semesters: number[]
  items: RecordBookEntryDto[]
}

const gradeStatuses = new Set<GradeStatus>([
  'passed',
  'excellent',
  'good',
  'satisfactory',
  'failed',
  'not_graded',
])

function toGradeStatus(value: string): GradeStatus {
  return gradeStatuses.has(value as GradeStatus) ? (value as GradeStatus) : 'not_graded'
}

/**
 * Преобразует ответ API в строки {@link GradeRow}.
 */
export function mapRecordBookToRows(dto: RecordBookDto, programId: string): GradeRow[] {
  return dto.items.map((item) => ({
    id: item.id,
    programId,
    semester: item.semester,
    subject: item.subject,
    controlForm: item.controlForm,
    hours: item.hours,
    grade: item.grade,
    points: item.points,
    teacher: item.teacher,
    date: item.date,
    displayDate: item.displayDate || null,
    status: toGradeStatus(item.status),
    creditUnits: item.creditUnits,
    periodControl: item.periodControl || null,
  }))
}

/** Мок-данные для режима без API. */
export function mockRecordBookRows(programId = student.programs[0].id): GradeRow[] {
  const bySemester = gradesByProgram(programId)
  return [...bySemester.values()].flat()
}

/** Семестры из списка оценок. */
export function semestersFromRows(rows: GradeRow[]): number[] {
  const set = new Set(rows.map((row) => row.semester))
  return [...set].sort((a, b) => a - b)
}

/** Оценки по семестрам. */
export function groupGradesBySemester(rows: GradeRow[]): Map<number, GradeRow[]> {
  const map = new Map<number, GradeRow[]>()

  for (const row of rows) {
    const list = map.get(row.semester) ?? []
    list.push(row)
    map.set(row.semester, list)
  }

  return new Map([...map.entries()].sort(([a], [b]) => b - a))
}

/** Оценки одного семестра. */
export function gradesForSemester(rows: GradeRow[], semester: number): GradeRow[] {
  return rows
    .filter((row) => row.semester === semester)
    .sort((a, b) => (a.date ?? '').localeCompare(b.date ?? ''))
}

/**
 * Загружает зачётную книжку из API.
 * @throws {@link ApiError} при ошибке HTTP
 */
export async function fetchRecordBook(): Promise<RecordBookDto> {
  return apiGet<RecordBookDto>('/api/student/record-book')
}

/** Есть ли подключение к API зачётки. */
export function isRecordBookApiEnabled(): boolean {
  return isApiConfigured()
}
