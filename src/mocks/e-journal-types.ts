/**
 * @file Типы электронного журнала (аналог бумажного).
 * @remarks Позже заменится DTO из 1С.
 */

/** Вид занятия */
export type JournalLessonKind = 'лекция' | 'практика' | 'лабораторная' | 'семинар' | 'контроль'

/**
 * Отметка в клетке журнала.
 * - оценка 2–5
 * - `н` — неявка
 * - `null` — клетка пустая (занятие было, отметки нет)
 */
export type JournalCellValue = 2 | 3 | 4 | 5 | 'н' | null

/** Одна клетка / занятие в журнале */
export type JournalLesson = {
  id: string
  programId: string
  subjectId: string
  date: string
  kind: JournalLessonKind
  topic: string
  value: JournalCellValue
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
  lessons: number
  empty: number
}
