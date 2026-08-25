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
  /** YYYY-MM-DD */
  date: string
  /** Начало пары ЧЧ:ММ */
  start: string
  /** Конец пары ЧЧ:ММ */
  end: string
  mark: AttendanceMark
  /** Фактический приход; null — не отмечался */
  checkIn: string | null
  /** Фактический уход; null — не отмечался / неявка */
  checkOut: string | null
  room?: string
  teacher?: string
  comment?: string
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
