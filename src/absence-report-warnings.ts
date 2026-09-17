/**
 * @file Разбор warnings отчёта отсутствий по смысловым разделам.
 */

export type AbsenceWarningSection = {
  id: string
  title: string
  items: string[]
}

const NOT_FOUND = 'Группа не найдена в сервисе расписания'
const NO_LESSONS = 'нет очных пар на дату'

function splitGroupMessage(line: string, suffix: string): string | null {
  const marker = ': ' + suffix
  const idx = line.lastIndexOf(marker)
  if (idx <= 0) return null
  const group = line.slice(0, idx).trim()
  return group || null
}

/**
 * Группирует плоский список warnings в разделы для UI.
 */
export function groupAbsenceWarnings(warnings: string[]): AbsenceWarningSection[] {
  const summary: string[] = []
  const notFound: string[] = []
  const noLessons: string[] = []
  const other: string[] = []

  for (const raw of warnings) {
    const line = raw.trim()
    if (!line) continue

    const missingGroup = splitGroupMessage(line, NOT_FOUND)
    if (missingGroup) {
      notFound.push(missingGroup)
      continue
    }
    const emptyDay = splitGroupMessage(line, NO_LESSONS)
    if (emptyDay) {
      noLessons.push(emptyDay)
      continue
    }

    if (
      line.startsWith('Проверено студентов:') ||
      line.startsWith('Пропущено по длине emp_code') ||
      line.startsWith('Проходов ZKBio') ||
      line.startsWith('Нет профиля в 1С') ||
      line.startsWith('Нет группы в 1С') ||
      line.startsWith('После фильтрации')
    ) {
      summary.push(line)
      continue
    }

    other.push(line)
  }

  const sections: AbsenceWarningSection[] = []
  if (summary.length > 0) {
    sections.push({ id: 'summary', title: 'Сводка', items: summary })
  }
  if (notFound.length > 0) {
    sections.push({
      id: 'not-found',
      title: `Группа не найдена в расписании · ${notFound.length}`,
      items: notFound,
    })
  }
  if (noLessons.length > 0) {
    sections.push({
      id: 'no-lessons',
      title: `Нет очных пар на дату · ${noLessons.length}`,
      items: noLessons,
    })
  }
  if (other.length > 0) {
    sections.push({ id: 'other', title: `Прочее · ${other.length}`, items: other })
  }
  return sections
}
