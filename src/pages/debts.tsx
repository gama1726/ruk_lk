import { programLabel } from '@/mocks/format'
import { activeDebts, formatDebtDate } from '@/mocks/debts'
import { useCurrentProgram } from '@/study'
import { ScreenHeader, NoData, Table, TableHead, TableBody, TableRow, TableHeader, TableCell, StatusBadge } from '@/ui'
import styles from './debts.module.css'

/**
 * Академические задолженности по текущей программе.
 */
export function Debts() {
  const program = useCurrentProgram()
  const items = activeDebts(program.id)

  return (
    <>
      <ScreenHeader title="Задолженности" subtitle={programLabel(program)} />

      {items.length === 0 ? (
        <NoData title="Академических задолженностей нет" />
      ) : (
        <>
          <div className={styles.tableWrap}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeader>Дисциплина</TableHeader>
                  <TableHeader>Преподаватель</TableHeader>
                  <TableHeader>Форма контроля</TableHeader>
                  <TableHeader>Срок пересдачи</TableHeader>
                  <TableHeader>Статус</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell>{d.subject}</TableCell>
                    <TableCell>{d.teacher}</TableCell>
                    <TableCell>{d.controlForm}</TableCell>
                    <TableCell>{formatDebtDate(d.retakeUntil)}</TableCell>
                    <TableCell>
                      <StatusBadge status="debt" label="активная" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className={styles.cards}>
            {items.map((d) => (
              <article key={d.id} className={styles.card}>
                <strong>{d.subject}</strong>
                <div className={styles.cardRow}>
                  <span className={styles.cardLabel}>Преподаватель</span>
                  <span>{d.teacher}</span>
                </div>
                <div className={styles.cardRow}>
                  <span className={styles.cardLabel}>Форма</span>
                  <span>{d.controlForm}</span>
                </div>
                <div className={styles.cardRow}>
                  <span className={styles.cardLabel}>Пересдача до</span>
                  <span>{formatDebtDate(d.retakeUntil)}</span>
                </div>
                <StatusBadge status="debt" label="активная" />
              </article>
            ))}
          </div>
        </>
      )}
    </>
  )
}
