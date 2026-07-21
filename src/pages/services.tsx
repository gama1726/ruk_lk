import { Link } from 'react-router-dom'
import { paths } from '@/paths'
import { ScreenHeader, Card } from '@/ui'
import styles from './services.module.css'

const items = [
  { to: paths.requests, title: 'Заявления и справки (dev)', note: 'Справки, обращения в деканат' },
  { to: paths.payments, title: 'Оплата и договоры (dev)', note: 'Платежи, договор на обучение' },
  { to: paths.dormitory, title: 'Общежитие (dev)', note: 'Проживание, заявки, бытовые вопросы' },
  { to: paths.bypassList, title: 'Обходной лист (dev)', note: 'Подписи подразделений' },
  { to: paths.psychologist, title: 'Психолог (dev)', note: 'Запись на консультацию' },
  { to: paths.portfolio, title: 'Портфолио (dev)', note: 'Достижения и модерация' },
  { to: paths.passPhoto, title: 'Фото для пропуска', note: 'Загрузка фото для Perco-Web' },
  { to: paths.library, title: 'Библиотека / ЭБС (dev)', note: 'Читательский билет, книги' },
] as const

/**
 * Хаб сервисов — ссылки на разделы без дублирования меню.
 */
export function Services() {
  return (
    <>
      <ScreenHeader title="Сервисы" subtitle="Заявления, оплата, общежитие и другие услуги" />

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
