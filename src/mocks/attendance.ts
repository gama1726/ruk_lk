/**
 * @file Мок посещаемости.
 */

import type { AttendanceLesson, AttendanceMark, AttendanceSummary } from './attendance-types'

const lessons: AttendanceLesson[] = [
  { id: 'a1', programId: 'b-2023', subject: 'Web-технологии', date: '2026-06-05', time: '12:10', mark: 'absent' },
  { id: 'a2', programId: 'b-2023', subject: 'Web-технологии', date: '2026-05-29', time: '12:10', mark: 'late' },
  { id: 'a3', programId: 'b-2023', subject: 'Web-технологии', date: '2026-05-22', time: '12:10', mark: 'present' },
  { id: 'a4', programId: 'b-2023', subject: 'Web-технологии', date: '2026-05-15', time: '12:10', mark: 'absent' },
  { id: 'a5', programId: 'b-2023', subject: 'Web-технологии', date: '2026-05-08', time: '12:10', mark: 'excused' },
  { id: 'a6', programId: 'b-2023', subject: 'Базы данных', date: '2026-06-06', time: '10:40', mark: 'present' },
  { id: 'a7', programId: 'b-2023', subject: 'Базы данных', date: '2026-05-30', time: '10:40', mark: 'present' },
  { id: 'a8', programId: 'b-2023', subject: 'Базы данных', date: '2026-05-23', time: '10:40', mark: 'present' },
  { id: 'a9', programId: 'b-2023', subject: 'Информационная безопасность', date: '2026-06-04', time: '09:00', mark: 'present' },
  { id: 'a10', programId: 'b-2023', subject: 'Информационная безопасность', date: '2026-05-28', time: '09:00', mark: 'late' },
  { id: 'a11', programId: 'm-2025', subject: 'Управление цифровыми проектами', date: '2026-06-12', time: '18:00', mark: 'present' },
]

/** Доступные периоды в фильтре */
export const attendancePeriods = [
  { id: '2026-spring', label: 'Весенний семестр 2026' },
  { id: '2025-fall', label: 'Осенний семестр 2025' },
] as const

export type AttendancePeriod = (typeof attendancePeriods)[number]['id']

/**
 * Список дисциплин программы для фильтра.
 * @param programId - id программы
 */
export function attendanceSubjects(programId: string): string[] {
  const set = new Set(lessons.filter((l) => l.programId === programId).map((l) => l.subject))
  return [...set].sort()
}

/**
 * Занятия с учётом фильтров.
 * @param programId - id программы
 * @param subject - дисциплина или `all`
 * @param _period - период (в моке один набор данных)
 */
export function filterAttendance(
  programId: string,
  subject: string,
  _period: AttendancePeriod,
): AttendanceLesson[] {
  return lessons
    .filter((l) => l.programId === programId && (subject === 'all' || l.subject === subject))
    .sort((a, b) => b.date.localeCompare(a.date))
}

/**
 * Сводка % посещаемости по дисциплинам.
 * @param programId - id программы
 */
export function attendanceSummary(programId: string): AttendanceSummary[] {
  const bySubject = new Map<string, AttendanceLesson[]>()

  for (const l of lessons.filter((x) => x.programId === programId)) {
    const list = bySubject.get(l.subject) ?? []
    list.push(l)
    bySubject.set(l.subject, list)
  }

  return [...bySubject.entries()].map(([subject, rows]) => {
    const present = rows.filter((r) => r.mark === 'present' || r.mark === 'late').length
    const total = rows.length
    const percent = total === 0 ? 0 : Math.round((present / total) * 100)
    return { subject, percent, total, present }
  })
}

/**
 * @param mark - отметка
 */
export function markStatusKey(mark: AttendanceMark): string {
  const map: Record<AttendanceMark, string> = {
    present: 'present',
    absent: 'absent',
    excused: 'processing',
    late: 'warning',
  }
  return map[mark]
}

/**
 * @param iso - `YYYY-MM-DD`
 */
export function formatAttendanceDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  return new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short' }).format(new Date(y, m - 1, d))
}
