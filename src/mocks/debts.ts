/**
 * @file Устаревший мок задолженностей.
 * @deprecated Долги берутся из failed-строк зачётки ({@link academicDebtsFromRows}).
 */

export type Debt = {
  id: string
  programId: string
  subject: string
  teacher: string
  controlForm: string
  retakeUntil: string
  status: 'active' | 'closed'
}
