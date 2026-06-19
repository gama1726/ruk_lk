import { Link } from 'react-router-dom'
import { paymentSummary, rub, formatShortDate } from '@/mocks/payment'
import { paths } from '@/paths'
import { Card, StatusBadge } from '@/ui'
import styles from './home.module.css'

const statusText = {
  ok: 'Оплачено по графику',
  due: 'Ожидается платёж',
  overdue: 'Просрочка',
} as const

/**
 * Статус оплаты и ближайший платёж.
 */
export function PaymentAlert() {
  const p = paymentSummary

  return (
    <Card title="Оплата">
      <p className={styles.muted}>{p.contractLabel}</p>
      <StatusBadge status={p.status === 'due' ? 'pending' : p.status} label={statusText[p.status]} />
      <div className={styles.progress} aria-hidden="true">
        <div className={styles.progressBar} style={{ width: `${p.paidPercent}%` }} />
      </div>
      <p className={styles.note}>
        Внесено {p.paidPercent}% · остаток {rub(p.balance)}
      </p>
      <p className={styles.muted}>
        Ближайший платёж: {rub(p.nextAmount)} до {formatShortDate(p.nextDate)}
      </p>
      <p className={styles.note}>
        <Link to={paths.payments}>Перейти к оплате</Link>
      </p>
    </Card>
  )
}
