/**
 * @file Типы преподавателей.
 */

export type Teacher = {
  id: string
  programId: string
  name: string
  department: string
  subjects: string[]
  email: string
  /** Например: «вт 14:00–16:00, ауд. Б-311» */
  consultation: string
}
