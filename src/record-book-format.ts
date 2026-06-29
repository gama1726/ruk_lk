/**
 * @file Форматирование строк зачётной книжки для UI.
 */

import type { GradeRow } from '@/mocks/record-book-types'

/**
 * @param iso - `YYYY-MM-DD` или `null`
 */
export function formatRecordDate(iso: string | null): string {
  if (!iso) return '—'
  const [y, m, d] = iso.split('-')
  return `${d}.${m}.${y}`
}

/**
 * Вид контроля с заглавной буквы.
 */
export function formatControlForm(form: string): string {
  if (!form) return '—'
  return form.charAt(0).toUpperCase() + form.slice(1)
}

/**
 * Ячейка «Оценка (балл)» как в портале.
 */
export function formatGradeCell(row: GradeRow): string {
  if (!row.grade) return '—'
  const text = row.grade.charAt(0).toUpperCase() + row.grade.slice(1)
  if (row.points != null && row.controlForm.includes('экзамен')) {
    return `${text} (${row.points})`
  }
  return text
}

/**
 * @param hours - количество часов
 */
export function formatHours(hours: number): string {
  return `${hours} ${hoursWord(hours)}`
}

function hoursWord(n: number): string {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod100 >= 11 && mod100 <= 14) return 'часов'
  if (mod10 === 1) return 'час'
  if (mod10 >= 2 && mod10 <= 4) return 'часа'
  return 'часов'
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
