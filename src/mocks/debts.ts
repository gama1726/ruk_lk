/**
 * @file Академические задолженности (мок).
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

const debts: Debt[] = [
  {
    id: 'd1',
    programId: 'b-2023',
    subject: 'Экономика организации',
    teacher: 'Морозова Л.К.',
    controlForm: 'зачёт',
    retakeUntil: '2026-07-15',
    status: 'active',
  },
]

/**
 * Открытые задолженности по программе.
 * @param programId - id записи об обучении
 */
export function activeDebts(programId: string): Debt[] {
  return debts.filter((d) => d.programId === programId && d.status === 'active')
}

/**
 * Все задолженности программы (включая закрытые).
 * @param programId - id записи об обучении
 */
export function debtsByProgram(programId: string): Debt[] {
  return debts.filter((d) => d.programId === programId)
}

/**
 * @param iso - `YYYY-MM-DD`
 */
export function formatDebtDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  return new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }).format(
    new Date(y, m - 1, d),
  )
}
