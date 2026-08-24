/**
 * @file Типы электронного журнала (текущий контроль).
 * @remarks Позже заменится DTO из 1С.
 */

/** Вид занятия в журнале */
export type JournalLessonKind = 'лекция' | 'практика' | 'лабораторная' | 'семинар' | 'контроль'

/** Запись в журнале по одному занятию */
export type JournalEntry = {
  id: string
  programId: string
  subject: string
  date: string
  kind: JournalLessonKind
  topic: string
  teacher: string
  /** Балл или оценка; null — ещё не выставлено */
  mark: number | null
  /** Максимум баллов за занятие */
  maxPoints: number
}

/** Сводка по дисциплине */
export type JournalSubjectSummary = {
  subject: string
  average: number | null
  graded: number
  total: number
  lastMark: number | null
}
