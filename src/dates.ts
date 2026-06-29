/**
 * @file Утилиты для локальных дат `YYYY-MM-DD` (без сдвига UTC).
 */

/** `YYYY-MM-DD` → локальная Date */
export function parseIsoDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

/** Локальная Date → `YYYY-MM-DD` */
export function formatIsoDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** Количество дней в месяце (`month`: 0–11). */
export function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate()
}

/**
 * Тот же номер дня в целевом месяце; если дня нет — последний день месяца.
 * 31.12 → ноябрь → 30.11; 29.03 → февраль → 28.02 (или 29.02 в високосный).
 */
export function sameDayInMonth(referenceIso: string, targetYear: number, targetMonth: number): string {
  const day = parseIsoDate(referenceIso).getDate()
  const clamped = Math.min(day, daysInMonth(targetYear, targetMonth))
  return formatIsoDate(new Date(targetYear, targetMonth, clamped))
}

/**
 * Сдвиг месяца в календаре.
 * @param month — месяц 0–11
 * @param delta — `-1` | `1`
 */
export function shiftMonth(
  year: number,
  month: number,
  delta: number,
): { year: number; month: number } {
  const d = new Date(year, month + delta, 1)
  return { year: d.getFullYear(), month: d.getMonth() }
}

/** Сдвиг месяца с сохранением номера дня (с ограничением по длине месяца). */
export function shiftMonthKeepingDay(
  pickedIso: string,
  delta: -1 | 1,
): { year: number; month: number; picked: string } {
  const current = parseIsoDate(pickedIso)
  const shifted = shiftMonth(current.getFullYear(), current.getMonth(), delta)
  return {
    ...shifted,
    picked: sameDayInMonth(pickedIso, shifted.year, shifted.month),
  }
}

/** Локальная дата сегодня в формате `YYYY-MM-DD`. */
export function todayIso(): string {
  return formatIsoDate(new Date())
}
