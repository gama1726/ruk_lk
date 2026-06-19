/**
 * @file Мок зачётной книжки, БРС, практики и курсовых.
 */

import type { BrsRow, CourseworkRow, GradeRow, PracticeRow } from './record-book-types'

const grades: GradeRow[] = [
  {
    id: 'g1',
    programId: 'b-2023',
    semester: 5,
    subject: 'Информационная безопасность',
    controlForm: 'экзамен',
    grade: 'хорошо',
    points: 4,
    teacher: 'Козлов В.И.',
    date: '2026-06-10',
    status: 'good',
  },
  {
    id: 'g2',
    programId: 'b-2023',
    semester: 5,
    subject: 'Базы данных',
    controlForm: 'экзамен',
    grade: 'отлично',
    points: 5,
    teacher: 'Смирнова Е.А.',
    date: '2026-06-05',
    status: 'excellent',
  },
  {
    id: 'g3',
    programId: 'b-2023',
    semester: 5,
    subject: 'Web-технологии',
    controlForm: 'зачёт',
    grade: null,
    points: null,
    teacher: 'Петров Д.С.',
    date: null,
    status: 'not_graded',
  },
  {
    id: 'g4',
    programId: 'b-2023',
    semester: 4,
    subject: 'Экономика организации',
    controlForm: 'зачёт',
    grade: 'зачтено',
    points: null,
    teacher: 'Морозова Л.К.',
    date: '2025-12-20',
    status: 'passed',
  },
  {
    id: 'g5',
    programId: 'b-2023',
    semester: 4,
    subject: 'Правовое регулирование',
    controlForm: 'экзамен',
    grade: 'удовлетворительно',
    points: 3,
    teacher: 'Никитина О.В.',
    date: '2025-12-18',
    status: 'satisfactory',
  },
  {
    id: 'g6',
    programId: 'm-2025',
    semester: 1,
    subject: 'Управление цифровыми проектами',
    controlForm: 'зачёт',
    grade: 'зачтено',
    points: null,
    teacher: 'Волкова Н.П.',
    date: '2026-05-28',
    status: 'passed',
  },
]

const brs: BrsRow[] = [
  {
    id: 'b1',
    programId: 'b-2023',
    subject: 'Информационная безопасность',
    semester: 5,
    points: 78,
    maxPoints: 100,
    teacher: 'Козлов В.И.',
  },
  {
    id: 'b2',
    programId: 'b-2023',
    subject: 'Базы данных',
    semester: 5,
    points: 92,
    maxPoints: 100,
    teacher: 'Смирнова Е.А.',
  },
]

const practice: PracticeRow[] = [
  {
    id: 'p1',
    programId: 'b-2023',
    title: 'Учебная практика',
    place: 'Отдел ИТ, АО «Центркооп»',
    period: 'июнь 2025',
    supervisor: 'Смирнова Е.А.',
    grade: 'отлично',
    status: 'excellent',
  },
]

const coursework: CourseworkRow[] = [
  {
    id: 'c1',
    programId: 'b-2023',
    subject: 'Проектирование информационных систем',
    topic: 'Модуль учёта посещаемости в вузе',
    supervisor: 'Смирнова Е.А.',
    defendedAt: '2025-12-10',
    grade: 'хорошо',
    status: 'good',
  },
  {
    id: 'c2',
    programId: 'b-2023',
    subject: 'Web-технологии',
    topic: 'Личный кабинет студента',
    supervisor: 'Петров Д.С.',
    defendedAt: null,
    grade: null,
    status: 'not_graded',
  },
]

/**
 * Оценки зачётной книжки по программе, сгруппированные по семестрам.
 * @param programId - id записи об обучении
 */
export function gradesByProgram(programId: string): Map<number, GradeRow[]> {
  const rows = grades.filter((g) => g.programId === programId)
  const map = new Map<number, GradeRow[]>()

  for (const row of rows) {
    const list = map.get(row.semester) ?? []
    list.push(row)
    map.set(row.semester, list)
  }

  return new Map([...map.entries()].sort(([a], [b]) => b - a))
}

/**
 * @param programId - id программы
 */
export function brsByProgram(programId: string): BrsRow[] {
  return brs.filter((b) => b.programId === programId)
}

/**
 * @param programId - id программы
 */
export function practiceByProgram(programId: string): PracticeRow[] {
  return practice.filter((p) => p.programId === programId)
}

/**
 * @param programId - id программы
 */
export function courseworkByProgram(programId: string): CourseworkRow[] {
  return coursework.filter((c) => c.programId === programId)
}

/**
 * @param iso - `YYYY-MM-DD` или `null`
 */
export function formatGradeDate(iso: string | null): string {
  if (!iso) return '—'
  const [y, m, d] = iso.split('-').map(Number)
  return new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' }).format(
    new Date(y, m - 1, d),
  )
}
