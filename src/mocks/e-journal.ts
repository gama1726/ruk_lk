/**
 * @file Мок сводного электронного журнала (как на дизайн-макете).
 * @remarks Заменится ответом API 1С. Студент: Мишичкин Г.Д.
 */

import type {
  JournalAttentionItem,
  JournalCellValue,
  JournalLesson,
  JournalLessonKind,
  JournalPassStatus,
  JournalSemester,
  JournalSubjectRow,
  JournalSummary,
  JournalUpcomingLesson,
} from './e-journal-types'

export const journalStudentName = 'Мишичкин Г.Д.'
export const journalStudentFullName = 'Мишичкин Георгий Дмитриевич'

export const journalSemesters: JournalSemester[] = [
  { id: '2026-spring', label: 'Весенний 2026' },
  { id: '2025-fall', label: 'Осенний 2025' },
]

const rows: JournalSubjectRow[] = [
  {
    id: 'mkt',
    name: 'Маркетинг',
    teacher: 'Петров И.И.',
    lastDate: '2026-05-20',
    attendancePercent: 95,
    grades: [5, 4, 5, 4, 5],
    finalScore: 4.6,
    status: 'passed',
    semesterId: '2026-spring',
    accent: 'purple',
  },
  {
    id: 'law',
    name: 'Право',
    teacher: 'Николаев Д.А.',
    lastDate: '2026-05-08',
    attendancePercent: 78,
    grades: [3, 4, 3, 4, 3],
    finalScore: 3.4,
    status: 'failed',
    semesterId: '2026-spring',
    accent: 'blue',
  },
  {
    id: 'web',
    name: 'Web-технологии',
    teacher: 'Петрова А.В.',
    lastDate: '2026-06-02',
    attendancePercent: 87,
    grades: [5, 4, 'н', 4, 5, 3, 5, 4],
    finalScore: 4.3,
    status: 'passed',
    semesterId: '2026-spring',
    accent: 'green',
  },
  {
    id: 'db',
    name: 'Базы данных',
    teacher: 'Сидоров И.Н.',
    lastDate: '2026-05-13',
    attendancePercent: 83,
    grades: [5, 4, 5, 'н', 2, 4, 5],
    finalScore: 4.2,
    status: 'in_progress',
    semesterId: '2026-spring',
    accent: 'orange',
  },
  {
    id: 'sec',
    name: 'Информационная безопасность',
    teacher: 'Козлов Д.С.',
    lastDate: '2026-05-14',
    attendancePercent: 91,
    grades: [4, 5, 'н', 4, 5, 3, 5, 4],
    finalScore: 4.3,
    status: 'passed',
    semesterId: '2026-spring',
    accent: 'pink',
  },
  {
    id: 'math',
    name: 'Дискретная математика',
    teacher: 'Иванова М.П.',
    lastDate: '2026-05-08',
    attendancePercent: 90,
    grades: [4, 5, 'н', 3, 4, 5, 4, 5],
    finalScore: 4.3,
    status: 'passed',
    semesterId: '2026-spring',
    accent: 'purple',
  },
  {
    id: 'pe',
    name: 'Физическая культура',
    teacher: 'Смирнов А.К.',
    lastDate: '2026-05-11',
    attendancePercent: 67,
    grades: ['з', 'н/б', 'з', 'нз', 'з'],
    finalScore: null,
    status: 'passed',
    semesterId: '2026-spring',
    accent: 'green',
  },
  {
    id: 'econ',
    name: 'Экономика организации',
    teacher: 'Орлова Е.М.',
    lastDate: '2026-04-28',
    attendancePercent: 88,
    grades: [4, 5, 4, 5, 4],
    finalScore: 4.4,
    status: 'passed',
    semesterId: '2026-spring',
    accent: 'blue',
  },
  {
    id: 'eng',
    name: 'Иностранный язык',
    teacher: 'Белова С.Н.',
    lastDate: '2026-05-22',
    attendancePercent: 96,
    grades: [5, 5, 4, 5, 5],
    finalScore: 4.8,
    status: 'passed',
    semesterId: '2026-spring',
    accent: 'pink',
  },
  {
    id: 'hist',
    name: 'История России',
    teacher: 'Кузнецов П.В.',
    lastDate: '2026-03-15',
    attendancePercent: 70,
    grades: [3, 3, 'н', 4, 3],
    finalScore: 3.3,
    status: 'failed',
    semesterId: '2026-spring',
    accent: 'orange',
  },
  {
    id: 'algo-fall',
    name: 'Алгоритмы и структуры данных',
    teacher: 'Морозов К.Л.',
    lastDate: '2025-12-18',
    attendancePercent: 94,
    grades: [5, 5, 4, 5, 4],
    finalScore: 4.6,
    status: 'passed',
    semesterId: '2025-fall',
    accent: 'purple',
  },
  {
    id: 'net-fall',
    name: 'Компьютерные сети',
    teacher: 'Васильев Р.О.',
    lastDate: '2025-12-10',
    attendancePercent: 85,
    grades: [4, 4, 5, 3, 4],
    finalScore: 4.0,
    status: 'passed',
    semesterId: '2025-fall',
    accent: 'blue',
  },
]

const lessonTopics: Record<string, string[]> = {
  mkt: [
    'Введение в маркетинг',
    'Сегментирование рынка',
    'Маркетинговые исследования',
    'Брендинг и позиционирование',
    'Ценообразование',
  ],
  law: [
    'Источники права',
    'Гражданское право: субъекты',
    'Договорное право',
    'Трудовое право',
    'Административная ответственность',
  ],
  web: [
    'HTML и семантика',
    'CSS: flex и grid',
    'JavaScript: DOM',
    'React: компоненты',
    'React: состояние',
    'Маршрутизация SPA',
    'Работа с API',
    'Деплой фронтенда',
  ],
  db: [
    'Модель данных',
    'SQL: выборки',
    'JOIN и агрегации',
    'Нормализация',
    'Индексы',
    'Транзакции',
    'Проектирование БД',
  ],
  sec: [
    'Угрозы ИБ',
    'Криптография',
    'Аутентификация',
    'Сетевая безопасность',
    'Политики доступа',
    'Аудит',
    'Защита веб-приложений',
    'Инцидент-менеджмент',
  ],
  math: [
    'Множества и отображения',
    'Графы',
    'Комбинаторика',
    'Логика',
    'Булевы функции',
    'Конечные автоматы',
    'Алгоритмы на графах',
    'Рекуррентные соотношения',
  ],
  pe: [
    'Бasketball',
    'Volleyball',
    'Athletics',
    'Gym',
    'Football',
  ],
  econ: [
    'Организация предприятия',
    'Организационная структура',
    'Управление персоналом',
    'Мотивация',
    'Экономическая эффективность',
  ],
  eng: [
    'Academic vocabulary',
    'Presentations',
    'Business correspondence',
    'Negotiations',
    'Case study',
  ],
  hist: [
    'Россия в XIX веке',
    'Реформы Александра II',
    'Общественные движения',
    'Первая мировая',
    '1917 год',
  ],
}

const detailedLessons: JournalLesson[] = [
  {
    id: 'web-1',
    subjectId: 'web',
    date: '2026-02-12',
    kind: 'лекция',
    topic: 'HTML и семантика',
    value: 5,
  },
  {
    id: 'web-2',
    subjectId: 'web',
    date: '2026-02-19',
    kind: 'практика',
    topic: 'CSS: flex и grid',
    value: 4,
  },
  {
    id: 'web-3',
    subjectId: 'web',
    date: '2026-02-26',
    kind: 'практика',
    topic: 'JavaScript: DOM',
    value: 'н',
    comment: 'Болел, справка предоставлена',
  },
  {
    id: 'web-4',
    subjectId: 'web',
    date: '2026-03-05',
    kind: 'лабораторная',
    topic: 'React: компоненты',
    value: 4,
  },
  {
    id: 'web-5',
    subjectId: 'web',
    date: '2026-03-12',
    kind: 'лабораторная',
    topic: 'React: состояние',
    value: 5,
  },
  {
    id: 'web-6',
    subjectId: 'web',
    date: '2026-04-02',
    kind: 'практика',
    topic: 'Маршрутизация SPA',
    value: 3,
    comment: 'Не сдал лабораторную в срок',
  },
  {
    id: 'web-7',
    subjectId: 'web',
    date: '2026-04-16',
    kind: 'лабораторная',
    topic: 'Работа с API',
    value: 5,
  },
  {
    id: 'web-8',
    subjectId: 'web',
    date: '2026-06-02',
    kind: 'консультация',
    topic: 'Деплой фронтенда',
    value: 4,
  },
  {
    id: 'db-1',
    subjectId: 'db',
    date: '2026-02-14',
    kind: 'лекция',
    topic: 'Модель данных',
    value: 5,
  },
  {
    id: 'db-2',
    subjectId: 'db',
    date: '2026-02-21',
    kind: 'практика',
    topic: 'SQL: выборки',
    value: 4,
  },
  {
    id: 'db-3',
    subjectId: 'db',
    date: '2026-03-07',
    kind: 'лабораторная',
    topic: 'JOIN и агрегации',
    value: 5,
  },
  {
    id: 'db-4',
    subjectId: 'db',
    date: '2026-03-21',
    kind: 'практика',
    topic: 'Нормализация',
    value: 'н',
  },
  {
    id: 'db-5',
    subjectId: 'db',
    date: '2026-04-04',
    kind: 'лабораторная',
    topic: 'Индексы',
    value: 2,
    comment: 'Контрольная работа — пересдача',
  },
  {
    id: 'db-6',
    subjectId: 'db',
    date: '2026-04-18',
    kind: 'практика',
    topic: 'Транзакции',
    value: 4,
  },
  {
    id: 'db-7',
    subjectId: 'db',
    date: '2026-05-13',
    kind: 'консультация',
    topic: 'Проектирование БД',
    value: 5,
  },
  {
    id: 'law-1',
    subjectId: 'law',
    date: '2026-02-11',
    kind: 'лекция',
    topic: 'Источники права',
    value: 3,
  },
  {
    id: 'law-2',
    subjectId: 'law',
    date: '2026-02-25',
    kind: 'практика',
    topic: 'Гражданское право: субъекты',
    value: 4,
  },
  {
    id: 'law-3',
    subjectId: 'law',
    date: '2026-03-11',
    kind: 'практика',
    topic: 'Договорное право',
    value: 3,
  },
  {
    id: 'law-4',
    subjectId: 'law',
    date: '2026-04-08',
    kind: 'лекция',
    topic: 'Трудовое право',
    value: 4,
  },
  {
    id: 'law-5',
    subjectId: 'law',
    date: '2026-05-08',
    kind: 'экзамен',
    topic: 'Административная ответственность',
    value: 3,
    comment: 'Итоговая аттестация — не зачтено',
  },
]

function shiftIsoDate(iso: string, days: number): string {
  const d = new Date(`${iso}T12:00:00`)
  d.setDate(d.getDate() + days)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

const lessonKinds: JournalLessonKind[] = ['лекция', 'практика', 'лабораторная', 'практика', 'консультация']

/** Занятия дисциплины по дням (мок → 1С) */
export function journalLessonsForSubject(subjectId: string): JournalLesson[] {
  const detailed = detailedLessons
    .filter((l) => l.subjectId === subjectId)
    .sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id))

  if (detailed.length > 0) return detailed

  const row = rows.find((r) => r.id === subjectId)
  if (!row) return []

  const topics = lessonTopics[subjectId] ?? []
  return row.grades.map((value, index) => {
    const kind = lessonKinds[index % lessonKinds.length]
    const topic = topics[index] ?? `Занятие ${index + 1}`
    const date = shiftIsoDate(row.lastDate, -(row.grades.length - 1 - index) * 7)

    return {
      id: `${subjectId}-gen-${index}`,
      subjectId,
      date,
      kind,
      topic,
      value,
    }
  })
}

/** Строка сводки по id дисциплины */
export function journalRowById(subjectId: string): JournalSubjectRow | undefined {
  return rows.find((r) => r.id === subjectId)
}

/** Короткая подпись вида занятия */
export function kindShort(kind: JournalLessonKind): string {
  switch (kind) {
    case 'лекция':
      return 'Лек'
    case 'практика':
      return 'Пр'
    case 'лабораторная':
      return 'Лаб'
    case 'консультация':
      return 'Конс'
    case 'экзамен':
      return 'Экз'
  }
}

/** Пояснение отметки для подсказки */
export function markHint(value: JournalCellValue): string {
  if (value == null) return 'Нет отметки'
  switch (value) {
    case 'н':
      return 'Неявка'
    case 'н/б':
      return 'Неявка по болезни'
    case 'осв':
      return 'Освобождение'
    case 'з':
      return 'Зачёт'
    case 'нз':
      return 'Не зачёт'
    default:
      return `Оценка ${value}`
  }
}

/** Ближайшие занятия для боковой панели (мок, позже — из расписания 1С) */
export const journalUpcomingLessons: JournalUpcomingLesson[] = [
  {
    id: 'u-mkt',
    date: '2026-05-23',
    subject: 'Маркетинг',
    start: '10:00',
    end: '11:30',
    room: '405',
    teacher: 'Петров И.И.',
  },
  {
    id: 'u-law',
    date: '2026-05-24',
    subject: 'Право',
    start: '12:10',
    end: '13:30',
    room: 'А-108',
    teacher: 'Николаев Д.А.',
  },
  {
    id: 'u-web',
    date: '2026-05-25',
    subject: 'Web-технологии',
    start: '14:00',
    end: '15:20',
    room: 'В-102',
    teacher: 'Петрова А.В.',
  },
]

const monthGenitive = [
  'января',
  'февраля',
  'марта',
  'апреля',
  'мая',
  'июня',
  'июля',
  'августа',
  'сентября',
  'октября',
  'ноября',
  'декабря',
] as const

/** День и месяц для блока «Ближайшие занятия» */
export function formatUpcomingDate(iso: string): { day: string; month: string } {
  const [, m, d] = iso.split('-')
  return { day: d, month: monthGenitive[parseInt(m, 10) - 1] }
}

/**
 * Дисциплины и события, требующие внимания студента.
 * @param semesterId - выбранный семестр
 */
export function journalAttentionItems(semesterId: string): JournalAttentionItem[] {
  const list = rows.filter((r) => r.semesterId === semesterId)
  const items: JournalAttentionItem[] = []

  for (const row of list) {
    if (row.status === 'failed') {
      items.push({
        id: `${row.id}-failed`,
        kind: 'failed',
        title: 'Не зачтено',
        subject: row.name,
        time: '3 дня назад',
        accent: 'pink',
      })
    }
    if (row.attendancePercent < 75) {
      items.push({
        id: `${row.id}-att`,
        kind: 'attendance',
        title: 'Низкая посещаемость',
        subject: row.name,
        detail: `${row.attendancePercent}%`,
        time: row.attendancePercent < 70 ? 'Вчера' : '2 дня назад',
        accent: 'orange',
      })
    }
    if (row.grades.some((g) => g === 2 || g === 'нз')) {
      items.push({
        id: `${row.id}-grade`,
        kind: 'grade',
        title: 'Оценка ниже 3',
        subject: row.name,
        time: 'Сегодня, 09:15',
        accent: 'purple',
      })
    }
  }

  return items.slice(0, 4)
}

/** Имена дисциплин из блока «Требует внимания» */
export function journalAttentionSubjects(semesterId: string): string[] {
  return [...new Set(journalAttentionItems(semesterId).map((i) => i.subject))]
}

export function journalTeachers(semesterId: string): string[] {
  const set = new Set(
    rows.filter((r) => r.semesterId === semesterId).map((r) => r.teacher),
  )
  return [...set].sort((a, b) => a.localeCompare(b, 'ru'))
}

export function journalSubjects(semesterId: string): string[] {
  return rows
    .filter((r) => r.semesterId === semesterId)
    .map((r) => r.name)
    .sort((a, b) => a.localeCompare(b, 'ru'))
}

export function filterJournalRows(
  semesterId: string,
  subject: string,
  teacher: string,
): JournalSubjectRow[] {
  return rows
    .filter((r) => r.semesterId === semesterId)
    .filter((r) => (subject === 'all' ? true : r.name === subject))
    .filter((r) => (teacher === 'all' ? true : r.teacher === teacher))
    .sort((a, b) => a.name.localeCompare(b.name, 'ru'))
}

export function journalSummary(semesterId: string): JournalSummary {
  const list = rows.filter((r) => r.semesterId === semesterId)
  const scored = list.filter((r) => r.finalScore != null)
  const average =
    scored.length === 0
      ? 0
      : Math.round(
          (scored.reduce((sum, r) => sum + (r.finalScore ?? 0), 0) / scored.length) * 100,
        ) / 100
  const attendancePercent =
    list.length === 0
      ? 0
      : Math.round(list.reduce((sum, r) => sum + r.attendancePercent, 0) / list.length)
  const absences = list.reduce((sum, r) => {
    const missed = Math.round(((100 - r.attendancePercent) / 100) * Math.max(r.grades.length, 1))
    return sum + missed
  }, 0)
  const closed = list.filter((r) => r.status === 'passed').length

  // Дельта к прошлому семестру — фиксированная для мока
  const averageDelta = semesterId === '2026-spring' ? 0.35 : -0.12

  return {
    average,
    averageMax: 5,
    averageDelta,
    attendancePercent,
    absences,
    closed,
    total: list.length,
  }
}

export function formatJournalDate(iso: string): string {
  const [y, m, d] = iso.split('-')
  return `${d}.${m}.${y}`
}

export function statusLabel(status: JournalPassStatus): string {
  switch (status) {
    case 'passed':
      return 'Зачтено'
    case 'failed':
      return 'Не зачтено'
    case 'in_progress':
      return 'В процессе'
  }
}

export function attendanceLabel(percent: number): string {
  if (percent >= 90) return 'Отличная посещаемость'
  if (percent >= 75) return 'Хорошая посещаемость'
  if (percent >= 60) return 'Есть пропуски'
  return 'Низкая посещаемость'
}

export function gradeTone(grade: JournalCellValue): string {
  if (grade === 5 || grade === 'з') return 'great'
  if (grade === 4) return 'good'
  if (grade === 3) return 'mid'
  if (grade === 2 || grade === 'нз') return 'fail'
  if (grade === 'н' || grade === 'н/б' || grade === 'осв') return 'absent'
  return 'mid'
}
