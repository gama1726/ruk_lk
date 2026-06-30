import { Link } from 'react-router-dom'
import { paths } from '@/paths'
import { ScreenHeader, Card } from '@/ui'
import styles from './services.module.css'

const items = [
  { to: paths.requests, title: 'Заявления и справки', note: 'Справки, обращения в деканат' },
  { to: paths.payments, title: 'Оплата и договоры', note: 'Платежи, договор на обучение' },
  { to: paths.dormitory, title: 'Общежитие', note: 'Проживание, заявки, бытовые вопросы' },
  { to: paths.bypassList, title: 'Обходной лист', note: 'Подписи подразделений' },
  { to: paths.psychologist, title: 'Психолог', note: 'Запись на консультацию' },
      { to: paths.portfolio, title: 'Портфолио', note: 'Достижения и модерация' },
      { to: paths.passPhoto, title: 'Фото для пропуска', note: 'Загрузка фото для Perco-Web' },
      { to: paths.library, title: 'Библиотека / ЭБС', note: 'Читательский билет, книги' },
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
