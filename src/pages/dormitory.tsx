/**
 * @file Общежитие: проживание, заявки, обращения.
 * @see {@link dormitory}
 */

import {
  applicationStatusLabel,
  dormitory,
  formatDormDate,
  ticketStatusLabel,
} from '@/mocks/dormitory'
import { ScreenHeader, NoData, StatusBadge } from '@/ui'
import styles from './service-common.module.css'

const appStatusKey = { sent: 'sent', processing: 'processing', approved: 'approved', rejected: 'rejected' } as const
const ticketStatusKey = { open: 'pending', processing: 'processing', closed: 'approved' } as const

/**
 * Общежитие: проживание, заявки, бытовые обращения.
 */
export function Dormitory() {
  const d = dormitory

  if (d.status === 'none') {
    return (
      <>
        <ScreenHeader title="Общежитие" subtitle="Проживание и бытовые вопросы" />
        <NoData title="Вы не проживаете в общежитии" description="Подать заявку на заселение можно через деканат" />
      </>
    )
  }

  return (
    <>
      <ScreenHeader title="Общежитие" subtitle="Проживание и бытовые вопросы" />

      <div className={styles.grid}>
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Проживание</h2>
          <StatusBadge status="active" label="проживает" />
          <p className={styles.meta}>{d.building}</p>
          <p className={styles.meta}>Комната {d.room}</p>
        </div>
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Договор</h2>
          <p className={styles.meta}>№ {d.contractNumber}</p>
          <p className={styles.meta}>Действует до {formatDormDate(d.contractUntil!)}</p>
        </div>
      </div>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Заявки</h2>
        {d.applications.length === 0 ? (
          <NoData title="Заявок нет" />
        ) : (
          <ul className={styles.list}>
            {d.applications.map((a) => (
              <li key={a.id} className={styles.item}>
                <div className={styles.itemHead}>
                  <span className={styles.itemTitle}>{a.type}</span>
                  <StatusBadge status={appStatusKey[a.status]} label={applicationStatusLabel[a.status]} />
                </div>
                <p className={styles.meta}>
                  {formatDormDate(a.createdAt)} · № {a.id}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Бытовые обращения</h2>
        {d.tickets.length === 0 ? (
          <NoData title="Обращений нет" />
        ) : (
          <ul className={styles.list}>
            {d.tickets.map((t) => (
              <li key={t.id} className={styles.item}>
                <div className={styles.itemHead}>
                  <span className={styles.itemTitle}>{t.topic}</span>
                  <StatusBadge status={ticketStatusKey[t.status]} label={ticketStatusLabel[t.status]} />
                </div>
                <p className={styles.meta}>{formatDormDate(t.createdAt)}</p>
                {t.reply ? <p className={styles.meta}>{t.reply}</p> : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  )
}
