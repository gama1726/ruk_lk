/**
 * @file Мок списка преподавателей (позже — из 1С).
 * @remarks Студент: Мишичкин Г.Д., дисциплины согласованы с электронным журналом.
 */

import type { Teacher } from './teachers-types'

const teachers: Teacher[] = [
  {
    id: 't-mkt',
    programId: 'b-2023',
    name: 'Петров Иван Иванович',
    department: 'Маркетинг и коммерция',
    subjects: ['Маркетинг'],
    email: 'i.i.petrov@ruc.su',
    consultation: 'вт 14:00–16:00, ауд. 405',
  },
  {
    id: 't-law',
    programId: 'b-2023',
    name: 'Николаев Дмитрий Александрович',
    department: 'Право и государственное управление',
    subjects: ['Право', 'Правовое регулирование'],
    email: 'd.a.nikolaev@ruc.su',
    consultation: 'ср 10:00–12:00, ауд. А-108',
  },
  {
    id: 't-web',
    programId: 'b-2023',
    name: 'Петрова Анна Владимировна',
    department: 'Информационные системы и технологии',
    subjects: ['Web-технологии'],
    email: 'a.v.petrova@ruc.su',
    consultation: 'чт 12:10–14:00, ауд. В-102',
  },
  {
    id: 't-db',
    programId: 'b-2023',
    name: 'Сидоров Игорь Николаевич',
    department: 'Информационные системы и технологии',
    subjects: ['Базы данных', 'Информационные системы и базы данных'],
    email: 'i.n.sidorov@ruc.su',
    consultation: 'пн 14:00–15:20, ауд. Б-311',
  },
  {
    id: 't-sec',
    programId: 'b-2023',
    name: 'Козлов Дмитрий Сергеевич',
    department: 'Информационные системы и технологии',
    subjects: ['Информационная безопасность', 'Защита информации'],
    email: 'd.s.kozlov@ruc.su',
    consultation: 'пт 15:30–17:00, ауд. А-204',
  },
  {
    id: 't-math',
    programId: 'b-2023',
    name: 'Иванова Мария Павловна',
    department: 'Математика и информатика',
    subjects: ['Дискретная математика'],
    email: 'm.p.ivanova@ruc.su',
    consultation: 'вт 09:00–11:00, ауд. Б-120',
  },
  {
    id: 't-pe',
    programId: 'b-2023',
    name: 'Смирнов Алексей Константинович',
    department: 'Физическая культура и спорт',
    subjects: ['Физическая культура'],
    email: 'a.k.smirnov@ruc.su',
    consultation: 'по записи, спорткомплекс',
  },
  {
    id: 't-econ',
    programId: 'b-2023',
    name: 'Орлова Елена Михайловна',
    department: 'Экономика и управление',
    subjects: ['Экономика организации'],
    email: 'e.m.orlova@ruc.su',
    consultation: 'ср 12:10–13:30, ауд. Б-205',
  },
  {
    id: 't-eng',
    programId: 'b-2023',
    name: 'Белова Светлана Николаевна',
    department: 'Иностранные языки',
    subjects: ['Иностранный язык'],
    email: 's.n.belova@ruc.su',
    consultation: 'чт 16:00–17:30, ауд. Г-014',
  },
  {
    id: 't-hist',
    programId: 'b-2023',
    name: 'Кузнецов Павел Викторович',
    department: 'История и философия',
    subjects: ['История России'],
    email: 'p.v.kuznetsov@ruc.su',
    consultation: 'пн 11:00–12:30, ауд. А-015',
  },
  {
    id: 't-algo',
    programId: 'b-2023',
    name: 'Морозов Кирилл Львович',
    department: 'Информационные системы и технологии',
    subjects: ['Алгоритмы и структуры данных'],
    email: 'k.l.morozov@ruc.su',
    consultation: 'пт 10:00–12:00, ауд. В-201',
  },
  {
    id: 't-net',
    programId: 'b-2023',
    name: 'Васильев Роман Олегович',
    department: 'Информационные системы и технологии',
    subjects: ['Компьютерные сети'],
    email: 'r.o.vasilev@ruc.su',
    consultation: 'ср 15:00–17:00, ауд. В-210',
  },
  {
    id: 't-m1',
    programId: 'm-2025',
    name: 'Волкова Наталья Петровна',
    department: 'Управление и маркетинг',
    subjects: ['Управление цифровыми проектами'],
    email: 'n.p.volkova@ruc.su',
    consultation: 'ср 17:00–19:00, ауд. Г-015',
  },
]

const DEFAULT_PROGRAM = 'b-2023'

/**
 * Преподаватели выбранной программы.
 * Если для программы нет моков — показываем набор бакалавриата.
 */
export function teachersByProgram(programId: string): Teacher[] {
  const list = teachers.filter((t) => t.programId === programId)
  if (list.length > 0) return list
  return teachers.filter((t) => t.programId === DEFAULT_PROGRAM)
}

/**
 * Уникальные кафедры для фильтра.
 */
export function teacherDepartments(programId: string): string[] {
  const set = new Set(teachersByProgram(programId).map((t) => t.department))
  return [...set].sort((a, b) => a.localeCompare(b, 'ru'))
}

/**
 * Фильтр по кафедре.
 */
export function filterTeachers(programId: string, department: string): Teacher[] {
  const list = teachersByProgram(programId)
  if (department === 'all') return list
  return list.filter((t) => t.department === department)
}
