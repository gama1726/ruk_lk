import { useEffect, useMemo } from 'react'
import { isApiConfigured } from '@/apiClient'
import { academicDebtsFromRows, debtGradeLabel } from '@/debts'
import { programLabel } from '@/mocks/format'
import { formatControlForm } from '@/record-book-format'
import { useRecordBook } from '@/record-book-store'
import { useCurrentProgram } from '@/study'
import {
  ScreenHeader,
  NoData,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableHeader,
  TableCell,
  StatusBadge,
  Loader,
} from '@/ui'
import styles from './debts.module.css'

/**
 * Академические задолженности: неявка, неудовлетворительно, не зачтено
 * из уже загруженной зачётки / успеваемости.
 */
export function Debts() {
  const program = useCurrentProgram()
  const rows = useRecordBook((s) => s.rows)
  const bookStatus = useRecordBook((s) => s.status)
  const loadRecordBook = useRecordBook((s) => s.load)

  useEffect(() => {
    if (isApiConfigured() && bookStatus === 'idle') {
      void loadRecordBook(program.id)
    }
  }, [bookStatus, loadRecordBook, program.id])

  const items = useMemo(() => academicDebtsFromRows(rows), [rows])
  const loading = isApiConfigured() && (bookStatus === 'loading' || bookStatus === 'idle')

  return (
    <>
      <ScreenHeader title="Задолженности" subtitle={programLabel(program)} />

      {loading ? (
        <Loader />
      ) : items.length === 0 ? (
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
                  <TableHeader>Семестр</TableHeader>
                  <TableHeader>Оценка</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell>{d.subject}</TableCell>
                    <TableCell>{d.teacher || '—'}</TableCell>
                    <TableCell>{formatControlForm(d.controlForm) || d.controlForm || '—'}</TableCell>
                    <TableCell>{d.semester}</TableCell>
                    <TableCell>
                      <StatusBadge status="debt" label={debtGradeLabel(d)} />
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
                  <span>{d.teacher || '—'}</span>
                </div>
                <div className={styles.cardRow}>
                  <span className={styles.cardLabel}>Форма</span>
                  <span>{formatControlForm(d.controlForm) || d.controlForm || '—'}</span>
                </div>
                <div className={styles.cardRow}>
                  <span className={styles.cardLabel}>Семестр</span>
                  <span>{d.semester}</span>
                </div>
                <StatusBadge status="debt" label={debtGradeLabel(d)} />
              </article>
            ))}
          </div>
        </>
      )}
    </>
  )
}
