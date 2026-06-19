/**
 * @file Оплата обучения: договор, начисления, история.
 * @see {@link paymentSummary}
 */

import {
  charges,
  formatShortDate,
  goToPayment,
  paymentHistory,
  paymentSummary,
  rub,
} from '@/mocks/payment'
import { ScreenHeader, Button, StatusBadge, Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '@/ui'
import styles from './payments.module.css'

const payStatusLabel = { ok: 'Оплачено', due: 'Ожидается платёж', overdue: 'Просрочка' } as const
const chargeStatusLabel = { paid: 'оплачено', pending: 'к оплате', overdue: 'просрочено' } as const

/**
 * Оплата обучения: договор, начисления, история платежей.
 */
export function Payments() {
  const p = paymentSummary

  return (
    <>
      <ScreenHeader title="Оплата и договоры" subtitle="Договор на обучение и платежи" />

      <p className={styles.warn}>
        Онлайн-оплата в этом кабинете пока недоступна. После подключения backend платежи будут проходить через
        официальный платёжный сервис университета.
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

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>История платежей</h2>
        <div className={styles.tableWrap}>
          <Table>
            <TableHead>
              <TableRow>
                <TableHeader>Дата</TableHeader>
                <TableHeader>Сумма</TableHeader>
                <TableHeader>Способ</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {paymentHistory.map((h) => (
                <TableRow key={h.id}>
                  <TableCell>{formatShortDate(h.date)}</TableCell>
                  <TableCell>{rub(h.amount)}</TableCell>
                  <TableCell>{h.method}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>
    </>
  )
}
