/**
 * @file Хаб разделов «Обучение».
 * @remarks Ссылки на экраны, привязанные к {@link useCurrentProgram}.
 */

import { Link } from 'react-router-dom'
import { paths } from '@/paths'
import { ScreenHeader, Card } from '@/ui'
import styles from './services.module.css'

const items = [
  { to: paths.attendance, title: 'Посещаемость (dev)', note: 'Журнал и процент по дисциплинам' },
  { to: paths.recordBook, title: 'Зачётная книжка', note: 'Оценки, БРС, практика' },
  { to: paths.grades, title: 'Успеваемость', note: 'Оценки по семестрам' },
  { to: paths.debts, title: 'Задолженности', note: 'Академические долги' },
  { to: paths.studyPlan, title: 'Учебный план', note: 'Дисциплины, практика и ГИА' },
  { to: paths.roadmap, title: 'Траектория (dev)', note: 'Дорожная карта обучения' },
  { to: paths.teachers, title: 'Преподаватели (dev)', note: 'Контакты и консультации' },
  { to: paths.orders, title: 'Приказы', note: 'Приказы из учебной системы' },
] as const

/**
 * Навигация по учебным разделам без дублирования бокового меню.
 */
export function Education() {
  return (
    <>
      <ScreenHeader title="Обучение" subtitle="Успеваемость, план и документы" />

      <ul className={styles.list}>
        {items.map((item) => (
          <li key={item.to}>
            <Card>
              <Link to={item.to} className={styles.link}>
                <span className={styles.title}>{item.title}</span>
                <span className={styles.note}>{item.note}</span>
              </Link>
            </Card>
          </li>
        ))}
      </ul>
    </>
  )
}
