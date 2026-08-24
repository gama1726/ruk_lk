/**
 * @file Электронный журнал — аналог бумажного: дисциплина → сетка дат и отметок.
 */

import { useEffect, useMemo, useState } from 'react'
import { programLabel } from '@/mocks/format'
import {
  attentionSubjects,
  cellLabel,
  cellTone,
  filterLessonsByMonth,
  formatLessonDate,
  journalColumnDate,
  journalStudentName,
  kindShort,
  lessonsForSubject,
  loadPinnedIds,
  loadSavedSubjectId,
  markHint,
  monthsForLessons,
  savePinnedIds,
  saveSubjectId,
  sortSubjects,
  subjectStats,
  subjectsForProgram,
} from '@/mocks/e-journal'
import type {
  JournalCellValue,
  JournalLesson,
  JournalMonthFilter,
  JournalSubjectSort,
} from '@/mocks/e-journal-types'
import { useCurrentProgram } from '@/study'
import { Button, NoData, ScreenHeader, Select } from '@/ui'
import styles from './e-journal.module.css'

function CellMark({ value }: { value: JournalCellValue }) {
  const tone = cellTone(value)
  const label = cellLabel(value)
  return (
    <span
      className={[styles.mark, styles[`mark_${tone}`]].join(' ')}
      aria-label={label ? markHint(value) : 'пусто'}
      title={label ? markHint(value) : undefined}
    >
      {label || '·'}
    </span>
  )
}

/**
 * Журнал: дисциплины, фильтры, ведомость, итог, печать.
 */
export function EJournal() {
  const program = useCurrentProgram()
  const baseSubjects = useMemo(() => subjectsForProgram(program.id), [program.id])

  const [pinnedIds, setPinnedIds] = useState<string[]>(() => loadPinnedIds())
  const [sort, setSort] = useState<JournalSubjectSort>('attention')
  const [month, setMonth] = useState<JournalMonthFilter>('all')
  const [subjectId, setSubjectId] = useState(() => {
    const saved = loadSavedSubjectId()
    if (saved && baseSubjects.some((s) => s.id === saved)) return saved
    return baseSubjects[0]?.id ?? ''
  })

  const subjects = useMemo(
    () => sortSubjects(baseSubjects, program.id, sort, pinnedIds),
    [baseSubjects, program.id, sort, pinnedIds],
  )

  const attention = useMemo(
    () => attentionSubjects(program.id, baseSubjects),
    [program.id, baseSubjects],
  )

  useEffect(() => {
    if (!subjects.some((s) => s.id === subjectId)) {
      setSubjectId(subjects[0]?.id ?? '')
    }
  }, [subjects, subjectId])

  useEffect(() => {
    if (subjectId) saveSubjectId(subjectId)
  }, [subjectId])

  const selected = subjects.find((s) => s.id === subjectId) ?? null
  const allRows = useMemo(
    () => (selected ? lessonsForSubject(program.id, selected.id) : []),
    [program.id, selected],
  )
  const monthOptions = useMemo(() => monthsForLessons(allRows), [allRows])
  const rows = useMemo(() => filterLessonsByMonth(allRows, month), [allRows, month])
  const stats = useMemo(() => subjectStats(allRows), [allRows])
  const filteredStats = useMemo(() => subjectStats(rows), [rows])
  const [activeLesson, setActiveLesson] = useState<JournalLesson | null>(null)

  useEffect(() => {
    setActiveLesson(null)
    setMonth('all')
  }, [subjectId])

  const togglePin = (id: string) => {
    setPinnedIds((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
      savePinnedIds(next)
      return next
    })
  }

  const handlePrint = () => {
    window.print()
  }

  if (baseSubjects.length === 0) {
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
        subtitle={programLabel(program)}
        actions={
          <Button type="button" variant="secondary" size="sm" onClick={handlePrint}>
            Печать
          </Button>
        }
      />

      {attention.length > 0 ? (
        <section className={styles.attention} aria-label="Требует внимания">
          <p className={styles.attentionTitle}>Требует внимания</p>
          <ul className={styles.attentionList}>
            {attention.map((s) => {
              const st = subjectStats(lessonsForSubject(program.id, s.id))
              return (
                <li key={s.id}>
                  <button
                    type="button"
                    className={styles.attentionBtn}
                    onClick={() => setSubjectId(s.id)}
                  >
                    <span className={styles.attentionName}>{s.name}</span>
                    <span className={styles.attentionMeta}>
                      {st.hasFail ? 'есть «2»/нз' : null}
                      {st.hasFail && st.absences >= 2 ? ' · ' : null}
                      {st.absences >= 2 ? `неявок: ${st.absences}` : null}
                      {!st.hasFail && st.absences < 2 && st.average != null && st.average < 3.5
                        ? `ср. ${st.average}`
                        : null}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        </section>
      ) : null}

      <div className={styles.layout}>
        <aside className={styles.sidebar} aria-label="Дисциплины">
          <div className={styles.sidebarHead}>
            <p className={styles.sidebarTitle}>Дисциплины</p>
            <Select
              aria-label="Сортировка дисциплин"
              options={[
                { value: 'attention', label: 'С долгами сверху' },
                { value: 'average', label: 'По среднему' },
                { value: 'name', label: 'По алфавиту' },
              ]}
              value={sort}
              onChange={(e) => setSort(e.target.value as JournalSubjectSort)}
            />
          </div>
          <ul className={styles.subjectList}>
            {subjects.map((s) => {
              const active = s.id === subjectId
              const preview = subjectStats(lessonsForSubject(program.id, s.id))
              const pinned = pinnedIds.includes(s.id)
              return (
                <li key={s.id} className={styles.subjectRow}>
                  <button
                    type="button"
                    className={[styles.subjectBtn, active ? styles.subjectBtnActive : '']
                      .filter(Boolean)
                      .join(' ')}
                    onClick={() => setSubjectId(s.id)}
                    aria-current={active ? 'true' : undefined}
                  >
                    <span className={styles.subjectName}>
                      {pinned ? '★ ' : ''}
                      {s.name}
                      {preview.needsAttention ? (
                        <span className={styles.attentionDot} title="Требует внимания" />
                      ) : null}
                    </span>
                    <span className={styles.subjectMeta}>
                      {preview.average != null ? `ср. ${preview.average}` : 'нет оценок'}
                      {preview.absences > 0 ? ` · н: ${preview.absences}` : ''}
                      {preview.attendancePercent != null
                        ? ` · ${preview.attendancePercent}%`
                        : ''}
                    </span>
                  </button>
                  <button
                    type="button"
                    className={[styles.pinBtn, pinned ? styles.pinBtnOn : '']
                      .filter(Boolean)
                      .join(' ')}
                    title={pinned ? 'Открепить' : 'Закрепить'}
                    aria-pressed={pinned}
                    onClick={() => togglePin(s.id)}
                  >
                    ★
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
                <div className={styles.headActions}>
                  <Select
                    label="Месяц"
                    options={monthOptions.map((m) => ({ value: m.id, label: m.label }))}
                    value={month}
                    onChange={(e) => setMonth(e.target.value as JournalMonthFilter)}
                  />
                </div>
              </header>

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
                <span>
                  <span className={[styles.mark, styles.mark_sick].join(' ')}>н/б</span> болезнь
                </span>
                <span>
                  <span className={[styles.mark, styles.mark_excused].join(' ')}>осв</span> осв.
                </span>
                <span>
                  <span className={[styles.mark, styles.mark_pass].join(' ')}>з</span> зачёт
                </span>
                <span>
                  <span className={[styles.mark, styles.mark_nopass].join(' ')}>нз</span> не зачёт
                </span>
                <span className={styles.legendKinds}>
                  л · пр · лаб · сем · к — вид занятия в шапке даты
                </span>
              </div>

              <div className={styles.stats} aria-label="Сводка">
                <div className={styles.stat}>
                  <span className={styles.statLabel}>Средний балл</span>
                  <strong className={styles.statValue}>
                    {stats.average != null ? stats.average.toFixed(1) : '—'}
                  </strong>
                </div>
                <div className={styles.stat}>
                  <span className={styles.statLabel}>Посещаемость</span>
                  <strong
                    className={[
                      styles.statValue,
                      stats.attendancePercent != null && stats.attendancePercent < 70
                        ? styles.statWarn
                        : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                  >
                    {stats.attendancePercent != null ? `${stats.attendancePercent}%` : '—'}
                  </strong>
                </div>
                <div className={styles.stat}>
                  <span className={styles.statLabel}>Неявок</span>
                  <strong
                    className={[styles.statValue, stats.absences > 0 ? styles.statWarn : '']
                      .filter(Boolean)
                      .join(' ')}
                  >
                    {stats.absences}
                  </strong>
                </div>
                <div className={styles.stat}>
                  <span className={styles.statLabel}>Допуск</span>
                  <strong
                    className={[
                      styles.statValue,
                      stats.admitted === true
                        ? styles.statOk
                        : stats.admitted === false
                          ? styles.statWarn
                          : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                  >
                    {stats.admitted === true ? 'да' : stats.admitted === false ? 'нет' : '—'}
                  </strong>
                </div>
              </div>

              {rows.length === 0 ? (
                <NoData title="Занятий за выбранный период нет" />
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
                            const { day, month: mon } = journalColumnDate(lesson.date)
                            return (
                              <th key={lesson.id} className={styles.dateHead} scope="col">
                                <button
                                  type="button"
                                  className={styles.dateBtn}
                                  title={`${formatLessonDate(lesson.date)} · ${lesson.kind}: ${lesson.topic}`}
                                  onClick={() => setActiveLesson(lesson)}
                                >
                                  <span className={styles.dateKind}>{kindShort(lesson.kind)}</span>
                                  <span className={styles.dateDay}>{day}</span>
                                  <span className={styles.dateMonth}>{mon}</span>
                                </button>
                              </th>
                            )
                          })}
                          <th className={styles.totalHead} scope="col">
                            Итог
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <th className={styles.nameCell} scope="row">
                            {journalStudentName}
                          </th>
                          {rows.map((lesson) => (
                            <td key={lesson.id} className={styles.cell}>
                              <button
                                type="button"
                                className={styles.cellBtn}
                                onClick={() => setActiveLesson(lesson)}
                                title={`${lesson.kind}: ${lesson.topic}`}
                              >
                                <CellMark value={lesson.value} />
                              </button>
                            </td>
                          ))}
                          <td className={styles.totalCell}>
                            <div className={styles.totalInner}>
                              <span className={styles.totalAvg}>
                                {filteredStats.average != null
                                  ? filteredStats.average.toFixed(1)
                                  : '—'}
                              </span>
                              <span
                                className={[
                                  styles.totalAdmit,
                                  stats.admitted === true
                                    ? styles.statOk
                                    : stats.admitted === false
                                      ? styles.statWarn
                                      : '',
                                ]
                                  .filter(Boolean)
                                  .join(' ')}
                              >
                                {stats.admitted === true
                                  ? 'допуск'
                                  : stats.admitted === false
                                    ? 'нет допуска'
                                    : '—'}
                              </span>
                            </div>
                          </td>
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
                    <li className={styles.timelineTotal}>
                      <span>Итог</span>
                      <span>
                        ср.{' '}
                        {filteredStats.average != null ? filteredStats.average.toFixed(1) : '—'}
                        {' · '}
                        {stats.admitted === true
                          ? 'допуск'
                          : stats.admitted === false
                            ? 'нет допуска'
                            : '—'}
                      </span>
                    </li>
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
                    <span className={styles.detailHint}>{markHint(activeLesson.value)}</span>
                  </div>
                  {activeLesson.comment ? (
                    <p className={styles.detailComment}>{activeLesson.comment}</p>
                  ) : null}
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
