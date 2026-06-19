import { Link } from 'react-router-dom'
import { paths } from '@/paths'
import { Card } from '@/ui'
import styles from './home.module.css'

const links = [
  { to: paths.schedule, label: 'Посмотреть расписание' },
  { to: paths.requests, label: 'Заказать справку' },
  { to: paths.recordBook, label: 'Открыть зачётную книжку' },
  { to: paths.requests, label: 'Создать обращение' },
  { to: paths.payments, label: 'Перейти к оплате' },
] as const

/**
 * Быстрые действия с главной.
 */
export function QuickLinks() {
  return (
    <Card title="Быстрые действия" className={styles.wide}>
      <div className={styles.links}>
        {links.map((link) => (
          <Link key={link.label} to={link.to} className={styles.linkBtn}>
            {link.label}
          </Link>
        ))}
      </div>
    </Card>
  )
}
