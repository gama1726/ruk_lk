import { useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { isPassPhotoNavVisible } from '@/campus'
import { useAppFeatures } from '@/features'
import { paths } from '@/paths'
import { useStudentProfile } from '@/student-profile-store'
import { ScreenHeader, Card } from '@/ui'
import styles from './services.module.css'

/**
 * Хаб сервисов — ссылки на разделы без дублирования меню.
 */
export function Services() {
  const profile = useStudentProfile((s) => s.profile)
  const status = useStudentProfile((s) => s.status)
  const load = useStudentProfile((s) => s.load)
  const startEnabled = useAppFeatures((s) => s.features?.startEnabled === true)
  const featuresStatus = useAppFeatures((s) => s.status)
  const loadFeatures = useAppFeatures((s) => s.load)

  useEffect(() => {
    if (status === 'idle') void load()
  }, [status, load])

  useEffect(() => {
    if (featuresStatus === 'idle') void loadFeatures()
  }, [featuresStatus, loadFeatures])

  const items = useMemo(() => {
    const allItems = [
      { to: paths.requests, title: 'Заявления и справки', note: 'Справки, обращения в деканат' },
      { to: paths.payments, title: 'Оплата обучения', note: 'Договор и график платежей' },
      { to: paths.psychologist, title: 'Психолог', note: 'Консультации, кабинет 307' },
      { to: paths.portfolio, title: 'Портфолио', note: 'Достижения и награды' },
      { to: paths.passPhoto, title: 'Фото для пропуска', note: 'Загрузка фото для пропуска' },
      {
        to: paths.start,
        title: 'Start',
        note: startEnabled ? 'Вход на start.ruc.su' : 'Скоро — вход на start.ruc.su',
      },
      { to: paths.esports, title: 'Киберспорт', note: 'Кабинет капитана и заявки на турниры' },
      { to: paths.library, title: 'Библиотека', note: 'Читательский билет, книги' },
    ] as const
    if (isPassPhotoNavVisible(profile)) return [...allItems]
    return allItems.filter((item) => item.to !== paths.passPhoto)
  }, [profile, startEnabled])

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
