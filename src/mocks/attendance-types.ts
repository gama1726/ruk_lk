/**
 * @file Типы посещаемости.
 */

/** Отметка на занятии */
export type AttendanceMark = 'present' | 'absent' | 'excused' | 'late'

export const attendanceMarkLabel: Record<AttendanceMark, string> = {
  present: 'присутствовал',
  absent: 'отсутствовал',
  excused: 'уважительная причина',
  late: 'опоздание',
}

/**
 * Одно занятие в журнале посещаемости.
 */
export type AttendanceLesson = {
  id: string
  programId: string
  subject: string
  date: string
  time: string
  mark: AttendanceMark
}

/**
 * Сводка по дисциплине за период.
 */
export type AttendanceSummary = {
  subject: string
  percent: number
  total: number
  present: number
}
