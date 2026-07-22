import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { formatShortDate, paymentSummary, rub } from '@/mocks/payment'
import {
  fetchStudentPayments,
  isPaymentsApiEnabled,
  rubMoney,
  type StudentPaymentsDto,
} from '@/payments'
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
  const apiEnabled = isPaymentsApiEnabled()
  const [data, setData] = useState<StudentPaymentsDto | null>(null)
  const [loading, setLoading] = useState(apiEnabled)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    if (!apiEnabled) return
    let cancelled = false
    setLoading(true)
    setFailed(false)
    void (async () => {
      try {
        const result = await fetchStudentPayments()
        if (!cancelled) setData(result)
      } catch {
        if (!cancelled) {
          setData(null)
          setFailed(true)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [apiEnabled])

  if (apiEnabled && loading) {
    return (
      <Card title="Оплата">
        <p className={styles.muted}>Загрузка…</p>
      </Card>
    )
  }

  if (apiEnabled && data?.paymentFound) {
    const status = (data.status === 'ok' || data.status === 'due' || data.status === 'overdue'
      ? data.status
      : 'due') as keyof typeof statusText
    const contractLabel =
      data.contract?.objectType && data.contract?.number
        ? `${data.contract.objectType} · № ${data.contract.number}`
        : data.contract?.label || 'Договор на обучение'

    return (
      <Card title="Оплата">
        <p className={styles.muted}>{contractLabel}</p>
        <StatusBadge
          status={status === 'due' ? 'pending' : status}
          label={statusText[status]}
        />
        <div className={styles.progress} aria-hidden="true">
          <div className={styles.progressBar} style={{ width: `${data.totals.paidPercent}%` }} />
        </div>
        <p className={styles.note}>
          Внесено {data.totals.paidPercent}% · к оплате {rubMoney(data.totals.totalToPay)}
        </p>
        {data.nextAmount > 0 && (
          <p className={styles.muted}>
            {data.totals.debt > 0 ? 'Задолженность' : 'Ближайший платёж'}: {rubMoney(data.nextAmount)}
            {data.nextDisplayDate || data.nextDate
              ? ` · ${data.nextDisplayDate || formatShortDate(data.nextDate)}`
              : ''}
          </p>
        )}
        <p className={styles.note}>
          <Link to={paths.payments}>Перейти к оплате</Link>
        </p>
      </Card>
    )
  }

  if (apiEnabled) {
    return (
      <Card title="Оплата">
        <p className={styles.muted}>
          {failed ? 'Не удалось загрузить данные' : 'Данных об оплате нет'}
        </p>
        <p className={styles.note}>
          <Link to={paths.payments}>Открыть раздел</Link>
        </p>
      </Card>
    )
  }

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
