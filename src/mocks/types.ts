/**
 * @file Типы доменной модели студента.
 * Общие контакты живут в {@link Student}, учебный контекст — в {@link StudyProgram}.
 */

/**
 * Уровень образования в записи студента.
 */
export type StudyLevel = 'Бакалавриат' | 'Магистратура'

/**
 * Одна запись об обучении.
 * У студента может быть несколько активных записей (например, бакалавриат и магистратура).
 */
export type StudyProgram = {
  /** Внутренний ключ для переключателя и моков, не показываем в UI */
  id: string
  /** Код записи в учётной системе, например `RUC-B-2023-0142` */
  recordCode: string
  /** Номер студенческого билета / личный номер по этой программе */
  cardNumber: string
  level: StudyLevel
  /** Направление подготовки */
  direction: string
  /** Учебная группа */
  group: string
  course: number
  /** очная, заочная и т.п. */
  form: string
  /** обучается, активный, академический отпуск… */
  status: string
  faculty: string
  department: string
}

/**
 * Студент РУК.
 * Контакты общие для аккаунта; группа, курс и кафедра зависят от выбранной {@link StudyProgram}.
 */
export type Student = {
  fullName: string
  /** Номер студенческого билета */
  studentId: string
  corporateEmail: string
  personalEmail: string
  /** Полный номер; перед показом — `maskPhone` из `mocks/format.ts` */
  phone: string
  gender: string
  /** ISO-дата рождения */
  birthDate: string
  /** бюджет, договор и т.п. */
  funding: string
  programs: StudyProgram[]
}
