/**
 * @file Мок посещаемости (приход / уход).
 * @remarks Студент: Мишичкин Г.Д. Позже заменится данными СКУД / 1С.
 */

import type { AttendanceLesson, AttendanceMark, AttendanceSummary } from './attendance-types'

const DEFAULT_PROGRAM = 'b-2023'

const lessons: AttendanceLesson[] = [
  {
    id: 'a-web-1',
    programId: 'b-2023',
    subject: 'Web-технологии',
    date: '2026-06-02',
    start: '14:00',
    end: '15:20',
    mark: 'present',
    checkIn: '13:54',
    checkOut: '15:18',
    room: 'В-102',
    teacher: 'Петрова А.В.',
  },
  {
    id: 'a-web-2',
    programId: 'b-2023',
    subject: 'Web-технологии',
    date: '2026-05-26',
    start: '14:00',
    end: '15:20',
    mark: 'late',
    checkIn: '14:17',
    checkOut: '15:19',
    room: 'В-102',
    teacher: 'Петрова А.В.',
    comment: 'Опоздание на 17 минут',
  },
  {
    id: 'a-web-3',
    programId: 'b-2023',
    subject: 'Web-технологии',
    date: '2026-05-19',
    start: '14:00',
    end: '15:20',
    mark: 'absent',
    checkIn: null,
    checkOut: null,
    room: 'В-102',
    teacher: 'Петрова А.В.',
  },
  {
    id: 'a-web-4',
    programId: 'b-2023',
    subject: 'Web-технологии',
    date: '2026-05-12',
    start: '14:00',
    end: '15:20',
    mark: 'present',
    checkIn: '13:58',
    checkOut: '15:15',
    room: 'В-102',
    teacher: 'Петрова А.В.',
  },
  {
    id: 'a-web-5',
    programId: 'b-2023',
    subject: 'Web-технологии',
    date: '2026-04-28',
    start: '14:00',
    end: '15:20',
    mark: 'excused',
    checkIn: null,
    checkOut: null,
    room: 'В-102',
    teacher: 'Петрова А.В.',
    comment: 'Справка по болезни',
  },
  {
    id: 'a-db-1',
    programId: 'b-2023',
    subject: 'Базы данных',
    date: '2026-05-13',
    start: '10:40',
    end: '12:00',
    mark: 'present',
    checkIn: '10:35',
    checkOut: '11:58',
    room: 'Б-311',
    teacher: 'Сидоров И.Н.',
  },
  {
    id: 'a-db-2',
    programId: 'b-2023',
    subject: 'Базы данных',
    date: '2026-05-06',
    start: '10:40',
    end: '12:00',
    mark: 'present',
    checkIn: '10:38',
    checkOut: '12:00',
    room: 'Б-311',
    teacher: 'Сидоров И.Н.',
  },
  {
    id: 'a-db-3',
    programId: 'b-2023',
    subject: 'Базы данных',
    date: '2026-04-29',
    start: '10:40',
    end: '12:00',
    mark: 'late',
    checkIn: '10:52',
    checkOut: '11:55',
    room: 'Б-311',
    teacher: 'Сидоров И.Н.',
  },
  {
    id: 'a-db-4',
    programId: 'b-2023',
    subject: 'Базы данных',
    date: '2026-04-22',
    start: '10:40',
    end: '12:00',
    mark: 'absent',
    checkIn: null,
    checkOut: null,
    room: 'Б-311',
    teacher: 'Сидоров И.Н.',
  },
  {
    id: 'a-sec-1',
    programId: 'b-2023',
    subject: 'Информационная безопасность',
    date: '2026-05-14',
    start: '09:00',
    end: '10:20',
    mark: 'present',
    checkIn: '08:55',
    checkOut: '10:18',
    room: 'А-204',
    teacher: 'Козлов Д.С.',
  },
  {
    id: 'a-sec-2',
    programId: 'b-2023',
    subject: 'Информационная безопасность',
    date: '2026-05-07',
    start: '09:00',
    end: '10:20',
    mark: 'late',
    checkIn: '09:12',
    checkOut: '10:20',
    room: 'А-204',
    teacher: 'Козлов Д.С.',
  },
  {
    id: 'a-sec-3',
    programId: 'b-2023',
    subject: 'Информационная безопасность',
    date: '2026-04-30',
    start: '09:00',
    end: '10:20',
    mark: 'present',
    checkIn: '08:57',
    checkOut: '10:15',
    room: 'А-204',
    teacher: 'Козлов Д.С.',
  },
  {
    id: 'a-mkt-1',
    programId: 'b-2023',
    subject: 'Маркетинг',
    date: '2026-05-20',
    start: '10:00',
    end: '11:30',
    mark: 'present',
    checkIn: '09:52',
    checkOut: '11:28',
    room: '405',
    teacher: 'Петров И.И.',
  },
  {
    id: 'a-mkt-2',
    programId: 'b-2023',
    subject: 'Маркетинг',
    date: '2026-05-13',
    start: '10:00',
    end: '11:30',
    mark: 'present',
    checkIn: '09:58',
    checkOut: '11:30',
    room: '405',
    teacher: 'Петров И.И.',
  },
  {
    id: 'a-law-1',
    programId: 'b-2023',
    subject: 'Право',
    date: '2026-05-08',
    start: '12:10',
    end: '13:30',
    mark: 'present',
    checkIn: '12:05',
    checkOut: '13:25',
    room: 'А-108',
    teacher: 'Николаев Д.А.',
  },
  {
    id: 'a-law-2',
    programId: 'b-2023',
    subject: 'Право',
    date: '2026-04-24',
    start: '12:10',
    end: '13:30',
    mark: 'absent',
    checkIn: null,
    checkOut: null,
    room: 'А-108',
    teacher: 'Николаев Д.А.',
  },
  {
    id: 'a-pe-1',
    programId: 'b-2023',
    subject: 'Физическая культура',
    date: '2026-05-11',
    start: '15:30',
    end: '17:00',
    mark: 'present',
    checkIn: '15:28',
    checkOut: '16:55',
    room: 'Спорткомплекс',
    teacher: 'Смирнов А.К.',
  },
  {
    id: 'a-pe-2',
    programId: 'b-2023',
    subject: 'Физическая культура',
    date: '2026-04-27',
    start: '15:30',
    end: '17:00',
    mark: 'excused',
    checkIn: null,
    checkOut: null,
    room: 'Спорткомплекс',
    teacher: 'Смирнов А.К.',
    comment: 'Освобождение',
  },
  {
    id: 'a-eng-1',
    programId: 'b-2023',
    subject: 'Иностранный язык',
    date: '2026-05-22',
    start: '16:00',
    end: '17:30',
    mark: 'present',
    checkIn: '15:55',
    checkOut: '17:28',
    room: 'Г-014',
    teacher: 'Белова С.Н.',
  },
  {
    id: 'a-hist-1',
    programId: 'b-2023',
    subject: 'История России',
    date: '2026-03-15',
    start: '11:00',
    end: '12:30',
    mark: 'late',
    checkIn: '11:18',
    checkOut: '12:25',
    room: 'А-015',
    teacher: 'Кузнецов П.В.',
  },
  {
    id: 'a-m1',
    programId: 'm-2025',
    subject: 'Управление цифровыми проектами',
    date: '2026-06-12',
    start: '18:00',
    end: '19:30',
    mark: 'present',
    checkIn: '17:52',
    checkOut: '19:28',
    room: 'Г-015',
    teacher: 'Волкова Н.П.',
  },
]

/** Доступные периоды в фильтре */
export const attendancePeriods = [
  { id: '2026-spring', label: 'Весенний семестр 2026' },
  { id: '2025-fall', label: 'Осенний семестр 2025' },
] as const

export type AttendancePeriod = (typeof attendancePeriods)[number]['id']

function lessonsForProgram(programId: string): AttendanceLesson[] {
  const list = lessons.filter((l) => l.programId === programId)
  if (list.length > 0) return list
  return lessons.filter((l) => l.programId === DEFAULT_PROGRAM)
}

function inPeriod(date: string, period: AttendancePeriod): boolean {
  if (period === '2026-spring') return date >= '2026-02-01' && date <= '2026-06-30'
  return date >= '2025-09-01' && date <= '2026-01-31'
}

/**
 * Список дисциплин программы для фильтра.
 */
export function attendanceSubjects(programId: string): string[] {
  const set = new Set(lessonsForProgram(programId).map((l) => l.subject))
  return [...set].sort((a, b) => a.localeCompare(b, 'ru'))
}

/**
 * Занятия с учётом фильтров.
 */
export function filterAttendance(
  programId: string,
  subject: string,
  period: AttendancePeriod,
): AttendanceLesson[] {
  return lessonsForProgram(programId)
    .filter((l) => subject === 'all' || l.subject === subject)
    .filter((l) => inPeriod(l.date, period))
    .sort((a, b) => b.date.localeCompare(a.date) || b.start.localeCompare(a.start))
}

/**
 * Сводка % посещаемости по дисциплинам.
 */
export function attendanceSummary(programId: string, period: AttendancePeriod): AttendanceSummary[] {
  const bySubject = new Map<string, AttendanceLesson[]>()

  for (const l of lessonsForProgram(programId).filter((x) => inPeriod(x.date, period))) {
    const list = bySubject.get(l.subject) ?? []
    list.push(l)
    bySubject.set(l.subject, list)
  }

  return [...bySubject.entries()]
    .map(([subject, rows]) => {
      const present = rows.filter((r) => r.mark === 'present' || r.mark === 'late').length
      const total = rows.length
      const percent = total === 0 ? 0 : Math.round((present / total) * 100)
      return { subject, percent, total, present }
    })
    .sort((a, b) => a.subject.localeCompare(b.subject, 'ru'))
}

/**
 * @param mark - отметка
 */
export function markStatusKey(mark: AttendanceMark): string {
  const map: Record<AttendanceMark, string> = {
    present: 'present',
    absent: 'absent',
    excused: 'processing',
    late: 'warning',
  }
  return map[mark]
}

/**
 * @param iso - `YYYY-MM-DD`
 */
export function formatAttendanceDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  return new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(y, m - 1, d))
}

/** Подпись факта прихода / ухода */
export function formatCheckTime(value: string | null): string {
  return value ?? '—'
}
