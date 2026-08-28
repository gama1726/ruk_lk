/**
 * @file Хаб разделов «Обучение».
 * @remarks Ссылки на экраны, привязанные к {@link useCurrentProgram}.
 */

import { useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { isAttendanceNavVisible } from '@/campus'
import { paths } from '@/paths'
import { useStudentProfile } from '@/student-profile-store'
import { ScreenHeader, Card } from '@/ui'
import styles from './services.module.css'

const allItems = [
  { to: paths.attendance, title: 'Посещаемость', note: 'Приход и уход из вуза по дням' },
  { to: paths.eJournal, title: 'Электронный журнал', note: 'Оценки и неявки по дисциплинам' },
  { to: paths.recordBook, title: 'Зачётная книжка', note: 'Оценки, БРС и средний балл' },
  { to: paths.debts, title: 'Задолженности', note: 'Академические долги' },
  { to: paths.studyPlan, title: 'Учебный план', note: 'Дисциплины, практика и ГИА' },
  { to: paths.roadmap, title: 'Траектория обучения', note: 'Дисциплины по семестрам' },
  { to: paths.teachers, title: 'Преподаватели', note: 'Контакты и консультации' },
  { to: paths.orders, title: 'Приказы', note: 'Приказы по обучению' },
] as const

/**
 * Навигация по учебным разделам без дублирования бокового меню.
 */
export function Education() {
  const profile = useStudentProfile((s) => s.profile)
  const status = useStudentProfile((s) => s.status)
  const load = useStudentProfile((s) => s.load)

  useEffect(() => {
    if (status === 'idle') void load()
  }, [status, load])

  const items = useMemo(() => {
    if (isAttendanceNavVisible(profile)) return allItems
    return allItems.filter((item) => item.to !== paths.attendance)
  }, [profile])

  return (
    <>
      <ScreenHeader title="Обучение" subtitle="Зачётка, план и документы" />

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
