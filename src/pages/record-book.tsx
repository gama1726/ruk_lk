/**
 * @file Электронная зачётная книжка (оценки, БРС, сводка по семестрам).
 */

import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { isApiConfigured } from '@/apiClient'
import { gradeStatusLabel, type GradeRow } from '@/mocks/record-book-types'
import {
  formatControlForm,
  formatHours,
  formatRecordDate,
} from '@/record-book-format'
import { gradesForSemester } from '@/record-book'
import { useRecordBook } from '@/record-book-store'
import { paths } from '@/paths'
import { useCurrentProgram } from '@/study'
import { Loader, NoData, StatusBadge } from '@/ui'
import styles from './record-book.module.css'

type ViewMode = 'standard' | 'gosuslugi'

function formatCreditUnits(value: number | undefined): string {
  if (value == null || value <= 0) return '—'
  return new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 2 }).format(value)
}

function formatGrade(grade: string | null): string {
  if (!grade) return '—'
  return grade.charAt(0).toUpperCase() + grade.slice(1)
}

function averagePoints(rows: GradeRow[]): string | null {
  const withPoints = rows.filter((r) => r.points != null)
  if (withPoints.length === 0) return null
  const avg = withPoints.reduce((sum, r) => sum + (r.points ?? 0), 0) / withPoints.length
  return avg.toFixed(1)
}

/**
 * Электронная зачётная книжка в раскладке портала + сводка успеваемости.
 */
export function RecordBook() {
  const program = useCurrentProgram()
  const rows = useRecordBook((s) => s.rows)
  const semesters = useRecordBook((s) => s.semesters)
  const meta = useRecordBook((s) => s.meta)
  const bookStatus = useRecordBook((s) => s.status)
  const loadRecordBook = useRecordBook((s) => s.load)

  const [semester, setSemester] = useState(() => semesters[semesters.length - 1] ?? 1)
  const [view, setView] = useState<ViewMode>('standard')

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
  const semesterAvg = useMemo(() => averagePoints(semesterRows), [semesterRows])
  const overallAvg = useMemo(() => averagePoints(rows), [rows])
  const semesterFailed = useMemo(
    () => semesterRows.filter((r) => r.status === 'failed').length,
    [semesterRows],
  )
  const loading = isApiConfigured() && (bookStatus === 'loading' || bookStatus === 'idle')

  return (
    <div className={styles.page}>
      <nav className={styles.bread} aria-label="Навигация">
        <Link to={paths.education}>Обучение</Link>
        <span className={styles.breadSep}>/</span>
        <span>Электронная зачётная книжка</span>
      </nav>

      <div className={styles.banner}>
        <span className={styles.bannerIcon} aria-hidden="true">
          i
        </span>
        <p className={styles.bannerText}>
          Балльно-рейтинговая система. Средний балл считается по оценкам с баллами; зачёты без оценки в
          среднее не входят.
        </p>
      </div>

      {meta && (meta.specialty || meta.group || meta.recordBook) ? (
        <div className={styles.meta}>
          <div className={styles.metaMain}>
            {meta.recordBook ? (
              <p className={styles.metaTitle}>Зачётная книжка № {meta.recordBook}</p>
            ) : null}
            {meta.specialty ? <p className={styles.metaLine}>{meta.specialty}</p> : null}
            {meta.specialization ? (
              <p className={styles.metaMuted}>{meta.specialization}</p>
            ) : null}
            <p className={styles.metaMuted}>
              {[meta.group, meta.studyForm, meta.currentCourse].filter(Boolean).join(' · ')}
            </p>
          </div>
          <div className={styles.summary}>
            <div className={styles.summaryItem}>
              <strong>{meta.passedCount}</strong>
              <span>сдано</span>
            </div>
            <div className={styles.summaryItem}>
              <strong className={styles.summaryFail}>{meta.failedCount}</strong>
              <span>долги</span>
            </div>
          </div>
        </div>
      ) : null}

      {!loading && rows.length > 0 ? (
        <div className={styles.stats}>
          <div className={styles.stat}>
            <div className={styles.statValue}>{semester}</div>
            <div className={styles.statLabel}>выбранный семестр</div>
          </div>
          <div className={styles.stat}>
            <div className={styles.statValue}>{semesterAvg ?? '—'}</div>
            <div className={styles.statLabel}>средний балл за семестр</div>
          </div>
          <div className={styles.stat}>
            <div className={styles.statValue}>{overallAvg ?? '—'}</div>
            <div className={styles.statLabel}>средний балл за всё время</div>
          </div>
          <div className={styles.stat}>
            <div
              className={[styles.statValue, semesterFailed > 0 ? styles.statDanger : '']
                .filter(Boolean)
                .join(' ')}
            >
              {semesterFailed}
            </div>
            <div className={styles.statLabel}>долгов в семестре</div>
          </div>
        </div>
      ) : null}

      <div className={styles.toolbar}>
        <div className={styles.viewSwitch} role="tablist" aria-label="Вид зачётной книжки">
          <button
            type="button"
            role="tab"
            aria-selected={view === 'standard'}
            className={[styles.viewBtn, view === 'standard' ? styles.viewBtnActive : '']
              .filter(Boolean)
              .join(' ')}
            onClick={() => setView('standard')}
          >
            Стандарт
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={view === 'gosuslugi'}
            className={[styles.viewBtn, view === 'gosuslugi' ? styles.viewBtnActive : '']
              .filter(Boolean)
              .join(' ')}
            onClick={() => setView('gosuslugi')}
          >
            Госуслуги
          </button>
        </div>

        {semesters.length > 0 ? (
          <div className={styles.semesterPick}>
            <span className={styles.semesterLabel}>Выберите семестр:</span>
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
      </div>

      <div className={styles.card}>
        {loading ? (
          <Loader />
        ) : view === 'gosuslugi' ? (
          <p className={styles.gosuslugiNote}>
            Представление для Госуслуг скоро появится. Переключитесь на вкладку «Стандарт».
          </p>
        ) : rows.length === 0 ? (
          <div className={styles.empty}>
            <NoData title="Нет оценок" />
          </div>
        ) : semesterRows.length === 0 ? (
          <div className={styles.empty}>
            <NoData title="В этом семестре записей нет" />
          </div>
        ) : (
          <>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Дата</th>
                    <th>Наименование дисциплины</th>
                    <th>Вид контроля</th>
                    <th>Часы</th>
                    <th>ЗЕТ</th>
                    <th>Оценка</th>
                    <th>Баллы</th>
                    <th>Статус</th>
                  </tr>
                </thead>
                <tbody>
                  {semesterRows.map((row) => (
                    <tr key={row.id} className={row.status === 'failed' ? styles.rowFailed : undefined}>
                      <td className={styles.date}>{formatRecordDate(row.date, row.displayDate)}</td>
                      <td className={styles.subject}>
                        <strong>{row.subject}</strong>
                        {row.teacher ? <span className={styles.teacher}>{row.teacher}</span> : null}
                      </td>
                      <td>{formatControlForm(row.controlForm)}</td>
                      <td>{row.hours > 0 ? formatHours(row.hours) : '—'}</td>
                      <td>{formatCreditUnits(row.creditUnits)}</td>
                      <td className={styles.grade}>{formatGrade(row.grade)}</td>
                      <td className={styles.points}>{row.points ?? '—'}</td>
                      <td>
                        <StatusBadge status={row.status} label={gradeStatusLabel[row.status]} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className={styles.mobileCards}>
              {semesterRows.map((row) => (
                <article key={row.id} className={styles.mobileCard}>
                  <div className={styles.mobileCardHead}>
                    <strong>{row.subject}</strong>
                    <StatusBadge status={row.status} label={gradeStatusLabel[row.status]} />
                  </div>
                  <p>
                    {formatControlForm(row.controlForm)} · {formatGrade(row.grade)}
                    {row.points != null ? ` (${row.points})` : ''}
                  </p>
                  <p className={styles.mobileMeta}>
                    {formatRecordDate(row.date, row.displayDate)}
                    {row.teacher ? ` · ${row.teacher}` : ''}
                  </p>
                </article>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

/** Старый маршрут `/grades` → зачётная книжка. */
export function GradesRedirect() {
  return <Navigate to={paths.recordBook} replace />
}
