/**
 * @file Публичные данные: ссылки и контакты поддержки.
 * @remarks Доступны без авторизации.
 */

export type ResourceLink = {
  id: string
  title: string
  note: string
  url: string
}

/** Внешние сервисы университета */
export const resourceLinks: ResourceLink[] = [
  {
    id: 'r1',
    title: 'Система дистанционного обучения',
    note: 'Лекции, материалы и задания по дисциплинам',
    url: 'https://edu.ruc.local',
  },
  {
    id: 'r2',
    title: 'Библиотека РУК',
    note: 'Электронный каталог и читальный зал',
    url: 'https://library.ruc.local',
  },
  {
    id: 'r3',
    title: 'Оплата обучения',
    note: 'Платёжный портал университета',
    url: 'https://pay.ruc.local',
  },
  {
    id: 'r4',
    title: 'Справочник студента',
    note: 'Правила обучения, контакты деканатов',
    url: 'https://student.ruc.local',
  },
]

export const supportContacts = {
  email: 'lk@ruc.local',
  phone: '+7 (495) 123-45-67',
  hours: 'Пн–Пт, 9:00–18:00',
  note: 'По вопросам работы личного кабинета и доступа к сервисам.',
}
