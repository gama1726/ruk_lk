import { useMemo } from 'react'
import { programLabel } from '@/mocks/format'
import { gradesByProgram } from '@/mocks/record-book'
import { gradeStatusLabel } from '@/mocks/record-book-types'
import { useCurrentProgram } from '@/study'
import { ScreenHeader, NoData, Table, TableHead, TableBody, TableRow, TableHeader, TableCell, StatusBadge } from '@/ui'
import styles from './grades.module.css'

/**
 * Считает сводку по текущему семестру.
 * @param rows - оценки семестра
 */
function semesterStats(rows: { status: string; points: number | null }[]) {
  const withPoints = rows.filter((r) => r.points != null)
  const avg =
    withPoints.length === 0
      ? null
      : (withPoints.reduce((sum, r) => sum + (r.points ?? 0), 0) / withPoints.length).toFixed(1)
  const notGraded = rows.filter((r) => r.status === 'not_graded').length
  return { total: rows.length, avg, notGraded }
}

/**
 * Успеваемость: сводка и таблица по текущему семестру.
 */
export function Grades() {
  const program = useCurrentProgram()
  const bySemester = gradesByProgram(program.id)

  const currentSemester = useMemo(() => {
    const keys = [...bySemester.keys()]
    return keys.length === 0 ? null : Math.max(...keys)
  }, [bySemester])

  const rows = currentSemester ? (bySemester.get(currentSemester) ?? []) : []
  const stats = semesterStats(rows)

  return (
    <>
      <ScreenHeader title="Успеваемость" subtitle={programLabel(program)} />

      {rows.length === 0 ? (
        <NoData title="Нет оценок" />
      ) : (
        <>
          <div className={styles.grid}>
            <div className={styles.stat}>
              <div className={styles.statValue}>{currentSemester}</div>
              <div className={styles.statLabel}>текущий семестр</div>
            </div>
            <div className={styles.stat}>
              <div className={styles.statValue}>{stats.avg ?? '—'}</div>
              <div className={styles.statLabel}>средний балл</div>
            </div>
            <div className={styles.stat}>
              <div className={styles.statValue}>{stats.notGraded}</div>
              <div className={styles.statLabel}>без итоговой оценки</div>
            </div>
          </div>

          <div className={styles.tableWrap}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeader>Дисциплина</TableHeader>
                  <TableHeader>Форма</TableHeader>
                  <TableHeader>Оценка</TableHeader>
                  <TableHeader>Баллы</TableHeader>
                  <TableHeader>Статус</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>{r.subject}</TableCell>
                    <TableCell>{r.controlForm}</TableCell>
                    <TableCell>{r.grade ?? '—'}</TableCell>
                    <TableCell>{r.points ?? '—'}</TableCell>
                    <TableCell>
                      <StatusBadge status={r.status} label={gradeStatusLabel[r.status]} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className={styles.cards}>
            {rows.map((r) => (
              <article key={r.id} className={styles.card}>
                <strong>{r.subject}</strong>
                <p>
                  {r.grade ?? '—'} · {gradeStatusLabel[r.status]}
                </p>
              </article>
            ))}
          </div>
        </>
      )}
    </>
  )
}
