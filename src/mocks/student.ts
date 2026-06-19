/**
 * @file Мок-данные студента для локальной разработки.
 * @remarks Заменится ответом API, когда появится backend. Не импортировать в production-сборку с реальными ПДн.
 */

import type { Student } from './types'

/**
 * Тестовый студент: Иванов Артём Сергеевич, две программы обучения.
 * @see {@link useStudy} — выбор активной программы в интерфейсе
 */
export const student: Student = {
  fullName: 'Иванов Артём Сергеевич',
  studentId: '0147823',
  corporateEmail: 'ivanov.as@student.ruc.local',
  personalEmail: 'artem.ivanov@mail.ru',
  phone: '+79161234567',
  programs: [
    {
      id: 'b-2023',
      recordCode: 'RUC-B-2023-0142',
      level: 'Бакалавриат',
      direction: 'Информационная безопасность',
      group: 'ИБ-23',
      course: 3,
      form: 'очная',
      status: 'обучается',
      faculty: 'Факультет экономики и информационных технологий',
      department: 'Информационные системы и технологии',
    },
    {
      id: 'm-2025',
      recordCode: 'RUC-M-2025-0061',
      level: 'Магистратура',
      direction: 'Управление цифровыми проектами',
      group: 'МЦП-25',
      course: 1,
      form: 'очная',
      status: 'активный',
      faculty: 'Факультет экономики и информационных технологий',
      department: 'Управление и маркетинг',
    },
  ],
}
