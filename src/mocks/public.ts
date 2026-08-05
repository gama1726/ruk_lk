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

/** Moodle ЭО — дистанционное обучение */
export const moodleEostudUrl = 'https://moodle-eostud.ruc.su/'

/** Внешние сервисы университета */
export const resourceLinks: ResourceLink[] = [
  {
    id: 'r1',
    title: 'Дистанционное обучение',
    note: 'Лекции, материалы и задания по дисциплинам (Moodle ЭО)',
    url: moodleEostudUrl,
  },
  {
    id: 'r2',
    title: 'Электронная библиотека',
    note: 'Электронный каталог и доступ к ЭБС',
    url: 'https://ilibrary.rucoop.ru',
  },
  {
    id: 'r3',
    title: 'Оплата обучения',
    note: 'Платёжный портал университета',
    url: 'https://pay.ruc.su',
  },
  {
    id: 'r4',
    title: 'Расписание',
    note: 'Расписание занятий',
    url: 'https://schedule.ruc.su',
  },
  {
    id: 'r5',
    title: 'Официальный сайт РУК',
    note: 'Новости и информация об университете',
    url: 'https://new.ruc.su',
  },
  {
    id: 'r6',
    title: 'Старт / абитуриенту',
    note: 'Приёмная кампания и поступление',
    url: 'https://start.ruc.su',
  },
  {
    id: 'r7',
    title: 'Digital РУК',
    note: 'Цифровые сервисы университета',
    url: 'https://digital.ruc.su',
  },
]

export const supportContacts = {
  email: 'lk@ruc.local',
  phone: '+7 (495) 123-45-67',
  hours: 'Пн–Пт, 9:00–18:00',
  note: 'По вопросам работы личного кабинета и доступа к сервисам.',
}
