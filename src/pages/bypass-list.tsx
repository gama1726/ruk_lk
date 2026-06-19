/**
 * @file Обходной лист при выпуске.
 * @see {@link bypassSheet}
 */

import {
  bypassProgress,
  bypassSheet,
  bypassStatusLabel,
  formatBypassDate,
} from '@/mocks/bypass-list'
import { ScreenHeader, StatusBadge, Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '@/ui'
import common from './service-common.module.css'
import styles from './bypass-list.module.css'

const statusKey = { signed: 'approved', pending: 'pending', blocked: 'rejected' } as const

/**
 * Обходной лист: подписи подразделений и общий прогресс.
 */
export function BypassList() {
  const sheet = bypassSheet
  const progress = bypassProgress(sheet.steps)

  return (
    <>
      <ScreenHeader title="Обходной лист" subtitle={sheet.purpose} />

      <div className={styles.progress}>
        <p className={styles.progressLabel}>
          Подписано {sheet.steps.filter((s) => s.status === 'signed').length} из {sheet.steps.length} · открыт{' '}
          {formatBypassDate(sheet.openedAt)}
        </p>
        <div className={styles.progressBar} role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
          <div className={styles.progressFill} style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className={common.tableWrap}>
        <Table>
          <TableHead>
            <TableRow>
              <TableHeader>Подразделение</TableHeader>
              <TableHeader>Статус</TableHeader>
              <TableHeader>Дата</TableHeader>
              <TableHeader>Комментарий</TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {sheet.steps.map((step) => (
              <TableRow key={step.id}>
                <TableCell>{step.department}</TableCell>
                <TableCell>
                  <StatusBadge status={statusKey[step.status]} label={bypassStatusLabel[step.status]} />
                </TableCell>
                <TableCell>{step.signedAt ? formatBypassDate(step.signedAt) : '—'}</TableCell>
                <TableCell>{step.comment ?? '—'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className={common.cards}>
        {sheet.steps.map((step) => (
          <article key={step.id} className={common.rowCard}>
            <strong>{step.department}</strong>
            <div style={{ marginTop: '0.5rem' }}>
              <StatusBadge status={statusKey[step.status]} label={bypassStatusLabel[step.status]} />
            </div>
            {step.signedAt ? <p className={common.meta}>{formatBypassDate(step.signedAt)}</p> : null}
            {step.comment ? <p className={common.meta}>{step.comment}</p> : null}
          </article>
        ))}
      </div>
    </>
  )
}
