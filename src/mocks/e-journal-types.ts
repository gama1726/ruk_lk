/**
 * @file Типы сводного электронного журнала.
 * @remarks Позже заменится DTO из 1С.
 */

export type JournalPassStatus = 'passed' | 'failed' | 'in_progress'

export type JournalSubjectRow = {
  id: string
  name: string
  teacher: string
  /** YYYY-MM-DD — дата последней отметки */
  lastDate: string
  attendancePercent: number
  /** Текущие оценки / отметки для бейджей */
  grades: Array<2 | 3 | 4 | 5 | 'н' | 'н/б' | 'з' | 'нз'>
  finalScore: number | null
  status: JournalPassStatus
  semesterId: string
  accent: 'purple' | 'blue' | 'green' | 'orange' | 'pink'
}

export type JournalSummary = {
  average: number
  averageMax: number
  averageDelta: number
  attendancePercent: number
  absences: number
  closed: number
  total: number
}

export type JournalSemester = {
  id: string
  label: string
}
