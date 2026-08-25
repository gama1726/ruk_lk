/**
 * @file Мок сводного электронного журнала (как на дизайн-макете).
 * @remarks Заменится ответом API 1С. Студент: Мишичкин Г.Д.
 */

import type {
  JournalPassStatus,
  JournalSemester,
  JournalSubjectRow,
  JournalSummary,
} from './e-journal-types'

export const journalStudentName = 'Мишичкин Г.Д.'
export const journalStudentFullName = 'Мишичкин Георгий Дмитриевич'

export const journalSemesters: JournalSemester[] = [
  { id: '2026-spring', label: 'Весенний 2026' },
  { id: '2025-fall', label: 'Осенний 2025' },
]

const rows: JournalSubjectRow[] = [
  {
    id: 'mkt',
    name: 'Маркетинг',
    teacher: 'Петров И.И.',
    lastDate: '2026-05-20',
    attendancePercent: 95,
    grades: [5, 4, 5, 4, 5],
    finalScore: 4.6,
    status: 'passed',
    semesterId: '2026-spring',
    accent: 'purple',
  },
  {
    id: 'law',
    name: 'Право',
    teacher: 'Николаев Д.А.',
    lastDate: '2026-05-08',
    attendancePercent: 78,
    grades: [3, 4, 3, 4, 3],
    finalScore: 3.4,
    status: 'failed',
    semesterId: '2026-spring',
    accent: 'blue',
  },
  {
    id: 'web',
    name: 'Web-технологии',
    teacher: 'Петрова А.В.',
    lastDate: '2026-06-02',
    attendancePercent: 87,
    grades: [5, 4, 'н', 4, 5, 3, 5, 4],
    finalScore: 4.3,
    status: 'passed',
    semesterId: '2026-spring',
    accent: 'green',
  },
  {
    id: 'db',
    name: 'Базы данных',
    teacher: 'Сидоров И.Н.',
    lastDate: '2026-05-13',
    attendancePercent: 83,
    grades: [5, 4, 5, 'н', 2, 4, 5],
    finalScore: 4.2,
    status: 'in_progress',
    semesterId: '2026-spring',
    accent: 'orange',
  },
  {
    id: 'sec',
    name: 'Информационная безопасность',
    teacher: 'Козлов Д.С.',
    lastDate: '2026-05-14',
    attendancePercent: 91,
    grades: [4, 5, 'н', 4, 5, 3, 5, 4],
    finalScore: 4.3,
    status: 'passed',
    semesterId: '2026-spring',
    accent: 'pink',
  },
  {
    id: 'math',
    name: 'Дискретная математика',
    teacher: 'Иванова М.П.',
    lastDate: '2026-05-08',
    attendancePercent: 90,
    grades: [4, 5, 'н', 3, 4, 5, 4, 5],
    finalScore: 4.3,
    status: 'passed',
    semesterId: '2026-spring',
    accent: 'purple',
  },
  {
    id: 'pe',
    name: 'Физическая культура',
    teacher: 'Смирнов А.К.',
    lastDate: '2026-05-11',
    attendancePercent: 67,
    grades: ['з', 'н/б', 'з', 'нз', 'з'],
    finalScore: null,
    status: 'passed',
    semesterId: '2026-spring',
    accent: 'green',
  },
  {
    id: 'econ',
    name: 'Экономика организации',
    teacher: 'Орлова Е.М.',
    lastDate: '2026-04-28',
    attendancePercent: 88,
    grades: [4, 5, 4, 5, 4],
    finalScore: 4.4,
    status: 'passed',
    semesterId: '2026-spring',
    accent: 'blue',
  },
  {
    id: 'eng',
    name: 'Иностранный язык',
    teacher: 'Белова С.Н.',
    lastDate: '2026-05-22',
    attendancePercent: 96,
    grades: [5, 5, 4, 5, 5],
    finalScore: 4.8,
    status: 'passed',
    semesterId: '2026-spring',
    accent: 'pink',
  },
  {
    id: 'hist',
    name: 'История России',
    teacher: 'Кузнецов П.В.',
    lastDate: '2026-03-15',
    attendancePercent: 70,
    grades: [3, 3, 'н', 4, 3],
    finalScore: 3.3,
    status: 'failed',
    semesterId: '2026-spring',
    accent: 'orange',
  },
  {
    id: 'algo-fall',
    name: 'Алгоритмы и структуры данных',
    teacher: 'Морозов К.Л.',
    lastDate: '2025-12-18',
    attendancePercent: 94,
    grades: [5, 5, 4, 5, 4],
    finalScore: 4.6,
    status: 'passed',
    semesterId: '2025-fall',
    accent: 'purple',
  },
  {
    id: 'net-fall',
    name: 'Компьютерные сети',
    teacher: 'Васильев Р.О.',
    lastDate: '2025-12-10',
    attendancePercent: 85,
    grades: [4, 4, 5, 3, 4],
    finalScore: 4.0,
    status: 'passed',
    semesterId: '2025-fall',
    accent: 'blue',
  },
]

export function journalTeachers(semesterId: string): string[] {
  const set = new Set(
    rows.filter((r) => r.semesterId === semesterId).map((r) => r.teacher),
  )
  return [...set].sort((a, b) => a.localeCompare(b, 'ru'))
}

export function journalSubjects(semesterId: string): string[] {
  return rows
    .filter((r) => r.semesterId === semesterId)
    .map((r) => r.name)
    .sort((a, b) => a.localeCompare(b, 'ru'))
}

export function filterJournalRows(
  semesterId: string,
  subject: string,
  teacher: string,
): JournalSubjectRow[] {
  return rows
    .filter((r) => r.semesterId === semesterId)
    .filter((r) => (subject === 'all' ? true : r.name === subject))
    .filter((r) => (teacher === 'all' ? true : r.teacher === teacher))
    .sort((a, b) => a.name.localeCompare(b.name, 'ru'))
}

export function journalSummary(semesterId: string): JournalSummary {
  const list = rows.filter((r) => r.semesterId === semesterId)
  const scored = list.filter((r) => r.finalScore != null)
  const average =
    scored.length === 0
      ? 0
      : Math.round(
          (scored.reduce((sum, r) => sum + (r.finalScore ?? 0), 0) / scored.length) * 100,
        ) / 100
  const attendancePercent =
    list.length === 0
      ? 0
      : Math.round(list.reduce((sum, r) => sum + r.attendancePercent, 0) / list.length)
  const absences = list.reduce((sum, r) => {
    const missed = Math.round(((100 - r.attendancePercent) / 100) * Math.max(r.grades.length, 1))
    return sum + missed
  }, 0)
  const closed = list.filter((r) => r.status === 'passed').length

  // Дельта к прошлому семестру — фиксированная для мока
  const averageDelta = semesterId === '2026-spring' ? 0.35 : -0.12

  return {
    average,
    averageMax: 5,
    averageDelta,
    attendancePercent,
    absences,
    closed,
    total: list.length,
  }
}

export function formatJournalDate(iso: string): string {
  const [y, m, d] = iso.split('-')
  return `${d}.${m}.${y}`
}

export function statusLabel(status: JournalPassStatus): string {
  switch (status) {
    case 'passed':
      return 'Зачтено'
    case 'failed':
      return 'Не зачтено'
    case 'in_progress':
      return 'В процессе'
  }
}

export function attendanceLabel(percent: number): string {
  if (percent >= 90) return 'Отличная посещаемость'
  if (percent >= 75) return 'Хорошая посещаемость'
  if (percent >= 60) return 'Есть пропуски'
  return 'Низкая посещаемость'
}

export function gradeTone(grade: JournalSubjectRow['grades'][number]): string {
  if (grade === 5 || grade === 'з') return 'great'
  if (grade === 4) return 'good'
  if (grade === 3) return 'mid'
  if (grade === 2 || grade === 'нз') return 'fail'
  if (grade === 'н' || grade === 'н/б') return 'absent'
  return 'mid'
}
