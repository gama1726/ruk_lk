/**
 * @file Мок электронного журнала — как бумажный: даты × отметки.
 * @remarks Заменится ответом API 1С.
 */

import type {
  JournalCellValue,
  JournalLesson,
  JournalSubject,
  JournalSubjectStats,
} from './e-journal-types'

export const journalSubjectsList: JournalSubject[] = [
  {
    id: 'web',
    programId: 'b-2023',
    name: 'Web-технологии',
    teacher: 'Петрова А.В.',
    semesterLabel: 'Весенний семестр 2026',
  },
  {
    id: 'db',
    programId: 'b-2023',
    name: 'Базы данных',
    teacher: 'Сидоров И.Н.',
    semesterLabel: 'Весенний семестр 2026',
  },
  {
    id: 'sec',
    programId: 'b-2023',
    name: 'Информационная безопасность',
    teacher: 'Козлов Д.С.',
    semesterLabel: 'Весенний семестр 2026',
  },
  {
    id: 'math',
    programId: 'b-2023',
    name: 'Дискретная математика',
    teacher: 'Иванова М.П.',
    semesterLabel: 'Весенний семестр 2026',
  },
  {
    id: 'pm',
    programId: 'm-2025',
    name: 'Управление цифровыми проектами',
    teacher: 'Орлова Е.М.',
    semesterLabel: 'Весенний семестр 2026',
  },
]

const lessons: JournalLesson[] = [
  // Web-технологии
  { id: 'w1', programId: 'b-2023', subjectId: 'web', date: '2026-02-10', kind: 'лекция', topic: 'Введение в SPA', value: null },
  { id: 'w2', programId: 'b-2023', subjectId: 'web', date: '2026-02-17', kind: 'практика', topic: 'HTML и CSS', value: 5 },
  { id: 'w3', programId: 'b-2023', subjectId: 'web', date: '2026-02-24', kind: 'практика', topic: 'Flexbox и Grid', value: 4 },
  { id: 'w4', programId: 'b-2023', subjectId: 'web', date: '2026-03-03', kind: 'лекция', topic: 'JavaScript ES2020+', value: 'н' },
  { id: 'w5', programId: 'b-2023', subjectId: 'web', date: '2026-03-10', kind: 'лабораторная', topic: 'DOM и события', value: 4 },
  { id: 'w6', programId: 'b-2023', subjectId: 'web', date: '2026-03-17', kind: 'практика', topic: 'Fetch API', value: 5 },
  { id: 'w7', programId: 'b-2023', subjectId: 'web', date: '2026-03-24', kind: 'контроль', topic: 'Рубежный контроль №1', value: 4 },
  { id: 'w8', programId: 'b-2023', subjectId: 'web', date: '2026-04-07', kind: 'лекция', topic: 'React: компоненты', value: null },
  { id: 'w9', programId: 'b-2023', subjectId: 'web', date: '2026-04-14', kind: 'практика', topic: 'Состояние и эффекты', value: 5 },
  { id: 'w10', programId: 'b-2023', subjectId: 'web', date: '2026-04-21', kind: 'лабораторная', topic: 'Маршрутизация', value: 3 },
  { id: 'w11', programId: 'b-2023', subjectId: 'web', date: '2026-05-05', kind: 'практика', topic: 'Формы и валидация', value: 'н' },
  { id: 'w12', programId: 'b-2023', subjectId: 'web', date: '2026-05-12', kind: 'практика', topic: 'Работа с API', value: 5 },
  { id: 'w13', programId: 'b-2023', subjectId: 'web', date: '2026-05-19', kind: 'контроль', topic: 'Рубежный контроль №2', value: 5 },
  { id: 'w14', programId: 'b-2023', subjectId: 'web', date: '2026-05-26', kind: 'лекция', topic: 'Сборка и деплой', value: null },
  { id: 'w15', programId: 'b-2023', subjectId: 'web', date: '2026-06-02', kind: 'практика', topic: 'Итоговый проект', value: 4 },

  // Базы данных
  { id: 'd1', programId: 'b-2023', subjectId: 'db', date: '2026-02-11', kind: 'лекция', topic: 'Реляционная модель', value: null },
  { id: 'd2', programId: 'b-2023', subjectId: 'db', date: '2026-02-18', kind: 'практика', topic: 'SELECT и WHERE', value: 5 },
  { id: 'd3', programId: 'b-2023', subjectId: 'db', date: '2026-02-25', kind: 'практика', topic: 'JOIN', value: 4 },
  { id: 'd4', programId: 'b-2023', subjectId: 'db', date: '2026-03-04', kind: 'лабораторная', topic: 'Нормализация', value: 5 },
  { id: 'd5', programId: 'b-2023', subjectId: 'db', date: '2026-03-11', kind: 'лекция', topic: 'Индексы', value: 'н' },
  { id: 'd6', programId: 'b-2023', subjectId: 'db', date: '2026-03-18', kind: 'практика', topic: 'Подзапросы', value: 3 },
  { id: 'd7', programId: 'b-2023', subjectId: 'db', date: '2026-03-25', kind: 'контроль', topic: 'Контрольная №1', value: 4 },
  { id: 'd8', programId: 'b-2023', subjectId: 'db', date: '2026-04-08', kind: 'практика', topic: 'Транзакции', value: 5 },
  { id: 'd9', programId: 'b-2023', subjectId: 'db', date: '2026-04-15', kind: 'лабораторная', topic: 'Планы запросов', value: 4 },
  { id: 'd10', programId: 'b-2023', subjectId: 'db', date: '2026-04-22', kind: 'практика', topic: 'Представления', value: 5 },
  { id: 'd11', programId: 'b-2023', subjectId: 'db', date: '2026-05-06', kind: 'лекция', topic: 'NoSQL обзор', value: null },
  { id: 'd12', programId: 'b-2023', subjectId: 'db', date: '2026-05-13', kind: 'контроль', topic: 'Итоговый тест', value: 5 },

  // Информационная безопасность
  { id: 's1', programId: 'b-2023', subjectId: 'sec', date: '2026-02-12', kind: 'лекция', topic: 'Угрозы и модели', value: null },
  { id: 's2', programId: 'b-2023', subjectId: 'sec', date: '2026-02-19', kind: 'семинар', topic: 'Классификация атак', value: 4 },
  { id: 's3', programId: 'b-2023', subjectId: 'sec', date: '2026-02-26', kind: 'практика', topic: 'Хеширование', value: 5 },
  { id: 's4', programId: 'b-2023', subjectId: 'sec', date: '2026-03-05', kind: 'лекция', topic: 'Криптопротоколы', value: 'н' },
  { id: 's5', programId: 'b-2023', subjectId: 'sec', date: '2026-03-12', kind: 'практика', topic: 'TLS на практике', value: 4 },
  { id: 's6', programId: 'b-2023', subjectId: 'sec', date: '2026-03-19', kind: 'семинар', topic: 'Аутентификация', value: 5 },
  { id: 's7', programId: 'b-2023', subjectId: 'sec', date: '2026-04-02', kind: 'контроль', topic: 'Тест по модулю 1', value: 3 },
  { id: 's8', programId: 'b-2023', subjectId: 'sec', date: '2026-04-09', kind: 'практика', topic: 'OWASP Top 10', value: 5 },
  { id: 's9', programId: 'b-2023', subjectId: 'sec', date: '2026-04-16', kind: 'лабораторная', topic: 'Анализ трафика', value: 4 },
  { id: 's10', programId: 'b-2023', subjectId: 'sec', date: '2026-05-07', kind: 'семинар', topic: 'Политики ИБ', value: 5 },
  { id: 's11', programId: 'b-2023', subjectId: 'sec', date: '2026-05-14', kind: 'контроль', topic: 'Итоговая работа', value: 4 },

  // Дискретная математика
  { id: 'm1', programId: 'b-2023', subjectId: 'math', date: '2026-02-13', kind: 'лекция', topic: 'Множества', value: null },
  { id: 'm2', programId: 'b-2023', subjectId: 'math', date: '2026-02-20', kind: 'практика', topic: 'Отношения', value: 4 },
  { id: 'm3', programId: 'b-2023', subjectId: 'math', date: '2026-02-27', kind: 'практика', topic: 'Графы: введение', value: 5 },
  { id: 'm4', programId: 'b-2023', subjectId: 'math', date: '2026-03-06', kind: 'лекция', topic: 'Деревья', value: null },
  { id: 'm5', programId: 'b-2023', subjectId: 'math', date: '2026-03-13', kind: 'практика', topic: 'Кратчайшие пути', value: 'н' },
  { id: 'm6', programId: 'b-2023', subjectId: 'math', date: '2026-03-20', kind: 'практика', topic: 'Комбинаторика', value: 3 },
  { id: 'm7', programId: 'b-2023', subjectId: 'math', date: '2026-04-03', kind: 'контроль', topic: 'Коллоквиум', value: 4 },
  { id: 'm8', programId: 'b-2023', subjectId: 'math', date: '2026-04-10', kind: 'практика', topic: 'Булева алгебра', value: 5 },
  { id: 'm9', programId: 'b-2023', subjectId: 'math', date: '2026-04-17', kind: 'практика', topic: 'Автоматы', value: 4 },
  { id: 'm10', programId: 'b-2023', subjectId: 'math', date: '2026-05-08', kind: 'контроль', topic: 'Зачётная работа', value: 5 },

  // Магистратура
  { id: 'p1', programId: 'm-2025', subjectId: 'pm', date: '2026-02-14', kind: 'лекция', topic: 'Жизненный цикл проекта', value: null },
  { id: 'p2', programId: 'm-2025', subjectId: 'pm', date: '2026-02-28', kind: 'практика', topic: 'Agile и Scrum', value: 5 },
  { id: 'p3', programId: 'm-2025', subjectId: 'pm', date: '2026-03-14', kind: 'семинар', topic: 'Риски проекта', value: 4 },
  { id: 'p4', programId: 'm-2025', subjectId: 'pm', date: '2026-03-28', kind: 'практика', topic: 'Бэклог и оценка', value: 'н' },
  { id: 'p5', programId: 'm-2025', subjectId: 'pm', date: '2026-04-11', kind: 'контроль', topic: 'Кейс-анализ', value: 5 },
  { id: 'p6', programId: 'm-2025', subjectId: 'pm', date: '2026-04-25', kind: 'практика', topic: 'Метрики команды', value: 4 },
  { id: 'p7', programId: 'm-2025', subjectId: 'pm', date: '2026-05-16', kind: 'контроль', topic: 'Итоговая презентация', value: 5 },
]

export function subjectsForProgram(programId: string): JournalSubject[] {
  return journalSubjectsList.filter((s) => s.programId === programId)
}

export function lessonsForSubject(programId: string, subjectId: string): JournalLesson[] {
  return lessons
    .filter((l) => l.programId === programId && l.subjectId === subjectId)
    .sort((a, b) => a.date.localeCompare(b.date))
}

export function subjectStats(rows: JournalLesson[]): JournalSubjectStats {
  const grades = rows.filter((r): r is JournalLesson & { value: number } => typeof r.value === 'number')
  const absences = rows.filter((r) => r.value === 'н').length
  const empty = rows.filter((r) => r.value == null).length
  const average =
    grades.length === 0
      ? null
      : Math.round((grades.reduce((sum, r) => sum + r.value, 0) / grades.length) * 10) / 10

  return {
    average,
    gradesCount: grades.length,
    absences,
    lessons: rows.length,
    empty,
  }
}

/** День и месяц для шапки колонки: «05\nмар» */
export function journalColumnDate(iso: string): { day: string; month: string } {
  const [y, m, d] = iso.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  return {
    day: String(d).padStart(2, '0'),
    month: date.toLocaleDateString('ru-RU', { month: 'short' }).replace('.', ''),
  }
}

export function formatLessonDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function cellLabel(value: JournalCellValue): string {
  if (value == null) return ''
  if (value === 'н') return 'н'
  return String(value)
}

export function cellTone(value: JournalCellValue): 'empty' | 'absent' | 'fail' | 'mid' | 'good' | 'great' {
  if (value == null) return 'empty'
  if (value === 'н') return 'absent'
  if (value === 2) return 'fail'
  if (value === 3) return 'mid'
  if (value === 4) return 'good'
  return 'great'
}
