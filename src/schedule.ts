/**
 * @file Загрузка расписания с backend API.
 */

import { apiGet, isApiConfigured } from '@/apiClient'
import { todayIso } from '@/dates'
import { lessonsInWeek, mondayOf, parseLessonDate, todayLessons, weekDays } from '@/mocks/lessons'
import type { Lesson, LessonKind, LessonStatus } from '@/mocks/lesson-types'
import { student } from '@/mocks/student'

/** Строка `GET /api/student/schedule` */
export type ScheduleLessonDto = {
  id: string
  date: string
  subject: string
  kind: string
  start: string
  end: string
  room: string
  teacher: string
  groupName: string
  status: string
}

/** Ответ `GET /api/student/schedule` */
export type ScheduleDto = {
  group: string
  weekStart: string
  weekEnd: string
  anchorDate: string
  prevDate: string | null
  nextDate: string | null
  lessons: ScheduleLessonDto[]
}

const lessonKinds = new Set<LessonKind>(['лекция', 'практика', 'лабораторная', 'консультация', 'экзамен'])
const lessonStatuses = new Set<LessonStatus>(['scheduled', 'rescheduled', 'cancelled', 'remote'])

export { todayIso }

/** `2025.11.18` → `2025-11-18` */
export function apiDateToIso(apiDate: string): string {
  const [y, m, d] = apiDate.split('.')
  return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
}

export function mapScheduleLesson(row: ScheduleLessonDto, programId: string): Lesson {
  const kind = lessonKinds.has(row.kind as LessonKind) ? (row.kind as LessonKind) : 'лекция'
  const status = lessonStatuses.has(row.status as LessonStatus) ? (row.status as LessonStatus) : 'scheduled'

  return {
    id: row.id,
    programId,
    date: row.date,
    subject: row.subject,
    kind,
    start: row.start,
    end: row.end,
    room: row.room || '—',
    teacher: row.teacher,
    status,
  }
}

export function lessonsOnDateFromRows(rows: Lesson[], date: string): Lesson[] {
  return rows.filter((row) => row.date === date).sort((a, b) => a.start.localeCompare(b.start))
}

export function lessonCountsInMonthFromRows(rows: Lesson[], year: number, month: number): Map<string, number> {
  const counts = new Map<string, number>()
  for (const lesson of rows) {
    const [y, m] = lesson.date.split('-').map(Number)
    if (y !== year || m - 1 !== month) continue
    counts.set(lesson.date, (counts.get(lesson.date) ?? 0) + 1)
  }
  return counts
}

export function isDateInRange(date: string, weekStart: string, weekEnd: string): boolean {
  return date >= weekStart && date <= weekEnd
}

/** Якорные даты (понедельники) всех недель, пересекающих месяц. */
export function weekAnchorsForMonth(year: number, month: number): string[] {
  const firstIso = `${year}-${String(month + 1).padStart(2, '0')}-01`
  const lastDay = new Date(year, month + 1, 0).getDate()
  const lastIso = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`

  const anchors: string[] = []
  let monday = mondayOf(firstIso)

  while (monday <= lastIso) {
    anchors.push(monday)
    const next = parseLessonDate(monday)
    next.setDate(next.getDate() + 7)
    monday = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}-${String(next.getDate()).padStart(2, '0')}`
  }

  return anchors
}

/** Мок-данные для режима без API. */
export function mockScheduleWeek(programId: string, anchorDate: string): {
  lessons: Lesson[]
  weekStart: string
  weekEnd: string
  anchorDate: string
  prevDate: string | null
  nextDate: string | null
} {
  const weekStart = mondayOf(anchorDate)
  const days = weekDays(weekStart)
  return {
    lessons: lessonsInWeek(programId, weekStart),
    weekStart,
    weekEnd: days[6],
    anchorDate,
    prevDate: null,
    nextDate: null,
  }
}

export function mockTodayLessons(programId = student.programs[0].id): Lesson[] {
  return todayLessons(programId)
}

export async function fetchSchedule(date?: string): Promise<ScheduleDto> {
  const query = date ? `?date=${encodeURIComponent(date)}` : ''
  return apiGet<ScheduleDto>(`/api/student/schedule${query}`)
}

export function isScheduleApiEnabled(): boolean {
  return isApiConfigured()
}
