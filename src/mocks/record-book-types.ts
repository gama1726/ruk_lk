/**
 * @file Записи зачётной книжки и связанные вкладки.
 */

/** Итоговый статус по дисциплине */
export type GradeStatus =
  | 'passed'
  | 'excellent'
  | 'good'
  | 'satisfactory'
  | 'failed'
  | 'not_graded'

/** Подписи статусов в таблице */
export const gradeStatusLabel: Record<GradeStatus, string> = {
  passed: 'зачтено',
  excellent: 'отлично',
  good: 'хорошо',
  satisfactory: 'удовлетворительно',
  failed: 'не зачтено',
  not_graded: 'не выставлено',
}

/**
 * Строка вкладки «Зачётная книжка».
 */
export type GradeRow = {
  id: string
  programId: string
  semester: number
  subject: string
  controlForm: string
  /** Общее количество часов по дисциплине */
  hours: number
  grade: string | null
  points: number | null
  teacher: string
  date: string | null
  /** Дата из 1С в формате ДД.ММ.ГГГГ, если есть */
  displayDate?: string | null
  status: GradeStatus
  creditUnits?: number
  periodControl?: string | null
}

/** Запись БРС */
export type BrsRow = {
  id: string
  programId: string
  subject: string
  semester: number
  points: number
  maxPoints: number
  teacher: string
}

/** Практика */
export type PracticeRow = {
  id: string
  programId: string
  title: string
  place: string
  period: string
  supervisor: string
  grade: string
  status: GradeStatus
}

/** Курсовая работа */
export type CourseworkRow = {
  id: string
  programId: string
  subject: string
  topic: string
  supervisor: string
  defendedAt: string | null
  grade: string | null
  status: GradeStatus
}
