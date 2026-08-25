/**
 * @file Мок выгрузки проходов в вуз (СКУД).
 * @remarks Студент: Мишичкин Г.Д. Позже — из системы контроля доступа.
 */

import type { AttendanceDay, AttendancePeriodPreset } from './attendance-types'

/** Быстрый выбор периода */
export const attendancePeriodPresets: AttendancePeriodPreset[] = [
  { id: '2026-05', label: 'Май 2026', from: '2026-05-01', to: '2026-05-31' },
  { id: '2026-spring', label: 'Весенний семестр 2026', from: '2026-02-01', to: '2026-06-30' },
  { id: '2026-week', label: 'Текущая неделя (мок)', from: '2026-05-19', to: '2026-05-25' },
  { id: 'custom', label: 'Свой период', from: '', to: '' },
]

const days: AttendanceDay[] = [
  { id: 'd-0602', date: '2026-06-02', checkIn: '08:42', checkOut: '16:35', gate: 'КПП-1, главный корпус' },
  { id: 'd-0530', date: '2026-05-30', checkIn: '09:05', checkOut: '15:10', gate: 'КПП-1, главный корпус' },
  { id: 'd-0529', date: '2026-05-29', checkIn: '08:55', checkOut: '17:02', gate: 'КПП-2, корпус Б' },
  { id: 'd-0528', date: '2026-05-28', checkIn: '08:38', checkOut: '14:50', gate: 'КПП-1, главный корпус' },
  { id: 'd-0527', date: '2026-05-27', checkIn: '10:12', checkOut: '16:40', gate: 'КПП-1, главный корпус' },
  { id: 'd-0526', date: '2026-05-26', checkIn: '08:50', checkOut: '18:05', gate: 'КПП-1, главный корпус' },
  { id: 'd-0523', date: '2026-05-23', checkIn: '08:47', checkOut: '15:55', gate: 'КПП-1, главный корпус' },
  { id: 'd-0522', date: '2026-05-22', checkIn: '08:41', checkOut: '17:45', gate: 'КПП-2, корпус Б' },
  { id: 'd-0521', date: '2026-05-21', checkIn: '09:18', checkOut: '14:20', gate: 'КПП-1, главный корпус' },
  { id: 'd-0520', date: '2026-05-20', checkIn: '08:36', checkOut: '16:10', gate: 'КПП-1, главный корпус' },
  { id: 'd-0519', date: '2026-05-19', checkIn: '08:44', checkOut: '15:30', gate: 'КПП-1, главный корпус' },
  { id: 'd-0516', date: '2026-05-16', checkIn: '08:52', checkOut: '13:40', gate: 'КПП-1, главный корпус' },
  { id: 'd-0515', date: '2026-05-15', checkIn: '08:39', checkOut: '16:55', gate: 'КПП-2, корпус Б' },
  { id: 'd-0514', date: '2026-05-14', checkIn: '08:48', checkOut: '15:05', gate: 'КПП-1, главный корпус' },
  { id: 'd-0513', date: '2026-05-13', checkIn: '08:33', checkOut: '17:20', gate: 'КПП-1, главный корпус' },
  { id: 'd-0512', date: '2026-05-12', checkIn: '09:02', checkOut: '14:45', gate: 'КПП-1, главный корпус' },
  { id: 'd-0508', date: '2026-05-08', checkIn: '08:40', checkOut: '16:00', gate: 'КПП-1, главный корпус' },
  { id: 'd-0507', date: '2026-05-07', checkIn: '08:55', checkOut: '15:40', gate: 'КПП-2, корпус Б' },
  { id: 'd-0506', date: '2026-05-06', checkIn: '08:37', checkOut: '17:10', gate: 'КПП-1, главный корпус' },
  { id: 'd-0430', date: '2026-04-30', checkIn: '08:45', checkOut: '15:25', gate: 'КПП-1, главный корпус' },
  { id: 'd-0429', date: '2026-04-29', checkIn: '09:10', checkOut: '14:55', gate: 'КПП-1, главный корпус' },
  { id: 'd-0428', date: '2026-04-28', checkIn: '08:50', checkOut: '16:30', gate: 'КПП-2, корпус Б' },
  { id: 'd-0427', date: '2026-04-27', checkIn: '08:42', checkOut: '13:15', gate: 'КПП-1, главный корпус' },
  { id: 'd-0424', date: '2026-04-24', checkIn: '08:58', checkOut: '15:50', gate: 'КПП-1, главный корпус' },
  { id: 'd-0422', date: '2026-04-22', checkIn: '08:35', checkOut: '16:20', gate: 'КПП-1, главный корпус' },
  { id: 'd-0315', date: '2026-03-15', checkIn: '09:25', checkOut: '14:40', gate: 'КПП-1, главный корпус' },
  { id: 'd-0314', date: '2026-03-14', checkIn: '08:40', checkOut: '15:35', gate: 'КПП-2, корпус Б' },
  { id: 'd-0313', date: '2026-03-13', checkIn: '08:46', checkOut: '17:00', gate: 'КПП-1, главный корпус' },
]

/**
 * Выгрузка проходов за выбранный диапазон дат (включительно).
 */
export function filterAttendanceDays(from: string, to: string): AttendanceDay[] {
  if (!from || !to) return []
  const start = from <= to ? from : to
  const end = from <= to ? to : from
  return days
    .filter((d) => d.date >= start && d.date <= end)
    .sort((a, b) => b.date.localeCompare(a.date))
}

/**
 * @param iso - `YYYY-MM-DD`
 */
export function formatAttendanceDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  const weekday = new Intl.DateTimeFormat('ru-RU', { weekday: 'short' }).format(new Date(y, m - 1, d))
  const date = new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(y, m - 1, d))
  return `${weekday}, ${date}`
}

/** Длительность пребывания на территории */
export function formatStayDuration(checkIn: string, checkOut: string): string {
  const [ih, im] = checkIn.split(':').map(Number)
  const [oh, om] = checkOut.split(':').map(Number)
  const minutes = oh * 60 + om - (ih * 60 + im)
  if (minutes <= 0) return '—'
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m} мин`
  if (m === 0) return `${h} ч`
  return `${h} ч ${m} мин`
}

export function attendanceSummaryForRange(from: string, to: string): {
  days: number
  earliest: string | null
  latest: string | null
} {
  const rows = filterAttendanceDays(from, to)
  if (rows.length === 0) {
    return { days: 0, earliest: null, latest: null }
  }
  let earliest = rows[0].checkIn
  let latest = rows[0].checkOut
  for (const row of rows) {
    if (row.checkIn < earliest) earliest = row.checkIn
    if (row.checkOut > latest) latest = row.checkOut
  }
  return { days: rows.length, earliest, latest }
}
