import { useEffect, useMemo, useState } from 'react'
import { isApiConfigured } from '@/apiClient'
import { programLabel } from '@/mocks/format'
import { gradeStatusLabel, type GradeRow } from '@/mocks/record-book-types'
import { gradesForSemester } from '@/record-book'
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
import styles from './grades.module.css'

function averagePoints(rows: GradeRow[]): string | null {
  const withPoints = rows.filter((r) => r.points != null)
  if (withPoints.length === 0) return null
  const avg = withPoints.reduce((sum, r) => sum + (r.points ?? 0), 0) / withPoints.length
  return avg.toFixed(1)
}

function semesterStats(rows: GradeRow[]) {
  return {
    total: rows.length,
    avg: averagePoints(rows),
    failed: rows.filter((r) => r.status === 'failed').length,
  }
}

/**
 * Успеваемость: сводка и таблица с выбором семестра.
 */
export function Grades() {
  const program = useCurrentProgram()
  const rows = useRecordBook((s) => s.rows)
  const semesters = useRecordBook((s) => s.semesters)
  const bookStatus = useRecordBook((s) => s.status)
  const loadRecordBook = useRecordBook((s) => s.load)

  const [semester, setSemester] = useState(() => semesters[semesters.length - 1] ?? 1)

  useEffect(() => {
    if (isApiConfigured() && bookStatus === 'idle') {
      void loadRecordBook(program.id)
    }
  }, [bookStatus, loadRecordBook, program.id])

  useEffect(() => {
    if (semesters.length === 0) return
    if (!semesters.includes(semester)) {
      setSemester(semesters[semesters.length - 1])
    }
  }, [semester, semesters])

  const semesterRows = useMemo(() => gradesForSemester(rows, semester), [rows, semester])
  const stats = semesterStats(semesterRows)
  const overallAvg = useMemo(() => averagePoints(rows), [rows])
  const loading = isApiConfigured() && (bookStatus === 'loading' || bookStatus === 'idle')

  return (
    <>
      <ScreenHeader title="Успеваемость" subtitle={programLabel(program)} />

      {loading ? (
        <Loader />
      ) : rows.length === 0 ? (
        <NoData title="Нет оценок" />
      ) : (
        <>
          {semesters.length > 0 ? (
            <div className={styles.semesterPick}>
              <span className={styles.semesterLabel}>Семестр:</span>
              <div className={styles.semesterBtns}>
                {semesters.map((n) => (
                  <button
                    key={n}
                    type="button"
                    className={[styles.semesterBtn, semester === n ? styles.semesterBtnActive : '']
                      .filter(Boolean)
                      .join(' ')}
                    onClick={() => setSemester(n)}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <div className={styles.grid}>
            <div className={styles.stat}>
              <div className={styles.statValue}>{semester}</div>
              <div className={styles.statLabel}>выбранный семестр</div>
            </div>
            <div className={styles.stat}>
              <div className={styles.statValue}>{stats.avg ?? '—'}</div>
              <div className={styles.statLabel}>средний балл за семестр</div>
            </div>
            <div className={styles.stat}>
              <div className={styles.statValue}>{overallAvg ?? '—'}</div>
              <div className={styles.statLabel}>средний балл за всё время</div>
            </div>
            <div className={styles.stat}>
              <div className={[styles.statValue, stats.failed > 0 ? styles.statDanger : ''].filter(Boolean).join(' ')}>
                {stats.failed}
              </div>
              <div className={styles.statLabel}>долгов в семестре</div>
            </div>
          </div>

          <p className={styles.hint}>
            Средний балл считается по оценкам с баллами (экзамен, зачёт с оценкой и т.п.). Зачёты без
            оценки в среднее не входят.
          </p>

          {semesterRows.length === 0 ? (
            <NoData title="В этом семестре оценок нет" />
          ) : (
            <>
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
                    {semesterRows.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell>{r.subject}</TableCell>
                        <TableCell>{formatControlForm(r.controlForm)}</TableCell>
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
                {semesterRows.map((r) => (
                  <article key={r.id} className={styles.card}>
                    <div className={styles.cardHead}>
                      <strong>{r.subject}</strong>
                      <StatusBadge status={r.status} label={gradeStatusLabel[r.status]} />
                    </div>
                    <p>
                      {formatControlForm(r.controlForm)} · {r.grade ?? '—'}
                      {r.points != null ? ` (${r.points})` : ''}
                    </p>
                  </article>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </>
  )
}
