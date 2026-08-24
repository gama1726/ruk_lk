/**
 * @file Мок электронного журнала текущего контроля.
 * @remarks Заменится ответом API 1С.
 */

import type { JournalEntry, JournalSubjectSummary } from './e-journal-types'

const entries: JournalEntry[] = [
  {
    id: 'j1',
    programId: 'b-2023',
    subject: 'Web-технологии',
    date: '2026-06-05',
    kind: 'практика',
    topic: 'React: состояние и эффекты',
    teacher: 'Петрова А.В.',
    mark: 4,
    maxPoints: 5,
  },
  {
    id: 'j2',
    programId: 'b-2023',
    subject: 'Web-технологии',
    date: '2026-05-29',
    kind: 'лабораторная',
    topic: 'REST API и fetch',
    teacher: 'Петрова А.В.',
    mark: 5,
    maxPoints: 5,
  },
  {
    id: 'j3',
    programId: 'b-2023',
    subject: 'Web-технологии',
    date: '2026-05-22',
    kind: 'лекция',
    topic: 'SPA и маршрутизация',
    teacher: 'Петрова А.В.',
    mark: null,
    maxPoints: 5,
  },
  {
    id: 'j4',
    programId: 'b-2023',
    subject: 'Базы данных',
    date: '2026-06-06',
    kind: 'практика',
    topic: 'JOIN и агрегация',
    teacher: 'Сидоров И.Н.',
    mark: 5,
    maxPoints: 5,
  },
  {
    id: 'j5',
    programId: 'b-2023',
    subject: 'Базы данных',
    date: '2026-05-30',
    kind: 'контроль',
    topic: 'Рубежный контроль №2',
    teacher: 'Сидоров И.Н.',
    mark: 4,
    maxPoints: 10,
  },
  {
    id: 'j6',
    programId: 'b-2023',
    subject: 'Базы данных',
    date: '2026-05-23',
    kind: 'лабораторная',
    topic: 'Индексы и планы запросов',
    teacher: 'Сидоров И.Н.',
    mark: 3,
    maxPoints: 5,
  },
  {
    id: 'j7',
    programId: 'b-2023',
    subject: 'Информационная безопасность',
    date: '2026-06-04',
    kind: 'семинар',
    topic: 'Криптографические протоколы',
    teacher: 'Козлов Д.С.',
    mark: 5,
    maxPoints: 5,
  },
  {
    id: 'j8',
    programId: 'b-2023',
    subject: 'Информационная безопасность',
    date: '2026-05-28',
    kind: 'лекция',
    topic: 'Угрозы и модели нарушителя',
    teacher: 'Козлов Д.С.',
    mark: 4,
    maxPoints: 5,
  },
  {
    id: 'j9',
    programId: 'b-2023',
    subject: 'Информационная безопасность',
    date: '2026-05-21',
    kind: 'контроль',
    topic: 'Тест по модулю 1',
    teacher: 'Козлов Д.С.',
    mark: null,
    maxPoints: 10,
  },
  {
    id: 'j10',
    programId: 'm-2025',
    subject: 'Управление цифровыми проектами',
    date: '2026-06-12',
    kind: 'практика',
    topic: 'Agile и Scrum',
    teacher: 'Орлова Е.М.',
    mark: 5,
    maxPoints: 5,
  },
  {
    id: 'j11',
    programId: 'm-2025',
    subject: 'Управление цифровыми проектами',
    date: '2026-06-05',
    kind: 'лекция',
    topic: 'Жизненный цикл проекта',
    teacher: 'Орлова Е.М.',
    mark: 4,
    maxPoints: 5,
  },
]

export const journalPeriods = [
  { id: '2026-spring', label: 'Весенний семестр 2026' },
  { id: '2025-fall', label: 'Осенний семестр 2025' },
] as const

export type JournalPeriod = (typeof journalPeriods)[number]['id']

export function journalSubjects(programId: string): string[] {
  return [...new Set(entries.filter((e) => e.programId === programId).map((e) => e.subject))].sort()
}

export function filterJournal(
  programId: string,
  subject: string,
  period: JournalPeriod,
): JournalEntry[] {
  return entries
    .filter((e) => e.programId === programId)
    .filter((e) => (subject === 'all' ? true : e.subject === subject))
    .filter((e) => {
      if (period === '2026-spring') return e.date >= '2026-02-01' && e.date < '2026-07-01'
      if (period === '2025-fall') return e.date >= '2025-09-01' && e.date < '2026-02-01'
      return true
    })
    .sort((a, b) => b.date.localeCompare(a.date) || a.subject.localeCompare(b.subject))
}

export function journalSummary(programId: string): JournalSubjectSummary[] {
  const bySubject = new Map<string, JournalEntry[]>()
  for (const e of entries.filter((row) => row.programId === programId)) {
    const list = bySubject.get(e.subject) ?? []
    list.push(e)
    bySubject.set(e.subject, list)
  }

  return [...bySubject.entries()]
    .map(([subject, list]) => {
      const graded = list.filter((e) => e.mark != null)
      const average =
        graded.length === 0
          ? null
          : Math.round(
              (graded.reduce((sum, e) => sum + ((e.mark ?? 0) / e.maxPoints) * 5, 0) / graded.length) *
                10,
            ) / 10
      const last = [...list].sort((a, b) => b.date.localeCompare(a.date)).find((e) => e.mark != null)
      return {
        subject,
        average,
        graded: graded.length,
        total: list.length,
        lastMark: last?.mark ?? null,
      }
    })
    .sort((a, b) => a.subject.localeCompare(b.subject))
}

export function formatJournalDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function formatJournalMark(entry: JournalEntry): string {
  if (entry.mark == null) return '—'
  return `${entry.mark}/${entry.maxPoints}`
}

export function markStatusKey(mark: number | null, maxPoints: number): string {
  if (mark == null) return 'not_graded'
  const ratio = mark / maxPoints
  if (ratio >= 0.9) return 'excellent'
  if (ratio >= 0.7) return 'good'
  if (ratio >= 0.5) return 'satisfactory'
  return 'not_passed'
}
