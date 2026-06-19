/**
 * @file Академические предупреждения (мок).
 */

export type Warning = {
  id: string
  programId: string
  text: string
  level: 'info' | 'warning'
}

const warnings: Warning[] = [
  {
    id: 'w1',
    programId: 'b-2023',
    text: 'Посещаемость по «Web-технологии» ниже 70% — есть риск допуска к экзамену.',
    level: 'warning',
  },
]

/**
 * Предупреждения для выбранной программы.
 * @param programId - id записи об обучении
 */
export function programWarnings(programId: string): Warning[] {
  return warnings.filter((w) => w.programId === programId)
}
