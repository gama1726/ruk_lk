/**
 * @file Академические задолженности = failed-строки зачётки
 * (неявка, неудовлетворительно, не зачтено).
 */

import type { GradeRow } from '@/mocks/record-book-types'

/** Запись, считающаяся академическим долгом. */
export function isAcademicDebt(row: GradeRow): boolean {
  return row.status === 'failed'
}

/** Открытые академические задолженности из строк успеваемости. */
export function academicDebtsFromRows(rows: GradeRow[]): GradeRow[] {
  return rows.filter(isAcademicDebt).sort((a, b) => {
    const sem = b.semester - a.semester
    if (sem !== 0) return sem
    return (a.subject || '').localeCompare(b.subject || '', 'ru')
  })
}

/** Подпись оценки для UI (как пришло из 1С или статус). */
export function debtGradeLabel(row: GradeRow): string {
  if (row.grade && row.grade.trim()) {
    return row.grade.trim()
  }
  return 'не зачтено'
}
