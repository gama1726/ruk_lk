import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { isApiConfigured } from '@/apiClient'
import {
  formatControlForm,
  formatGradeCell,
  formatHours,
  formatRecordDate,
} from '@/record-book-format'
import { gradesForSemester } from '@/record-book'
import { useRecordBook } from '@/record-book-store'
import { paths } from '@/paths'
import { useCurrentProgram } from '@/study'
import { Loader, NoData } from '@/ui'
import styles from './record-book.module.css'

type ViewMode = 'standard' | 'gosuslugi'

/**
 * Электронная зачётная книжка в раскладке портала.
 */
export function RecordBook() {
  const program = useCurrentProgram()
  const rows = useRecordBook((s) => s.rows)
  const semesters = useRecordBook((s) => s.semesters)
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

  const semesterRows = useMemo(
    () => gradesForSemester(rows, semester),
    [rows, semester],
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
        <p className={styles.bannerText}>Балльно-рейтинговая система</p>
        <Link to={paths.grades} className={styles.bannerLink}>
          Подробнее →
        </Link>
      </div>

      <div className={styles.toolbar}>
        <div className={styles.viewSwitch} role="tablist" aria-label="Вид зачётной книжки">
          <button
            type="button"
            role="tab"
            aria-selected={view === 'standard'}
            className={[styles.viewBtn, view === 'standard' ? styles.viewBtnActive : ''].filter(Boolean).join(' ')}
            onClick={() => setView('standard')}
          >
            Стандарт
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={view === 'gosuslugi'}
            className={[styles.viewBtn, view === 'gosuslugi' ? styles.viewBtnActive : ''].filter(Boolean).join(' ')}
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
                  className={[styles.semesterBtn, semester === n ? styles.semesterBtnActive : ''].filter(Boolean).join(' ')}
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
            Представление для Госуслуг подключится вместе с backend. Переключитесь на вкладку «Стандарт».
          </p>
        ) : semesterRows.length === 0 ? (
          <div className={styles.empty}>
            <NoData title="В этом семестре записей нет" />
          </div>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Дата</th>
                  <th>Наименование дисциплины</th>
                  <th>Вид контроля</th>
                  <th>Общее кол-во час.</th>
                  <th>Оценка (балл)</th>
                </tr>
              </thead>
              <tbody>
                {semesterRows.map((row) => (
                  <tr key={row.id}>
                    <td className={styles.date}>{formatRecordDate(row.date)}</td>
                    <td className={styles.subject}>
                      <strong>{row.subject}</strong>
                      <span className={styles.teacher}>{row.teacher}</span>
                    </td>
                    <td>{formatControlForm(row.controlForm)}</td>
                    <td>{formatHours(row.hours)}</td>
                    <td className={styles.grade}>{formatGradeCell(row)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
