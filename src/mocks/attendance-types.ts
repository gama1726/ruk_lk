/**
 * @file Типы выгрузки посещаемости (приход / уход в вуз).
 */

/** Одна запись: день в вузе или отсутствие при занятиях по расписанию */
export type AttendanceDay = {
  id: string
  /** YYYY-MM-DD */
  date: string
  /** Время первого прохода на территорию (пусто при отсутствии) */
  checkIn: string
  /** Время последнего выхода с территории (пусто при отсутствии) */
  checkOut: string
  /** Корпус / КПП или причина отсутствия */
  gate?: string
  /** present — был проход; absent — занятия в вузе, прохода нет */
  status?: 'present' | 'absent'
}

export type AttendancePeriodPreset = {
  id: string
  label: string
  /** YYYY-MM-DD */
  from: string
  /** YYYY-MM-DD */
  to: string
}
