/**
 * @file Мок расписания на сегодня.
 * @see {@link todayLessons}, {@link pickNextLesson}
 */

import type { Lesson } from './lesson-types'

/** Условное «сейчас» для демо ближайшей пары */
const DEMO_NOW = '11:45'

const schedule: Lesson[] = [
  {
    id: 'l1',
    programId: 'b-2023',
    subject: 'Информационная безопасность',
    kind: 'лекция',
    start: '09:00',
    end: '10:20',
    room: 'А-204',
    teacher: 'Козлов В.И.',
    status: 'scheduled',
  },
  {
    id: 'l2',
    programId: 'b-2023',
    subject: 'Базы данных',
    kind: 'практика',
    start: '10:40',
    end: '12:00',
    room: 'Б-311',
    teacher: 'Смирнова Е.А.',
    status: 'rescheduled',
    note: 'Перенос на 14:00, ауд. Б-311',
  },
  {
    id: 'l3',
    programId: 'b-2023',
    subject: 'Web-технологии',
    kind: 'лабораторная',
    start: '12:10',
    end: '13:30',
    room: 'В-102',
    teacher: 'Петров Д.С.',
    status: 'cancelled',
    note: 'Занятие отменено по уважительной причине',
  },
  {
    id: 'l4',
    programId: 'b-2023',
    subject: 'Базы данных',
    kind: 'практика',
    start: '14:00',
    end: '15:20',
    room: 'Б-311',
    teacher: 'Смирнова Е.А.',
    status: 'rescheduled',
    note: 'Перенесённое занятие',
  },
  {
    id: 'l5',
    programId: 'b-2023',
    subject: 'Защита информации',
    kind: 'лекция',
    start: '15:30',
    end: '17:00',
    room: '—',
    teacher: 'Козлов В.И.',
    status: 'remote',
    note: 'Ссылка в электронной школе',
  },
  {
    id: 'm1',
    programId: 'm-2025',
    subject: 'Управление цифровыми проектами',
    kind: 'лекция',
    start: '18:00',
    end: '19:30',
    room: 'Г-015',
    teacher: 'Волкова Н.П.',
    status: 'scheduled',
  },
]

/**
 * Пары на сегодня для выбранной программы.
 * @param programId - {@link StudyProgram.id}
 */
export function todayLessons(programId: string): Lesson[] {
  return schedule.filter((l) => l.programId === programId)
}

/**
 * Ближайшая предстоящая пара: после {@link DEMO_NOW}, не отменённая.
 * @param programId - id программы
 * @returns пара или `null`, если на сегодня больше ничего нет
 */
export function pickNextLesson(programId: string): Lesson | null {
  const day = todayLessons(programId)
    .filter((l) => l.status !== 'cancelled' && l.start > DEMO_NOW)
    .sort((a, b) => a.start.localeCompare(b.start))

  return day[0] ?? null
}
