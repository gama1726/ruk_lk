/**
 * @file Мок учебного плана по семестрам.
 */

import type { PlanDiscipline } from './study-plan-types'

const plan: PlanDiscipline[] = [
  { id: 'sp1', programId: 'b-2023', semester: 5, subject: 'Информационная безопасность', hours: 144, credits: 5, controlForm: 'экзамен' },
  { id: 'sp2', programId: 'b-2023', semester: 5, subject: 'Базы данных', hours: 136, credits: 4, controlForm: 'экзамен' },
  { id: 'sp3', programId: 'b-2023', semester: 5, subject: 'Web-технологии', hours: 108, credits: 3, controlForm: 'зачёт' },
  { id: 'sp4', programId: 'b-2023', semester: 5, subject: 'Защита информации', hours: 72, credits: 2, controlForm: 'экзамен' },
  { id: 'sp5', programId: 'b-2023', semester: 4, subject: 'Экономика организации', hours: 72, credits: 3, controlForm: 'зачёт' },
  { id: 'sp6', programId: 'b-2023', semester: 4, subject: 'Правовое регулирование', hours: 108, credits: 4, controlForm: 'экзамен' },
  { id: 'sp7', programId: 'b-2023', semester: 4, subject: 'Проектирование информационных систем', hours: 144, credits: 5, controlForm: 'курсовая + экзамен' },
  { id: 'sp8', programId: 'b-2023', semester: 6, subject: 'Управление кооперативными организациями', hours: 72, credits: 3, controlForm: 'зачёт' },
  { id: 'sp9', programId: 'b-2023', semester: 6, subject: 'Дипломная работа', hours: 216, credits: 6, controlForm: 'защита' },
  { id: 'mp1', programId: 'm-2025', semester: 1, subject: 'Управление цифровыми проектами', hours: 144, credits: 5, controlForm: 'экзамен' },
  { id: 'mp2', programId: 'm-2025', semester: 1, subject: 'Аналитика данных', hours: 108, credits: 4, controlForm: 'экзамен' },
  { id: 'mp3', programId: 'm-2025', semester: 2, subject: 'Лидерство в цифровой среде', hours: 72, credits: 3, controlForm: 'зачёт' },
]

/**
 * План по программе, сгруппированный по семестрам (новые сверху).
 * @param programId - id записи об обучении
 */
export function planByProgram(programId: string): Map<number, PlanDiscipline[]> {
  const map = new Map<number, PlanDiscipline[]>()

  for (const row of plan.filter((p) => p.programId === programId)) {
    const list = map.get(row.semester) ?? []
    list.push(row)
    map.set(row.semester, list)
  }

  return new Map([...map.entries()].sort(([a], [b]) => a - b))
}

/**
 * Сумма зачётных единиц программы.
 * @param programId - id программы
 */
export function planCreditsTotal(programId: string): number {
  return plan.filter((p) => p.programId === programId).reduce((s, p) => s + p.credits, 0)
}
