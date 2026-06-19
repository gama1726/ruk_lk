/**
 * @file Типы учебного плана.
 */

/**
 * Дисциплина в учебном плане.
 */
export type PlanDiscipline = {
  id: string
  programId: string
  semester: number
  subject: string
  hours: number
  credits: number
  controlForm: string
}
