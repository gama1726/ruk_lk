/**
 * @file Реальные внешние ресурсы РУК (публичные ссылки).
 */

export type ResourceLink = {
  id: string
  title: string
  note: string
  url: string
}

/** Moodle ЭО — дистанционное обучение */
export const moodleEostudUrl = 'https://moodle-eostud.ruc.su/'

/** Сервисы университета вне ЛК */
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
