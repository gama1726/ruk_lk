/**
 * @file Типы электронного журнала (аналог бумажного).
 * @remarks Позже заменится DTO из 1С.
 */

/** Вид занятия */
export type JournalLessonKind = 'лекция' | 'практика' | 'лабораторная' | 'семинар' | 'контроль'

/**
 * Отметка в клетке журнала.
 * - 2–5 — оценка
 * - `н` — неявка
 * - `н/б` — неявка по болезни
 * - `осв` — освобождён
 * - `з` / `нз` — зачёт / не зачёт
 * - `null` — пустая клетка
 */
export type JournalCellValue = 2 | 3 | 4 | 5 | 'н' | 'н/б' | 'осв' | 'з' | 'нз' | null

export type JournalSubjectSort = 'name' | 'average' | 'attention'

export type JournalMonthFilter = 'all' | `${number}-${string}`

/** Одна клетка / занятие в журнале */
export type JournalLesson = {
  id: string
  programId: string
  subjectId: string
  date: string
  kind: JournalLessonKind
  topic: string
  value: JournalCellValue
  comment?: string
}

/** Дисциплина в списке выбора */
export type JournalSubject = {
  id: string
  programId: string
  name: string
  teacher: string
  semesterLabel: string
}

/** Сводка по выбранной дисциплине */
export type JournalSubjectStats = {
  average: number | null
  gradesCount: number
  absences: number
  excused: number
  lessons: number
  empty: number
  attendancePercent: number | null
  /** Допуск к аттестации: true / false / null (недостаточно данных) */
  admitted: boolean | null
  hasFail: boolean
  needsAttention: boolean
}
