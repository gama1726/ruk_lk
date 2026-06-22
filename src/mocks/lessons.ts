/**
 * @file Мок расписания.
 * @see {@link lessonsOnDate}, {@link lessonsInWeek}, {@link todayLessons}
 */

import type { Lesson } from './lesson-types'

/** «Сегодня» в демо-режиме — пятница, 19 июня 2026 */
export const DEMO_TODAY = '2026-06-19'

/** Условное «сейчас» для ближайшей пары на главной */
const DEMO_NOW = '11:45'

/**
 * @param iso - `YYYY-MM-DD`
 * @returns локальная дата без сдвига по UTC
 */
function parseLocal(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

/** @param iso - `YYYY-MM-DD` */
export function parseLessonDate(iso: string): Date {
  return parseLocal(iso)
}

/** @param date - локальная дата */
function toIsoLocal(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

const schedule: Lesson[] = [
  {
    id: 'l-mon',
    programId: 'b-2023',
    date: '2026-06-16',
    subject: 'Правовое регулирование',
    kind: 'лекция',
    start: '10:40',
    end: '12:00',
    room: 'А-108',
    teacher: 'Никитина О.В.',
    status: 'scheduled',
  },
  {
    id: 'l-tue',
    programId: 'b-2023',
    date: '2026-06-17',
    subject: 'Экономика организации',
    kind: 'практика',
    start: '12:10',
    end: '13:30',
    room: 'Б-205',
    teacher: 'Морозова Л.К.',
    status: 'scheduled',
  },
  {
    id: 'l-wed',
    programId: 'b-2023',
    date: '2026-06-18',
    subject: 'Проектирование информационных систем',
    kind: 'лабораторная',
    start: '14:00',
    end: '15:20',
    room: 'В-201',
    teacher: 'Смирнова Е.А.',
    status: 'scheduled',
  },
  {
    id: 'l1',
    programId: 'b-2023',
    date: DEMO_TODAY,
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
    date: DEMO_TODAY,
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
    date: DEMO_TODAY,
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
    date: DEMO_TODAY,
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
    date: DEMO_TODAY,
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
    id: 'm-wed',
    programId: 'm-2025',
    date: '2026-06-18',
    subject: 'Управление цифровыми проектами',
    kind: 'консультация',
    start: '16:00',
    end: '17:30',
    room: 'Г-012',
    teacher: 'Волкова Н.П.',
    status: 'scheduled',
  },
  {
    id: 'l-sun22',
    programId: 'b-2023',
    date: '2026-06-22',
    subject: 'Информационные системы и базы данных',
    kind: 'консультация',
    start: '18:00',
    end: '19:30',
    room: '—',
    teacher: 'Смирнова Е.А.',
    status: 'remote',
    note: 'Дистанционно (СДО)',
  },
  {
    id: 'm1',
    programId: 'm-2025',
    date: DEMO_TODAY,
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
 * Понедельник недели, в которую попадает дата.
 * @param iso - `YYYY-MM-DD`
 * @returns ISO понедельника той же недели
 */
export function mondayOf(iso: string): string {
  const d = parseLocal(iso)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  return toIsoLocal(d)
}

/**
 * Семь дат недели, начиная с понедельника.
 * @param weekStart - ISO понедельника
 */
export function weekDays(weekStart: string): string[] {
  const start = parseLocal(weekStart)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    return toIsoLocal(d)
  })
}

/**
 * Пары на конкретный день.
 * @param programId - id программы
 * @param date - `YYYY-MM-DD`
 */
export function lessonsOnDate(programId: string, date: string): Lesson[] {
  return schedule
    .filter((l) => l.programId === programId && l.date === date)
    .sort((a, b) => a.start.localeCompare(b.start))
}

/**
 * Все пары программы за неделю.
 * @param programId - id программы
 * @param weekStart - ISO понедельника
 */
export function lessonsInWeek(programId: string, weekStart: string): Lesson[] {
  const days = new Set(weekDays(weekStart))
  return schedule
    .filter((l) => l.programId === programId && days.has(l.date))
    .sort((a, b) => a.date.localeCompare(b.date) || a.start.localeCompare(b.start))
}

/**
 * Пары на «сегодня» в демо.
 * @param programId - id программы
 */
export function todayLessons(programId: string): Lesson[] {
  return lessonsOnDate(programId, DEMO_TODAY)
}

/**
 * Ближайшая предстоящая пара на сегодня.
 * @param programId - id программы
 */
export function pickNextLesson(programId: string): Lesson | null {
  const day = todayLessons(programId)
    .filter((l) => l.status !== 'cancelled' && l.start > DEMO_NOW)
    .sort((a, b) => a.start.localeCompare(b.start))

  return day[0] ?? null
}

/**
 * Подпись диапазона недели для шапки.
 * @param weekStart - ISO понедельника
 */
export function weekCaption(weekStart: string): string {
  const days = weekDays(weekStart)
  const fmt = (iso: string) =>
    new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short' }).format(parseLocal(iso))
  return `${fmt(days[0])} — ${fmt(days[6])}`
}

const weekdayShort = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'] as const

/**
 * Короткая подпись дня: «пт, 19 июн».
 * @param iso - `YYYY-MM-DD`
 */
export function dayCaption(iso: string): string {
  const d = parseLocal(iso)
  const wd = weekdayShort[d.getDay()]
  const rest = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short' }).format(d)
  return `${wd}, ${rest}`
}

/**
 * Сдвигает неделю на ±7 дней.
 * @param weekStart - текущий понедельник
 * @param delta - `-1` назад, `1` вперёд
 */
export function shiftWeek(weekStart: string, delta: number): string {
  const d = parseLocal(weekStart)
  d.setDate(d.getDate() + delta * 7)
  return toIsoLocal(d)
}

/** Ячейка месячного календаря */
export type CalendarCell = {
  date: string
  inMonth: boolean
}

/**
 * Сетка календаря: понедельник — первый столбец.
 * @param year - полный год
 * @param month - месяц 0–11
 */
export function calendarMonth(year: number, month: number): CalendarCell[] {
  const first = new Date(year, month, 1)
  const startPad = (first.getDay() + 6) % 7
  const gridStart = new Date(year, month, 1 - startPad)
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(gridStart)
    d.setDate(gridStart.getDate() + i)
    return { date: toIsoLocal(d), inMonth: d.getMonth() === month }
  })
}

/**
 * Подпись месяца для шапки календаря.
 * @param year - год
 * @param month - месяц 0–11
 */
export function monthCaption(year: number, month: number): string {
  const raw = new Intl.DateTimeFormat('ru-RU', { month: 'short', year: 'numeric' }).format(
    new Date(year, month, 1),
  )
  return raw.replace('.', '.')
}

/**
 * Сдвиг месяца в календаре.
 * @param year - текущий год
 * @param month - текущий месяц 0–11
 * @param delta - `-1` | `1`
 */
export function shiftMonth(year: number, month: number, delta: number): { year: number; month: number } {
  const d = new Date(year, month + delta, 1)
  return { year: d.getFullYear(), month: d.getMonth() }
}

/**
 * Количество пар по дням месяца (для точек в календаре).
 * @param programId - id программы
 * @param year - год
 * @param month - месяц 0–11
 */
export function lessonCountsInMonth(programId: string, year: number, month: number): Map<string, number> {
  const counts = new Map<string, number>()
  for (const lesson of schedule) {
    if (lesson.programId !== programId) continue
    const d = parseLocal(lesson.date)
    if (d.getFullYear() !== year || d.getMonth() !== month) continue
    counts.set(lesson.date, (counts.get(lesson.date) ?? 0) + 1)
  }
  return counts
}

/**
 * Заголовок дня в сетке расписания.
 * @param iso - `YYYY-MM-DD`
 */
export function dayGridTitle(iso: string): string {
  const d = parseLocal(iso)
  const weekday = new Intl.DateTimeFormat('ru-RU', { weekday: 'long' }).format(d)
  return weekday.charAt(0).toUpperCase() + weekday.slice(1)
}
