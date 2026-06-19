/**
 * @file Типы для расписания на главной и в разделе «Расписание».
 */

/** Вид занятия */
export type LessonKind = 'лекция' | 'практика' | 'лабораторная' | 'консультация' | 'экзамен'

/** Статус пары в сетке */
export type LessonStatus = 'scheduled' | 'rescheduled' | 'cancelled' | 'remote'

/**
 * Одна пара в расписании.
 */
export type Lesson = {
  id: string
  /** {@link StudyProgram.id} */
  programId: string
  /** День пары, `YYYY-MM-DD` */
  date: string
  subject: string
  kind: LessonKind
  /** `ЧЧ:ММ`, локальное время */
  start: string
  end: string
  room: string
  teacher: string
  status: LessonStatus
  /** Пояснение при переносе или отмене */
  note?: string
}

/** Подписи статусов для UI */
export const lessonStatusLabel: Record<LessonStatus, string> = {
  scheduled: 'по расписанию',
  rescheduled: 'перенесено',
  cancelled: 'отменено',
  remote: 'дистанционно',
}
