/**
 * @file Электронный журнал — сводка по дисциплинам (дизайн-макет).
 */

import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertTriangle,
  Armchair,
  Calendar,
  CalendarDays,
  CircleCheck,
  CircleX,
  FileText,
  Star,
} from 'lucide-react'
import { programLabel } from '@/mocks/format'
import {
  attendanceLabel,
  filterJournalRows,
  formatJournalDate,
  formatUpcomingDate,
  gradeTone,
  journalAttentionItems,
  journalAttentionSubjects,
  journalLessonsForSubject,
  journalRowById,
  journalSemesters,
  journalStudentName,
  journalSubjects,
  journalSummary,
  journalTeachers,
  journalUpcomingLessons,
  kindShort,
  markHint,
  statusLabel,
} from '@/mocks/e-journal'
import type { JournalSubjectRow } from '@/mocks/e-journal-types'
import { paths } from '@/paths'
import { useCurrentProgram } from '@/study'
import { Button, Drawer, NoData, ScreenHeader, Select } from '@/ui'
import styles from './e-journal.module.css'

const PAGE_SIZE = 6

const attentionIcons = {
  failed: CircleX,
  attendance: Armchair,
  grade: FileText,
} as const

function SubjectDetail({
  row,
  onClose,
}: {
  row: JournalSubjectRow
  onClose: () => void
}) {
  const lessons = useMemo(() => journalLessonsForSubject(row.id), [row.id])

  return (
    <Drawer open wide title={row.name} onClose={onClose}>
      <div className={styles.detail}>
        <div className={styles.detailMeta}>
          <p className={styles.detailTeacher}>{row.teacher}</p>
          <div className={styles.detailStats}>
            <span>Посещаемость: {row.attendancePercent}%</span>
            <span>
              Итог:{' '}
              {row.finalScore != null ? row.finalScore.toFixed(2).replace('.', ',') : '—'}
            </span>
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
        </div>

        {lessons.length === 0 ? (
          <NoData title="Нет занятий" description="По этой дисциплине пока нет отметок." />
        ) : (
          <div className={styles.detailTableWrap}>
            <table className={styles.detailTable}>
              <thead>
                <tr>
                  <th>Дата</th>
                  <th>Вид</th>
                  <th>Тема</th>
                  <th>Отметка</th>
                </tr>
              </thead>
              <tbody>
                {lessons.map((lesson) => (
                  <tr key={lesson.id}>
                    <td className={styles.detailDate}>{formatJournalDate(lesson.date)}</td>
                    <td className={styles.detailKind}>{kindShort(lesson.kind)}</td>
                    <td className={styles.detailTopic}>
                      {lesson.topic}
                      {lesson.comment ? (
                        <span className={styles.detailComment}>{lesson.comment}</span>
                      ) : null}
                    </td>
                    <td>
                      {lesson.value != null ? (
                        <span
                          className={[
                            styles.grade,
                            styles[`grade_${gradeTone(lesson.value)}`],
                          ].join(' ')}
                          title={markHint(lesson.value)}
                        >
                          {lesson.value}
                        </span>
                      ) : (
                        <span className={styles.detailEmpty}>—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <ul className={styles.detailMobileList}>
              {lessons.map((lesson) => (
                <li key={`${lesson.id}-m`} className={styles.detailMobileItem}>
                  <div className={styles.detailMobileHead}>
                    <span className={styles.detailDate}>{formatJournalDate(lesson.date)}</span>
                    <span className={styles.detailKind}>{kindShort(lesson.kind)}</span>
                    {lesson.value != null ? (
                      <span
                        className={[
                          styles.grade,
                          styles[`grade_${gradeTone(lesson.value)}`],
                        ].join(' ')}
                        title={markHint(lesson.value)}
                      >
                        {lesson.value}
                      </span>
                    ) : (
                      <span className={styles.detailEmpty}>—</span>
                    )}
                  </div>
                  <p className={styles.detailTopic}>{lesson.topic}</p>
                  {lesson.comment ? (
                    <p className={styles.detailComment}>{lesson.comment}</p>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </Drawer>
  )
}

/**
 * Сводный журнал: фильтры, карточки метрик, таблица дисциплин.
 */
export function EJournal() {
  const program = useCurrentProgram()
  const [semesterId, setSemesterId] = useState(journalSemesters[0].id)
  const [subject, setSubject] = useState('all')
  const [teacher, setTeacher] = useState('all')
  const [visible, setVisible] = useState(PAGE_SIZE)
  const [attentionOnly, setAttentionOnly] = useState(false)
  const [openedSubjectId, setOpenedSubjectId] = useState<string | null>(null)

  const openedRow = useMemo(
    () => (openedSubjectId ? journalRowById(openedSubjectId) : undefined),
    [openedSubjectId],
  )

  const openSubject = (subjectId: string) => setOpenedSubjectId(subjectId)
  const closeSubject = () => setOpenedSubjectId(null)

  const subjects = useMemo(() => journalSubjects(semesterId), [semesterId])
  const teachers = useMemo(() => journalTeachers(semesterId), [semesterId])
  const summary = useMemo(() => journalSummary(semesterId), [semesterId])
  const attentionItems = useMemo(() => journalAttentionItems(semesterId), [semesterId])
  const attentionSubjects = useMemo(() => journalAttentionSubjects(semesterId), [semesterId])
  const allRows = useMemo(
    () => filterJournalRows(semesterId, subject, teacher),
    [semesterId, subject, teacher],
  )
  const rows = useMemo(() => {
    if (!attentionOnly) return allRows
    return allRows.filter((r) => attentionSubjects.includes(r.name))
  }, [allRows, attentionOnly, attentionSubjects])

  const visibleRows = rows.slice(0, visible)
  const hasMore = visible < rows.length

  const resetFilters = () => {
    setSemesterId(journalSemesters[0].id)
    setSubject('all')
    setTeacher('all')
    setVisible(PAGE_SIZE)
    setAttentionOnly(false)
  }

  const onSemesterChange = (id: string) => {
    setSemesterId(id)
    setSubject('all')
    setTeacher('all')
    setVisible(PAGE_SIZE)
    setAttentionOnly(false)
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
          <div className={styles.cardHead}>
            <span className={styles.cardLabel}>Средний балл</span>
            <span className={styles.cardIconWrap} aria-hidden>
              <Star className={styles.cardIconSvg} strokeWidth={2} />
            </span>
          </div>
          <p className={styles.cardValue}>
            {summary.average.toFixed(2).replace('.', ',')}{' '}
            <span className={styles.cardMax}>/ {summary.averageMax.toFixed(2).replace('.', ',')}</span>
          </p>
          <p className={styles.cardHint}>{deltaText}</p>
        </article>

        <article className={[styles.card, styles.cardAtt].join(' ')}>
          <div className={styles.cardHead}>
            <span className={styles.cardLabel}>Посещаемость</span>
            <span className={styles.cardIconWrap} aria-hidden>
              <Calendar className={styles.cardIconSvg} strokeWidth={2} />
            </span>
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
          <div className={styles.cardHead}>
            <span className={styles.cardLabel}>Пропуски</span>
            <span className={styles.cardIconWrap} aria-hidden>
              <Armchair className={styles.cardIconSvg} strokeWidth={2} />
            </span>
          </div>
          <p className={styles.cardValue}>{summary.absences}</p>
          <p className={styles.cardHint}>Занятий пропущено</p>
        </article>

        <article className={[styles.card, styles.cardDone].join(' ')}>
          <div className={styles.cardHead}>
            <span className={styles.cardLabel}>Закрыто дисциплин</span>
            <span className={styles.cardIconWrap} aria-hidden>
              <CircleCheck className={styles.cardIconSvg} strokeWidth={2} />
            </span>
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

      <div className={styles.contentLayout}>
        <div className={styles.main}>
          {rows.length === 0 ? (
            <NoData
              title={attentionOnly ? 'Нет предупреждений' : 'Нет дисциплин'}
              description={
                attentionOnly
                  ? 'По выбранным фильтрам проблемных дисциплин не найдено.'
                  : 'Измените фильтры или выберите другой семестр.'
              }
            />
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
                    <tr
                      key={row.id}
                      className={styles.rowClickable}
                      onClick={() => openSubject(row.id)}
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          openSubject(row.id)
                        }
                      }}
                      role="button"
                      aria-label={`Открыть журнал: ${row.name}`}
                    >
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
                <li
                  key={row.id}
                  className={[styles.mobileCard, styles.rowClickable].join(' ')}
                  onClick={() => openSubject(row.id)}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      openSubject(row.id)
                    }
                  }}
                  role="button"
                  aria-label={`Открыть журнал: ${row.name}`}
                >
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

        <aside className={styles.aside} aria-label="Боковая панель">
            <section className={styles.sidePanel}>
              <header className={styles.sidePanelHead}>
                <span className={[styles.sidePanelIcon, styles.sidePanelIconSchedule].join(' ')} aria-hidden>
                  <CalendarDays className={styles.sidePanelIconSvg} strokeWidth={2} />
                </span>
                <h2 className={styles.sidePanelTitle}>Ближайшие занятия</h2>
              </header>
              <ul className={styles.sidePanelList}>
                {journalUpcomingLessons.map((lesson) => {
                  const { day, month } = formatUpcomingDate(lesson.date)
                  return (
                    <li key={lesson.id} className={styles.upcomingItem}>
                      <div className={styles.upcomingDate}>
                        <span className={styles.upcomingDay}>{day}</span>
                        <span className={styles.upcomingMonth}>{month}</span>
                      </div>
                      <div className={styles.upcomingInfo}>
                        <span className={styles.upcomingSubject}>{lesson.subject}</span>
                        <span className={styles.upcomingMeta}>
                          {lesson.start} – {lesson.end}, ауд. {lesson.room}
                        </span>
                        <span className={styles.upcomingMeta}>{lesson.teacher}</span>
                      </div>
                    </li>
                  )
                })}
              </ul>
              <footer className={styles.sidePanelFoot}>
                <Link to={paths.schedule} className={styles.sidePanelLink}>
                  Полное расписание →
                </Link>
              </footer>
            </section>

            <section className={styles.sidePanel}>
              <header className={styles.sidePanelHead}>
                <span className={[styles.sidePanelIcon, styles.sidePanelIconAlert].join(' ')} aria-hidden>
                  <AlertTriangle className={styles.sidePanelIconSvg} strokeWidth={2} />
                </span>
                <h2 className={styles.sidePanelTitle}>Требует внимания</h2>
              </header>
              {attentionItems.length === 0 ? (
                <p className={styles.sidePanelEmpty}>Всё в порядке — предупреждений нет</p>
              ) : (
                <ul className={styles.sidePanelList}>
                  {attentionItems.map((item) => {
                    const Icon = attentionIcons[item.kind]
                    return (
                      <li
                        key={item.id}
                        className={[styles.attentionItem, styles.rowClickable].join(' ')}
                        onClick={() => {
                          const row = allRows.find((r) => r.name === item.subject)
                          if (row) openSubject(row.id)
                        }}
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault()
                            const row = allRows.find((r) => r.name === item.subject)
                            if (row) openSubject(row.id)
                          }
                        }}
                        role="button"
                        aria-label={`Открыть журнал: ${item.subject}`}
                      >
                        <span
                          className={[
                            styles.attentionIcon,
                            styles[`attentionIcon_${item.accent}`],
                          ].join(' ')}
                          aria-hidden
                        >
                          <Icon className={styles.attentionIconSvg} strokeWidth={2} />
                        </span>
                        <div className={styles.attentionInfo}>
                          <span className={styles.attentionTitle}>{item.title}</span>
                          <span className={styles.attentionSubject}>
                            по дисциплине «{item.subject}»
                            {item.detail ? ` · ${item.detail}` : ''}
                          </span>
                          <span className={styles.attentionTime}>{item.time}</span>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              )}
              <footer className={styles.sidePanelFoot}>
                <button
                  type="button"
                  className={styles.sidePanelLink}
                  onClick={() => {
                    setAttentionOnly(true)
                    setSubject('all')
                    setTeacher('all')
                    setVisible(PAGE_SIZE)
                  }}
                >
                  Все предупреждения →
                </button>
              </footer>
            </section>
          </aside>
        </div>

      {openedRow ? <SubjectDetail row={openedRow} onClose={closeSubject} /> : null}
    </div>
  )
}
