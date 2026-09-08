/**
 * @file Типы выгрузки посещаемости (приход / уход в вуз + пары).
 */

/** Статус очной пары */
export type AttendanceLessonStatus = 'present' | 'late' | 'absent'

/** Одна очная пара в дне */
export type AttendanceLesson = {
  id: string
  subject: string
  startTime: string
  endTime: string
  classroom?: string
  status: AttendanceLessonStatus
  arrivedAt?: string
  lateMinutes?: number | null
}

/** Одна запись: день в вузе или отсутствие при занятиях по расписанию */
export type AttendanceDay = {
  id: string
  /** YYYY-MM-DD */
  date: string
  /** Время первого входа на территорию (пусто при отсутствии) */
  checkIn: string
  /** Время последнего выхода с территории (пусто при отсутствии) */
  checkOut: string
  /** Корпус / КПП или причина отсутствия */
  gate?: string
  /** present — был на территории; absent — занятия в вузе, присутствия нет */
  status?: 'present' | 'absent'
  lessons?: AttendanceLesson[]
}

export type AttendancePeriodPreset = {
  id: string
  label: string
  /** YYYY-MM-DD */
  from: string
  /** YYYY-MM-DD */
  to: string
}
