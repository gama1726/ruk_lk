import { useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { isPassPhotoNavVisible } from '@/campus'
import { paths } from '@/paths'
import { useStudentProfile } from '@/student-profile-store'
import { ScreenHeader, Card } from '@/ui'
import styles from './services.module.css'

const allItems = [
  { to: paths.requests, title: 'Заявления и справки', note: 'Справки, обращения в деканат' },
  { to: paths.payments, title: 'Оплата обучения', note: 'Договор и график платежей' },
  { to: paths.psychologist, title: 'Психолог', note: 'Консультации, кабинет 307' },
  { to: paths.portfolio, title: 'Портфолио', note: 'Достижения и награды' },
  { to: paths.passPhoto, title: 'Фото для пропуска', note: 'Загрузка фото для пропуска' },
  { to: paths.esports, title: 'Киберспорт', note: 'Кабинет капитана и заявки на турниры' },
  { to: paths.library, title: 'Библиотека', note: 'Читательский билет, книги' },
] as const

/**
 * Хаб сервисов — ссылки на разделы без дублирования меню.
 */
export function Services() {
  const profile = useStudentProfile((s) => s.profile)
  const status = useStudentProfile((s) => s.status)
  const load = useStudentProfile((s) => s.load)

  useEffect(() => {
    if (status === 'idle') void load()
  }, [status, load])

  const items = useMemo(() => {
    if (isPassPhotoNavVisible(profile)) return allItems
    return allItems.filter((item) => item.to !== paths.passPhoto)
  }, [profile])

  return (
    <>
      <ScreenHeader title="Сервисы" subtitle="Заявления, оплата и другие услуги" />

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
