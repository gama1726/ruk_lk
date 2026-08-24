/**
 * @file Электронный журнал — аналог бумажного: дисциплина → сетка дат и отметок.
 */

import { useEffect, useMemo, useState } from 'react'
import { programLabel } from '@/mocks/format'
import {
  cellLabel,
  cellTone,
  formatLessonDate,
  journalColumnDate,
  lessonsForSubject,
  subjectStats,
  subjectsForProgram,
} from '@/mocks/e-journal'
import type { JournalCellValue, JournalLesson } from '@/mocks/e-journal-types'
import { useCurrentProgram } from '@/study'
import { NoData, ScreenHeader } from '@/ui'
import styles from './e-journal.module.css'

function CellMark({ value }: { value: JournalCellValue }) {
  const tone = cellTone(value)
  const label = cellLabel(value)
  return (
    <span className={[styles.mark, styles[`mark_${tone}`]].join(' ')} aria-label={label || 'пусто'}>
      {label || '·'}
    </span>
  )
}

/**
 * Журнал: список дисциплин слева, ведомость с датами и оценками / «н».
 */
export function EJournal() {
  const program = useCurrentProgram()
  const subjects = useMemo(() => subjectsForProgram(program.id), [program.id])
  const [subjectId, setSubjectId] = useState(subjects[0]?.id ?? '')

  useEffect(() => {
    if (!subjects.some((s) => s.id === subjectId)) {
      setSubjectId(subjects[0]?.id ?? '')
    }
  }, [subjects, subjectId])

  const selected = subjects.find((s) => s.id === subjectId) ?? null
  const rows = useMemo(
    () => (selected ? lessonsForSubject(program.id, selected.id) : []),
    [program.id, selected],
  )
  const stats = useMemo(() => subjectStats(rows), [rows])
  const [activeLesson, setActiveLesson] = useState<JournalLesson | null>(null)

  useEffect(() => {
    setActiveLesson(null)
  }, [subjectId])

  if (subjects.length === 0) {
    return (
      <>
        <ScreenHeader title="Электронный журнал" subtitle={programLabel(program)} />
        <NoData title="Нет дисциплин" description="Журнал появится, когда будут данные из 1С." />
      </>
    )
  }

  return (
    <div className={styles.page}>
      <ScreenHeader
        title="Электронный журнал"
        subtitle={`${programLabel(program)} · текущий контроль`}
      />

      <div className={styles.layout}>
        <aside className={styles.sidebar} aria-label="Дисциплины">
          <p className={styles.sidebarTitle}>Дисциплины</p>
          <ul className={styles.subjectList}>
            {subjects.map((s) => {
              const active = s.id === subjectId
              const preview = subjectStats(lessonsForSubject(program.id, s.id))
              return (
                <li key={s.id}>
                  <button
                    type="button"
                    className={[styles.subjectBtn, active ? styles.subjectBtnActive : '']
                      .filter(Boolean)
                      .join(' ')}
                    onClick={() => setSubjectId(s.id)}
                    aria-current={active ? 'true' : undefined}
                  >
                    <span className={styles.subjectName}>{s.name}</span>
                    <span className={styles.subjectMeta}>
                      {preview.average != null ? `ср. ${preview.average}` : 'нет оценок'}
                      {preview.absences > 0 ? ` · н: ${preview.absences}` : ''}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        </aside>

        <div className={styles.main}>
          {selected ? (
            <>
              <header className={styles.sheetHead}>
                <div>
                  <h2 className={styles.sheetTitle}>{selected.name}</h2>
                  <p className={styles.sheetSub}>
                    {selected.teacher} · {selected.semesterLabel}
                  </p>
                </div>
                <div className={styles.legend} aria-label="Обозначения">
                  <span>
                    <span className={[styles.mark, styles.mark_great].join(' ')}>5</span> отлично
                  </span>
                  <span>
                    <span className={[styles.mark, styles.mark_good].join(' ')}>4</span> хорошо
                  </span>
                  <span>
                    <span className={[styles.mark, styles.mark_mid].join(' ')}>3</span> удовл.
                  </span>
                  <span>
                    <span className={[styles.mark, styles.mark_fail].join(' ')}>2</span> неуд.
                  </span>
                  <span>
                    <span className={[styles.mark, styles.mark_absent].join(' ')}>н</span> неявка
                  </span>
                </div>
              </header>

              <div className={styles.stats} aria-label="Сводка">
                <div className={styles.stat}>
                  <span className={styles.statLabel}>Средний балл</span>
                  <strong className={styles.statValue}>
                    {stats.average != null ? stats.average.toFixed(1) : '—'}
                  </strong>
                </div>
                <div className={styles.stat}>
                  <span className={styles.statLabel}>Оценок</span>
                  <strong className={styles.statValue}>{stats.gradesCount}</strong>
                </div>
                <div className={styles.stat}>
                  <span className={styles.statLabel}>Неявок</span>
                  <strong className={[styles.statValue, stats.absences > 0 ? styles.statWarn : '']
                    .filter(Boolean)
                    .join(' ')}
                  >
                    {stats.absences}
                  </strong>
                </div>
                <div className={styles.stat}>
                  <span className={styles.statLabel}>Занятий</span>
                  <strong className={styles.statValue}>{stats.lessons}</strong>
                </div>
              </div>

              {rows.length === 0 ? (
                <NoData title="Занятий пока нет" />
              ) : (
                <>
                  <div className={styles.sheetWrap}>
                    <table className={styles.sheet}>
                      <caption className={styles.srOnly}>
                        Журнал по дисциплине {selected.name}: даты занятий и отметки
                      </caption>
                      <thead>
                        <tr>
                          <th className={styles.corner} scope="col">
                            Студент
                          </th>
                          {rows.map((lesson) => {
                            const { day, month } = journalColumnDate(lesson.date)
                            return (
                              <th key={lesson.id} className={styles.dateHead} scope="col">
                                <button
                                  type="button"
                                  className={styles.dateBtn}
                                  title={`${formatLessonDate(lesson.date)} · ${lesson.kind}: ${lesson.topic}`}
                                  onClick={() => setActiveLesson(lesson)}
                                >
                                  <span className={styles.dateDay}>{day}</span>
                                  <span className={styles.dateMonth}>{month}</span>
                                </button>
                              </th>
                            )
                          })}
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <th className={styles.nameCell} scope="row">
                            Вы
                          </th>
                          {rows.map((lesson) => (
                            <td key={lesson.id} className={styles.cell}>
                              <button
                                type="button"
                                className={styles.cellBtn}
                                onClick={() => setActiveLesson(lesson)}
                                title={lesson.topic}
                              >
                                <CellMark value={lesson.value} />
                              </button>
                            </td>
                          ))}
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <ol className={styles.timeline}>
                    {rows.map((lesson) => (
                      <li key={lesson.id}>
                        <button
                          type="button"
                          className={[
                            styles.timelineItem,
                            activeLesson?.id === lesson.id ? styles.timelineItemActive : '',
                          ]
                            .filter(Boolean)
                            .join(' ')}
                          onClick={() => setActiveLesson(lesson)}
                        >
                          <span className={styles.timelineDate}>{formatLessonDate(lesson.date)}</span>
                          <span className={styles.timelineBody}>
                            <span className={styles.timelineKind}>{lesson.kind}</span>
                            <span className={styles.timelineTopic}>{lesson.topic}</span>
                          </span>
                          <CellMark value={lesson.value} />
                        </button>
                      </li>
                    ))}
                  </ol>
                </>
              )}

              {activeLesson ? (
                <aside className={styles.detail} aria-live="polite">
                  <p className={styles.detailDate}>{formatLessonDate(activeLesson.date)}</p>
                  <p className={styles.detailKind}>{activeLesson.kind}</p>
                  <p className={styles.detailTopic}>{activeLesson.topic}</p>
                  <div className={styles.detailMark}>
                    <span>Отметка</span>
                    <CellMark value={activeLesson.value} />
                    {activeLesson.value == null ? (
                      <span className={styles.detailHint}>ещё не выставлена</span>
                    ) : null}
                    {activeLesson.value === 'н' ? (
                      <span className={styles.detailHint}>неявка на занятие</span>
                    ) : null}
                  </div>
                </aside>
              ) : (
                <p className={styles.hint}>Нажмите на дату или клетку — откроется тема занятия.</p>
              )}
            </>
          ) : null}
        </div>
      </div>
    </div>
  )
}
