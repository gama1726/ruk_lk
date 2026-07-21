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
    hours: 144,
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
    hours: 108,
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
    hours: 72,
    grade: null,
    points: null,
    teacher: 'Петров Д.С.',
    date: null,
    status: 'not_graded',
  },
  {
    id: 'g3d1',
    programId: 'b-2023',
    semester: 5,
    subject: 'Экономика организации',
    controlForm: 'зачёт',
    hours: 72,
    grade: 'не зачтено',
    points: null,
    teacher: 'Морозова Л.К.',
    date: '2026-06-12',
    status: 'failed',
  },
  {
    id: 'g3d2',
    programId: 'b-2023',
    semester: 4,
    subject: 'Философия',
    controlForm: 'экзамен',
    hours: 108,
    grade: 'неудовлетворительно',
    points: 2,
    teacher: 'Иванов А.П.',
    date: '2026-01-20',
    status: 'failed',
  },
  {
    id: 'g3d3',
    programId: 'b-2023',
    semester: 4,
    subject: 'История России',
    controlForm: 'зачёт',
    hours: 72,
    grade: 'неявка',
    points: null,
    teacher: 'Сидорова Н.В.',
    date: '2026-01-15',
    status: 'failed',
  },
  {
    id: 'g4',
    programId: 'b-2023',
    semester: 4,
    subject: 'Экономика организации',
    controlForm: 'зачёт',
    hours: 72,
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
    hours: 108,
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
    hours: 72,
    grade: 'зачтено',
    points: null,
    teacher: 'Волкова Н.П.',
    date: '2026-01-12',
    status: 'passed',
  },
  {
    id: 'g7',
    programId: 'm-2025',
    semester: 1,
    subject: 'Стратегический менеджмент',
    controlForm: 'экзамен',
    hours: 108,
    grade: 'отлично',
    points: 5,
    teacher: 'Волкова Н.П., Кудинова Т.В.',
    date: '2026-01-15',
    status: 'excellent',
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
 * Семестры программы для переключателя.
 * @param programId - id записи об обучении
 */
export function semestersForProgram(programId: string): number[] {
  const set = new Set(grades.filter((g) => g.programId === programId).map((g) => g.semester))
  return [...set].sort((a, b) => a - b)
}

/**
 * Оценки одного семестра.
 * @param programId - id программы
 * @param semester - номер семестра
 */
export function gradesForSemester(programId: string, semester: number): GradeRow[] {
  return grades
    .filter((g) => g.programId === programId && g.semester === semester)
    .sort((a, b) => (a.date ?? '').localeCompare(b.date ?? ''))
}

export {
  formatControlForm,
  formatGradeCell,
  formatGradeDate,
  formatHours,
  formatRecordDate,
} from '@/record-book-format'
