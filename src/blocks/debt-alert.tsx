import { useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { isApiConfigured } from '@/apiClient'
import { academicDebtsFromRows, debtGradeLabel } from '@/debts'
import { formatControlForm } from '@/record-book-format'
import { useRecordBook } from '@/record-book-store'
import { useCurrentProgram } from '@/study'
import { paths } from '@/paths'
import { Card } from '@/ui'
import styles from './home.module.css'

/**
 * Блок задолженностей на главной. Не рендерится, если их нет.
 */
export function DebtAlert() {
  const program = useCurrentProgram()
  const rows = useRecordBook((s) => s.rows)
  const bookStatus = useRecordBook((s) => s.status)
  const loadRecordBook = useRecordBook((s) => s.load)

  useEffect(() => {
    if (isApiConfigured() && bookStatus === 'idle') {
      void loadRecordBook(program.id)
    }
  }, [bookStatus, loadRecordBook, program.id])

  const debts = useMemo(() => academicDebtsFromRows(rows), [rows])
  const loading = isApiConfigured() && (bookStatus === 'loading' || bookStatus === 'idle')

  if (loading) return null
  if (debts.length === 0) return null

  const debt = debts[0]

  return (
    <Card title="Задолженность">
      <p className={styles.muted}>
        <strong>{debt.subject}</strong> · {formatControlForm(debt.controlForm) || debt.controlForm || '—'}
      </p>
      <p className={styles.muted}>{debt.teacher || '—'}</p>
      <p className={styles.note}>{debtGradeLabel(debt)}</p>
      <p className={styles.note}>
        <Link to={paths.debts}>Все задолженности ({debts.length})</Link>
      </p>
    </Card>
  )
}
