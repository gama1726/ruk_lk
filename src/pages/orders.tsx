import { programLabel } from '@/mocks/format'
import { formatOrderDate, mockDownloadPdf, orderStatusLabel, ordersByProgram } from '@/mocks/orders'
import { useCurrentProgram } from '@/study'
import { ScreenHeader, Button, NoData, Table, TableHead, TableBody, TableRow, TableHeader, TableCell, StatusBadge } from '@/ui'
import styles from './orders.module.css'

const statusKey = {
  published: 'sent',
  ready: 'ready',
  archived: 'archived',
} as const

/**
 * Приказы и документы для скачивания (mock PDF).
 */
export function Orders() {
  const program = useCurrentProgram()
  const rows = ordersByProgram(program.id)

  return (
    <>
      <ScreenHeader title="Приказы и документы" subtitle={programLabel(program)} />

      {rows.length === 0 ? (
        <NoData title="Приказов нет" />
      ) : (
        <>
          <div className={styles.tableWrap}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeader>Тип</TableHeader>
                  <TableHeader>Номер</TableHeader>
                  <TableHeader>Дата</TableHeader>
                  <TableHeader>Статус</TableHeader>
                  <TableHeader />
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell>{o.type}</TableCell>
                    <TableCell>{o.number}</TableCell>
                    <TableCell>{formatOrderDate(o.date)}</TableCell>
                    <TableCell>
                      <StatusBadge status={statusKey[o.status]} label={orderStatusLabel[o.status]} />
                    </TableCell>
                    <TableCell>
                      <Button type="button" variant="ghost" size="sm" onClick={() => mockDownloadPdf(o.fileName)}>
                        Скачать PDF
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className={styles.cards}>
            {rows.map((o) => (
              <article key={o.id} className={styles.card}>
                <strong>{o.type}</strong>
                <div className={styles.cardRow}>
                  <span className={styles.cardLabel}>Номер</span>
                  <span>{o.number}</span>
                </div>
                <div className={styles.cardRow}>
                  <span className={styles.cardLabel}>Дата</span>
                  <span>{formatOrderDate(o.date)}</span>
                </div>
                <StatusBadge status={statusKey[o.status]} label={orderStatusLabel[o.status]} />
                <div style={{ marginTop: '0.75rem' }}>
                  <Button type="button" variant="secondary" size="sm" onClick={() => mockDownloadPdf(o.fileName)}>
                    Скачать PDF
                  </Button>
                </div>
              </article>
            ))}
          </div>
        </>
      )}
    </>
  )
}
