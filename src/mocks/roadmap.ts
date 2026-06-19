/**
 * @file Траектория обучения — статусы дисциплин по семестрам.
 */

/** Статус дисциплины на дорожной карте */
export type RoadmapStatus = 'done' | 'now' | 'ahead' | 'risk'

export const roadmapStatusLabel: Record<RoadmapStatus, string> = {
  done: 'завершено',
  now: 'текущий семестр',
  ahead: 'впереди',
  risk: 'есть риски',
}

export type RoadmapItem = {
  id: string
  programId: string
  semester: number
  subject: string
  status: RoadmapStatus
  note?: string
}

const items: RoadmapItem[] = [
  { id: 'r1', programId: 'b-2023', semester: 1, subject: 'Математика', status: 'done' },
  { id: 'r2', programId: 'b-2023', semester: 2, subject: 'Программирование', status: 'done' },
  { id: 'r3', programId: 'b-2023', semester: 3, subject: 'Операционные системы', status: 'done' },
  { id: 'r4', programId: 'b-2023', semester: 4, subject: 'Экономика организации', status: 'done' },
  { id: 'r5', programId: 'b-2023', semester: 5, subject: 'Базы данных', status: 'now' },
  { id: 'r6', programId: 'b-2023', semester: 5, subject: 'Web-технологии', status: 'risk', note: 'Низкая посещаемость, нет итоговой оценки' },
  { id: 'r7', programId: 'b-2023', semester: 5, subject: 'Информационная безопасность', status: 'now' },
  { id: 'r8', programId: 'b-2023', semester: 6, subject: 'Дипломная работа', status: 'ahead' },
  { id: 'r9', programId: 'm-2025', semester: 1, subject: 'Управление цифровыми проектами', status: 'now' },
  { id: 'r10', programId: 'm-2025', semester: 2, subject: 'Лидерство в цифровой среде', status: 'ahead' },
]

/**
 * Текущий семестр студента по программе (из мока курса).
 * @param programId - id программы
 * @param course - курс обучения
 */
export function currentSemester(programId: string, course: number): number {
  if (programId === 'm-2025') return 1
  return course * 2 - 1
}

/**
 * Элементы траектории, сгруппированные по семестрам.
 * @param programId - id программы
 */
export function roadmapByProgram(programId: string): Map<number, RoadmapItem[]> {
  const map = new Map<number, RoadmapItem[]>()

  for (const item of items.filter((i) => i.programId === programId)) {
    const list = map.get(item.semester) ?? []
    list.push(item)
    map.set(item.semester, list)
  }

  return new Map([...map.entries()].sort(([a], [b]) => a - b))
}
