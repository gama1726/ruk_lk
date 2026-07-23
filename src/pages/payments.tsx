/**
 * @file Оплата обучения: договор и график из 1С.
 */

import { useEffect, useState } from 'react'
import { ApiError } from '@/apiClient'
import {
  charges,
  formatShortDate,
  goToPayment,
  paymentSummary,
  rub,
} from '@/mocks/payment'
import {
  fetchStudentPayments,
  isPaymentsApiEnabled,
  rubMoney,
  type StudentPaymentsDto,
} from '@/payments'
import { ScreenHeader, Button, StatusBadge, Table, TableHead, TableBody, TableRow, TableHeader, TableCell, NoData } from '@/ui'
import styles from './payments.module.css'

const payStatusLabel = { ok: 'Оплачено', due: 'Ожидается платёж', overdue: 'Просрочка' } as const
const chargeStatusLabel = { paid: 'оплачено', pending: 'к оплате', overdue: 'просрочено' } as const

function overallBadge(status: string) {
  if (status === 'ok') return { status: 'paid' as const, label: payStatusLabel.ok }
  if (status === 'due') return { status: 'pending' as const, label: payStatusLabel.due }
  return { status: 'overdue' as const, label: payStatusLabel.overdue }
}

function itemBadge(status: string) {
  if (status === 'paid') return { status: 'paid' as const, label: chargeStatusLabel.paid }
  if (status === 'pending') return { status: 'pending' as const, label: chargeStatusLabel.pending }
  return { status: 'overdue' as const, label: chargeStatusLabel.overdue }
}

function displayDate(iso: string, display: string): string {
  if (display) return display
  if (iso) return formatShortDate(iso)
  return '—'
}

/**
 * Оплата обучения: договор, график начислений.
 */
export function Payments() {
  const apiEnabled = isPaymentsApiEnabled()
  const [data, setData] = useState<StudentPaymentsDto | null>(null)
  const [loading, setLoading] = useState(apiEnabled)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!apiEnabled) {
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)
    setError(null)
    void (async () => {
      try {
        const result = await fetchStudentPayments()
        if (!cancelled) setData(result)
      } catch (e) {
        if (!cancelled) {
          setData(null)
          setError(e instanceof ApiError ? e.message : 'Не удалось загрузить данные об оплате')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [apiEnabled])

  if (!apiEnabled) {
    return <PaymentsMock />
  }

  if (loading) {
    return (
      <>
        <ScreenHeader title="Оплата услуг" subtitle="Договор и график платежей" />
        <p>Загрузка…</p>
      </>
    )
  }

  if (error) {
    return (
      <>
        <ScreenHeader title="Оплата услуг" subtitle="Договор и график платежей" />
        <p className={styles.error}>{error}</p>
      </>
    )
  }

  if (!data || !data.paymentFound) {
    return (
      <>
        <ScreenHeader title="Оплата услуг" subtitle="Договор и график платежей" />
        <NoData title="Данных об оплате нет" />
      </>
    )
  }

  const badge = overallBadge(data.status)
  const totals = data.totals
  const contract = data.contract

  return (
    <>
      <ScreenHeader title="Оплата услуг" subtitle="Договор и график платежей из учебной системы" />

      <p className={styles.warn}>
        Онлайн-оплата в кабинете пока недоступна. Ниже — актуальный график и задолженность из 1С.
      </p>

      <div className={styles.grid}>
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Договор</h2>
          {contract ? (
            <>
              <p className={styles.meta}>{contract.objectType || 'Договор на обучение'}</p>
              <p className={styles.meta}>№ {contract.number}</p>
              <p className={styles.meta}>от {displayDate(contract.date, contract.displayDate)}</p>
            </>
          ) : (
            <p className={styles.meta}>Договор не указан</p>
          )}
          <StatusBadge status={badge.status} label={badge.label} />
        </div>

        <div className={styles.card}>
          <h2 className={styles.cardTitle}>
            {totals.debt > 0 || totals.totalToPay > 0 ? 'К оплате' : 'Ближайший платёж'}
          </h2>
          {data.nextAmount > 0 ? (
            <p className={styles.meta}>
              {rubMoney(data.nextAmount)}
              {data.nextDisplayDate || data.nextDate
                ? ` · ${displayDate(data.nextDate, data.nextDisplayDate)}`
                : ''}
            </p>
          ) : (
            <p className={styles.meta}>Задолженности нет</p>
          )}
          <div className={styles.progress} aria-hidden="true">
            <div className={styles.progressBar} style={{ width: `${totals.paidPercent}%` }} />
          </div>
          <p className={styles.meta}>
            По графику за обучение {rubMoney(totals.scheduled)}
          </p>
          <p className={styles.meta}>
            Внесено {totals.paidPercent}% · {rubMoney(totals.paid)} из {rubMoney(totals.scheduled)}
          </p>
          {(totals.debt > 0 || totals.penalty > 0) && (
            <p className={styles.meta}>
              Долг {rubMoney(totals.debt)}
              {totals.penalty > 0 ? ` · пени ${rubMoney(totals.penalty)}` : ''}
              {totals.totalToPay > 0 ? ` · итого ${rubMoney(totals.totalToPay)}` : ''}
            </p>
          )}
          <div className={styles.actions}>
            <Button type="button" onClick={goToPayment}>
              Перейти к оплате
            </Button>
          </div>
        </div>
      </div>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>График платежей</h2>
        {data.schedule.length === 0 ? (
          <NoData title="График пуст" />
        ) : (
          <div className={styles.tableWrap}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeader>Период</TableHeader>
                  <TableHeader>Начислено</TableHeader>
                  <TableHeader>Оплачено</TableHeader>
                  <TableHeader>Срок</TableHeader>
                  <TableHeader>Статус</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.schedule.map((c) => {
                  const ib = itemBadge(c.status)
                  return (
                    <TableRow key={c.id} className={c.status === 'paid' ? styles.rowPaid : ''}>
                      <TableCell>{c.title}</TableCell>
                      <TableCell>{rubMoney(c.scheduled)}</TableCell>
                      <TableCell>{rubMoney(c.paid)}</TableCell>
                      <TableCell>{displayDate(c.date, c.displayDate)}</TableCell>
                      <TableCell>
                        <StatusBadge status={ib.status} label={ib.label} />
                        {c.debt > 0 && (
                          <span className={styles.debtHint}>
                            {' '}
                            долг {rubMoney(c.debt)}
                            {c.penalty > 0 ? `, пени ${rubMoney(c.penalty)}` : ''}
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </section>
    </>
  )
}

function PaymentsMock() {
  const p = paymentSummary
  return (
    <>
      <ScreenHeader title="Оплата и договоры (dev)" subtitle="Демо без API" />
      <p className={styles.warn}>
        Онлайн-оплата в этом кабинете пока недоступна. Подключите API для данных из 1С.
      </p>
      <div className={styles.grid}>
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Договор</h2>
          <p className={styles.meta}>{p.contractLabel}</p>
          <p className={styles.meta}>№ {p.contractNumber}</p>
          <StatusBadge
            status={p.status === 'ok' ? 'paid' : p.status === 'due' ? 'pending' : 'overdue'}
            label={payStatusLabel[p.status]}
          />
        </div>
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Ближайший платёж</h2>
          <p className={styles.meta}>
            {rub(p.nextAmount)} до {formatShortDate(p.nextDate)}
          </p>
          <div className={styles.progress} aria-hidden="true">
            <div className={styles.progressBar} style={{ width: `${p.paidPercent}%` }} />
          </div>
          <p className={styles.meta}>
            Внесено {p.paidPercent}% · остаток {rub(p.balance)}
          </p>
          <div className={styles.actions}>
            <Button type="button" onClick={goToPayment}>
              Перейти к оплате
            </Button>
          </div>
        </div>
      </div>
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Начисления</h2>
        <div className={styles.tableWrap}>
          <Table>
            <TableHead>
              <TableRow>
                <TableHeader>Период</TableHeader>
                <TableHeader>Сумма</TableHeader>
                <TableHeader>Срок</TableHeader>
                <TableHeader>Статус</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {charges.map((c) => (
                <TableRow key={c.id} className={c.status === 'paid' ? styles.rowPaid : ''}>
                  <TableCell>{c.title}</TableCell>
                  <TableCell>{rub(c.amount)}</TableCell>
                  <TableCell>{formatShortDate(c.dueDate)}</TableCell>
                  <TableCell>
                    <StatusBadge
                      status={c.status === 'paid' ? 'paid' : c.status === 'pending' ? 'pending' : 'overdue'}
                      label={chargeStatusLabel[c.status]}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>
    </>
  )
}
