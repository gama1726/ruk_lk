/**
 * @file Приём психолога — реальные сведения с сайта РУК.
 * @see https://www.ruc.su/news/detail/121163/
 */

export type PsychologistInfo = {
  title: string
  specialist: string
  location: string
  locationHint: string
  confidentiality: string
  topics: string[]
  closing: string
  sourceUrl: string
  sourceLabel: string
}

/** Штатный психолог РУК (новость от 13.10.2022) */
export const psychologistInfo: PsychologistInfo = {
  title: 'Психологическая помощь студентам',
  specialist: 'Ирина Евгеньевна Борщёва',
  location: 'Корпус 4, кабинет 307',
  locationHint: 'Недалеко от деканата колледжа',
  confidentiality:
    'Все беседы носят индивидуальный и конфиденциальный характер. Сказанное на консультации не выходит за пределы кабинета.',
  topics: [
    'Психологическая помощь и поддержка в решении личностных, профессиональных и других проблем',
    'Консультации по вопросам обучения, развития, жизненного самоопределения, взаимоотношений',
    'Индивидуальная психологическая коррекция трудностей в обучении',
    'Повышение психологической компетентности',
  ],
  closing: 'Безвыходных ситуаций нет — тёмная полоса обязательно сменяется светлой.',
  sourceUrl: 'https://www.ruc.su/news/detail/121163/',
  sourceLabel: 'Подробнее на сайте РУК',
}
