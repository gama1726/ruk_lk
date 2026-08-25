/**
 * @file Электронный журнал — сводка по дисциплинам (дизайн-макет).
 */

import { useMemo, useState } from 'react'
import { programLabel } from '@/mocks/format'
import {
  attendanceLabel,
  filterJournalRows,
  formatJournalDate,
  gradeTone,
  journalSemesters,
  journalStudentName,
  journalSubjects,
  journalSummary,
  journalTeachers,
  statusLabel,
} from '@/mocks/e-journal'
import { useCurrentProgram } from '@/study'
import { Button, NoData, ScreenHeader, Select } from '@/ui'
import styles from './e-journal.module.css'

const PAGE_SIZE = 6

/**
 * Сводный журнал: фильтры, карточки метрик, таблица дисциплин.
 */
export function EJournal() {
  const program = useCurrentProgram()
  const [semesterId, setSemesterId] = useState(journalSemesters[0].id)
  const [subject, setSubject] = useState('all')
  const [teacher, setTeacher] = useState('all')
  const [visible, setVisible] = useState(PAGE_SIZE)

  const subjects = useMemo(() => journalSubjects(semesterId), [semesterId])
  const teachers = useMemo(() => journalTeachers(semesterId), [semesterId])
  const summary = useMemo(() => journalSummary(semesterId), [semesterId])
  const rows = useMemo(
    () => filterJournalRows(semesterId, subject, teacher),
    [semesterId, subject, teacher],
  )

  const visibleRows = rows.slice(0, visible)
  const hasMore = visible < rows.length

  const resetFilters = () => {
    setSemesterId(journalSemesters[0].id)
    setSubject('all')
    setTeacher('all')
    setVisible(PAGE_SIZE)
  }

  const onSemesterChange = (id: string) => {
    setSemesterId(id)
    setSubject('all')
    setTeacher('all')
    setVisible(PAGE_SIZE)
  }

  const deltaText =
    summary.averageDelta >= 0
      ? `Выше на ${summary.averageDelta.toFixed(2).replace('.', ',')}, чем в прошлом семестре`
      : `Ниже на ${Math.abs(summary.averageDelta).toFixed(2).replace('.', ',')}, чем в прошлом семестре`

  return (
    <div className={styles.page}>
      <ScreenHeader
        title="Электронный журнал"
        subtitle={`${programLabel(program)} · ${journalStudentName}`}
      />

      <div className={styles.filters}>
        <Select
          label="Семестр"
          options={journalSemesters.map((s) => ({ value: s.id, label: s.label }))}
          value={semesterId}
          onChange={(e) => onSemesterChange(e.target.value)}
        />
        <Select
          label="Дисциплина"
          options={[
            { value: 'all', label: 'Все дисциплины' },
            ...subjects.map((s) => ({ value: s, label: s })),
          ]}
          value={subject}
          onChange={(e) => {
            setSubject(e.target.value)
            setVisible(PAGE_SIZE)
          }}
        />
        <Select
          label="Преподаватель"
          options={[
            { value: 'all', label: 'Все преподаватели' },
            ...teachers.map((t) => ({ value: t, label: t })),
          ]}
          value={teacher}
          onChange={(e) => {
            setTeacher(e.target.value)
            setVisible(PAGE_SIZE)
          }}
        />
        <div className={styles.filterActions}>
          <Button type="button" variant="ghost" onClick={resetFilters}>
            Сбросить фильтры
          </Button>
        </div>
      </div>

      <section className={styles.cards} aria-label="Сводка">
        <article className={[styles.card, styles.cardAvg].join(' ')}>
          <div className={styles.cardTop}>
            <span className={styles.cardIcon} aria-hidden>
              ★
            </span>
            <span className={styles.cardLabel}>Средний балл</span>
          </div>
          <p className={styles.cardValue}>
            {summary.average.toFixed(2).replace('.', ',')}{' '}
            <span className={styles.cardMax}>/ {summary.averageMax.toFixed(2).replace('.', ',')}</span>
          </p>
          <p className={styles.cardHint}>{deltaText}</p>
          <div className={[styles.spark, styles.sparkUp].join(' ')} aria-hidden />
        </article>

        <article className={[styles.card, styles.cardAtt].join(' ')}>
          <div className={styles.cardTop}>
            <span className={styles.cardIcon} aria-hidden>
              ▦
            </span>
            <span className={styles.cardLabel}>Посещаемость</span>
          </div>
          <p className={styles.cardValue}>{summary.attendancePercent}%</p>
          <p className={styles.cardHint}>{attendanceLabel(summary.attendancePercent)}</p>
          <div className={styles.bar}>
            <div
              className={[styles.barFill, styles.barAtt].join(' ')}
              style={{ width: `${summary.attendancePercent}%` }}
            />
          </div>
        </article>

        <article className={[styles.card, styles.cardAbs].join(' ')}>
          <div className={styles.cardTop}>
            <span className={styles.cardIcon} aria-hidden>
              ○
            </span>
            <span className={styles.cardLabel}>Пропуски</span>
          </div>
          <p className={styles.cardValue}>{summary.absences}</p>
          <p className={styles.cardHint}>Занятий пропущено</p>
          <div className={styles.bar}>
            <div
              className={[styles.barFill, styles.barAbs].join(' ')}
              style={{ width: `${Math.min(100, summary.absences * 6)}%` }}
            />
          </div>
        </article>

        <article className={[styles.card, styles.cardDone].join(' ')}>
          <div className={styles.cardTop}>
            <span className={styles.cardIcon} aria-hidden>
              ✓
            </span>
            <span className={styles.cardLabel}>Закрыто дисциплин</span>
          </div>
          <p className={styles.cardValue}>
            {summary.closed} <span className={styles.cardMax}>/ {summary.total}</span>
          </p>
          <p className={styles.cardHint}>Дисциплин закрыто</p>
          <div className={styles.bar}>
            <div
              className={[styles.barFill, styles.barDone].join(' ')}
              style={{
                width: `${summary.total ? Math.round((summary.closed / summary.total) * 100) : 0}%`,
              }}
            />
          </div>
        </article>
      </section>

      {rows.length === 0 ? (
        <NoData title="Нет дисциплин" description="Измените фильтры или выберите другой семестр." />
      ) : (
        <>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Дисциплина</th>
                  <th>Дата</th>
                  <th>Посещаемость</th>
                  <th>Текущие оценки</th>
                  <th>Итоговый балл</th>
                  <th>Статус</th>
                </tr>
              </thead>
              <tbody>
                {visibleRows.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <div className={styles.subjectCell}>
                        <span
                          className={[styles.dot, styles[`dot_${row.accent}`]].join(' ')}
                          aria-hidden
                        />
                        <span>
                          <span className={styles.subjectName}>{row.name}</span>
                          <span className={styles.subjectTeacher}>{row.teacher}</span>
                        </span>
                      </div>
                    </td>
                    <td className={styles.muted}>{formatJournalDate(row.lastDate)}</td>
                    <td>
                      <span
                        className={
                          row.attendancePercent < 75 ? styles.attLow : styles.attOk
                        }
                      >
                        {row.attendancePercent}%
                      </span>
                    </td>
                    <td>
                      <div className={styles.grades}>
                        {row.grades.map((g, i) => (
                          <span
                            key={`${row.id}-${i}`}
                            className={[styles.grade, styles[`grade_${gradeTone(g)}`]].join(' ')}
                          >
                            {g}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className={styles.final}>
                      {row.finalScore != null
                        ? row.finalScore.toFixed(2).replace('.', ',')
                        : '—'}
                    </td>
                    <td>
                      <span
                        className={[
                          styles.status,
                          row.status === 'passed'
                            ? styles.statusPass
                            : row.status === 'failed'
                              ? styles.statusFail
                              : styles.statusProgress,
                        ].join(' ')}
                      >
                        {statusLabel(row.status)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ul className={styles.mobileList}>
            {visibleRows.map((row) => (
              <li key={row.id} className={styles.mobileCard}>
                <div className={styles.subjectCell}>
                  <span
                    className={[styles.dot, styles[`dot_${row.accent}`]].join(' ')}
                    aria-hidden
                  />
                  <span>
                    <span className={styles.subjectName}>{row.name}</span>
                    <span className={styles.subjectTeacher}>{row.teacher}</span>
                  </span>
                </div>
                <div className={styles.mobileMeta}>
                  <span>{formatJournalDate(row.lastDate)}</span>
                  <span>{row.attendancePercent}%</span>
                  <span
                    className={[
                      styles.status,
                      row.status === 'passed'
                        ? styles.statusPass
                        : row.status === 'failed'
                          ? styles.statusFail
                          : styles.statusProgress,
                    ].join(' ')}
                  >
                    {statusLabel(row.status)}
                  </span>
                </div>
                <div className={styles.grades}>
                  {row.grades.map((g, i) => (
                    <span
                      key={`${row.id}-m-${i}`}
                      className={[styles.grade, styles[`grade_${gradeTone(g)}`]].join(' ')}
                    >
                      {g}
                    </span>
                  ))}
                </div>
                <p className={styles.mobileFinal}>
                  Итог:{' '}
                  <strong>
                    {row.finalScore != null
                      ? row.finalScore.toFixed(2).replace('.', ',')
                      : '—'}
                  </strong>
                </p>
              </li>
            ))}
          </ul>

          {hasMore ? (
            <div className={styles.moreWrap}>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setVisible((n) => n + PAGE_SIZE)}
              >
                Показать ещё
              </Button>
            </div>
          ) : null}
        </>
      )}
    </div>
  )
}
