/**
 * @file Типы сводного электронного журнала.
 * @remarks Позже заменится DTO из 1С.
 */

export type JournalPassStatus = 'passed' | 'failed' | 'in_progress'

export type JournalCellValue = 2 | 3 | 4 | 5 | 'н' | 'н/б' | 'осв' | 'з' | 'нз' | null

export type JournalLessonKind = 'лекция' | 'практика' | 'лабораторная' | 'консультация' | 'экзамен'

/** Одно занятие дисциплины с отметкой */
export type JournalLesson = {
  id: string
  subjectId: string
  /** YYYY-MM-DD */
  date: string
  kind: JournalLessonKind
  topic: string
  value: JournalCellValue
  comment?: string
}

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

/** Ближайшее занятие в боковой панели журнала */
export type JournalUpcomingLesson = {
  id: string
  /** YYYY-MM-DD */
  date: string
  subject: string
  start: string
  end: string
  room: string
  teacher: string
}

export type JournalAttentionKind = 'failed' | 'attendance' | 'grade'

/** Предупреждение в блоке «Требует внимания» */
export type JournalAttentionItem = {
  id: string
  kind: JournalAttentionKind
  title: string
  subject: string
  detail?: string
  /** Относительная подпись времени */
  time: string
  accent: 'purple' | 'orange' | 'pink' | 'green'
}
