/**
 * @file Типы выгрузки посещаемости (приход / уход в вуз).
 */

/** Одна запись: день в вузе */
export type AttendanceDay = {
  id: string
  /** YYYY-MM-DD */
  date: string
  /** Время первого прохода на территорию */
  checkIn: string
  /** Время последнего выхода с территории */
  checkOut: string
  /** Корпус / КПП (опционально) */
  gate?: string
}

export type AttendancePeriodPreset = {
  id: string
  label: string
  /** YYYY-MM-DD */
  from: string
  /** YYYY-MM-DD */
  to: string
}
