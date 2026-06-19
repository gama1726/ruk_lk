/**
 * @file Мок списка преподавателей.
 */

import type { Teacher } from './teachers-types'

const teachers: Teacher[] = [
  {
    id: 't1',
    programId: 'b-2023',
    name: 'Козлов Владимир Иванович',
    department: 'Информационные системы и технологии',
    subjects: ['Информационная безопасность', 'Защита информации'],
    email: 'v.kozlov@ruc.local',
    consultation: 'пн 14:00–16:00, ауд. А-204',
  },
  {
    id: 't2',
    programId: 'b-2023',
    name: 'Смирнова Елена Александровна',
    department: 'Информационные системы и технологии',
    subjects: ['Базы данных', 'Проектирование информационных систем'],
    email: 'e.smirnova@ruc.local',
    consultation: 'ср 12:00–14:00, ауд. Б-311',
  },
  {
    id: 't3',
    programId: 'b-2023',
    name: 'Петров Дмитрий Сергеевич',
    department: 'Информационные системы и технологии',
    subjects: ['Web-технологии'],
    email: 'd.petrov@ruc.local',
    consultation: 'чт 10:00–12:00, ауд. В-102',
  },
  {
    id: 't4',
    programId: 'b-2023',
    name: 'Морозова Людмила Константиновна',
    department: 'Экономика и управление',
    subjects: ['Экономика организации'],
    email: 'l.morozova@ruc.local',
    consultation: 'пт 11:00–13:00, ауд. Б-205',
  },
  {
    id: 't5',
    programId: 'm-2025',
    name: 'Волкова Наталья Петровна',
    department: 'Управление и маркетинг',
    subjects: ['Управление цифровыми проектами'],
    email: 'n.volkova@ruc.local',
    consultation: 'ср 17:00–19:00, ауд. Г-015',
  },
]

/**
 * Преподаватели выбранной программы.
 * @param programId - id записи об обучении
 */
export function teachersByProgram(programId: string): Teacher[] {
  return teachers.filter((t) => t.programId === programId)
}

/**
 * Уникальные кафедры для фильтра.
 * @param programId - id программы
 */
export function teacherDepartments(programId: string): string[] {
  const set = new Set(teachersByProgram(programId).map((t) => t.department))
  return [...set].sort()
}

/**
 * Фильтр по кафедре.
 * @param programId - id программы
 * @param department - кафедра или `all`
 */
export function filterTeachers(programId: string, department: string): Teacher[] {
  const list = teachersByProgram(programId)
  if (department === 'all') return list
  return list.filter((t) => t.department === department)
}
