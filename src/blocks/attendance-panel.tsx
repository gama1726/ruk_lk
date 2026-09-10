/**
 * @file UI посещаемости (студент и родитель).
 */

import { Fragment, useEffect, useMemo, useState } from 'react'
import { ApiError } from '@/apiClient'
import {
  buildAttendancePeriodPresets,
  formatAttendanceDate,
  formatStayDuration,
  isAttendanceAbsent,
  isAttendanceApiEnabled,
  isAttendanceRangeTooLong,
  ATTENDANCE_MAX_RANGE_DAYS,
  lessonStatusLabel,
  type StudentAttendanceDto,
} from '@/attendance'
import {
  attendancePeriodPresets,
  attendanceSummaryForRange,
  filterAttendanceDays,
} from '@/mocks/attendance'
import type { AttendanceDay, AttendanceLesson } from '@/mocks/attendance-types'
import {
  ScreenHeader,
  Select,
  Button,
  Input,
  NoData,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableHeader,
  TableCell,
} from '@/ui'
import styles from '@/pages/attendance.module.css'

type FetchAttendance = (from: string, to: string) => Promise<StudentAttendanceDto>

type Props = {
  subtitle: string
  fetchAttendance: FetchAttendance
  enabled?: boolean
}

function displayGate(gate: string | undefined): string {
  if (!gate) return '—'
  return gate
    .replace(/\s*·\s*опозданий на пары:\s*\d+/gi, '')
    .replace(/\s*·\s*без выхода:\s*\d+/gi, '')
    .trim() || '—'
}

function lessonDotClass(status: string | undefined): string {
  if (status === 'late') return styles.dotLate
  if (status === 'absent') return styles.dotAbsent
  if (status === 'unconfirmed') return styles.dotUnconfirmed
  return styles.dotPresent
}

function lessonDotTitle(lesson: AttendanceLesson): string {
  const parts = [
    lessonStatusLabel(lesson.status),
    `${lesson.startTime}${lesson.endTime ? `–${lesson.endTime}` : ''}`,
    lesson.subject || 'Занятие',
  ]
  if (lesson.status === 'late' && lesson.lateMinutes) {
    parts.push(`${lesson.lateMinutes} мин`)
  }
  return parts.filter(Boolean).join(' · ')
}

function LessonDots({ lessons }: { lessons: AttendanceLesson[] }) {
  if (lessons.length === 0) return null
  const visible = lessons.slice(0, 8)
  const rest = lessons.length - visible.length
  return (
    <span className={styles.dots} aria-label="Статусы пар">
      {visible.map((lesson) => (
        <span
          key={lesson.id}
          className={`${styles.dot} ${lessonDotClass(lesson.status)}`}
          title={lessonDotTitle(lesson)}
        />
      ))}
      {rest > 0 ? <span className={styles.dotsMore}>+{rest}</span> : null}
    </span>
  )
}

function LessonDetails({ lessons }: { lessons: AttendanceLesson[] }) {
  return (
    <ul className={styles.lessonList}>
      {lessons.map((lesson) => (
        <li
          key={lesson.id}
            className={[
              styles.lessonRow,
              lesson.status === 'late' ? styles.lessonLate : '',
              lesson.status === 'absent' ? styles.lessonAbsent : '',
              lesson.status === 'present' ? styles.lessonPresent : '',
              lesson.status === 'unconfirmed' ? styles.lessonUnconfirmed : '',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            <span className={styles.lessonTime}>
              {lesson.startTime}
              {lesson.endTime ? `–${lesson.endTime}` : ''}
            </span>
            <span className={styles.lessonSubject}>{lesson.subject || 'Занятие'}</span>
            <span className={styles.lessonStatus}>
              <span className={`${styles.dot} ${lessonDotClass(lesson.status)}`} aria-hidden="true" />
              {lessonStatusLabel(lesson.status)}
              {lesson.status === 'late' && lesson.lateMinutes ? ` · ${lesson.lateMinutes} мин` : ''}
              {lesson.arrivedAt ? ` · вход ${lesson.arrivedAt}` : ''}
            </span>
          </li>
      ))}
    </ul>
  )
}

export function AttendancePanel({ subtitle, fetchAttendance, enabled = true }: Props) {
  const apiEnabled = isAttendanceApiEnabled()

  const presets = useMemo(
    () => (apiEnabled ? buildAttendancePeriodPresets() : attendancePeriodPresets),
    [apiEnabled],
  )
  const defaultPreset = presets[0]

  const [presetId, setPresetId] = useState(defaultPreset.id)
  const [from, setFrom] = useState(defaultPreset.from)
  const [to, setTo] = useState(defaultPreset.to)
  // Пусто до нажатия «Показать» — без автозапроса в Perco при открытии раздела.
  const [appliedFrom, setAppliedFrom] = useState('')
  const [appliedTo, setAppliedTo] = useState('')

  const [apiData, setApiData] = useState<StudentAttendanceDto | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const hasAppliedPeriod = Boolean(appliedFrom && appliedTo)

  useEffect(() => {
    setExpandedId(null)
  }, [appliedFrom, appliedTo])

  useEffect(() => {
    if (!enabled || !apiEnabled) {
      setLoading(false)
      return
    }
    if (!hasAppliedPeriod) {
      setApiData(null)
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)
    setError(null)
    void (async () => {
      try {
        const result = await fetchAttendance(appliedFrom, appliedTo)
        if (!cancelled) setApiData(result)
      } catch (e) {
        if (!cancelled) {
          setApiData(null)
          setError(e instanceof ApiError ? e.message : e instanceof Error ? e.message : 'Не удалось загрузить проходы')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [enabled, apiEnabled, hasAppliedPeriod, appliedFrom, appliedTo, fetchAttendance])

  const rows = useMemo(() => {
    if (!hasAppliedPeriod) return []
    if (apiEnabled) return apiData?.days ?? []
    return filterAttendanceDays(appliedFrom, appliedTo)
  }, [apiEnabled, apiData, appliedFrom, appliedTo, hasAppliedPeriod])

  const summary = useMemo(() => {
    if (!hasAppliedPeriod) {
      return {
        days: 0,
        absentDays: 0,
        lateLessons: 0,
        unconfirmedLessons: 0,
        earliest: null as string | null,
        latest: null as string | null,
      }
    }
    if (apiEnabled) {
      return (
        apiData?.summary ?? {
          days: 0,
          absentDays: 0,
          lateLessons: 0,
          unconfirmedLessons: 0,
          earliest: null as string | null,
          latest: null as string | null,
        }
      )
    }
    return attendanceSummaryForRange(appliedFrom, appliedTo)
  }, [apiEnabled, apiData, appliedFrom, appliedTo, hasAppliedPeriod])

  const absentDays = summary.absentDays ?? 0
  const lateLessons = summary.lateLessons ?? 0
  const unconfirmedLessons = summary.unconfirmedLessons ?? 0
  const showSummary =
    hasAppliedPeriod &&
    (summary.days > 0 || absentDays > 0 || lateLessons > 0 || unconfirmedLessons > 0)

  const presetOptions = presets.map((p) => ({ value: p.id, label: p.label }))

  const onPresetChange = (id: string) => {
    setPresetId(id)
    const preset = presets.find((p) => p.id === id)
    if (!preset || preset.id === 'custom') return
    setFrom(preset.from)
    setTo(preset.to)
  }

  const applyFilters = () => {
    if (from && to && isAttendanceRangeTooLong(from, to)) {
      setError(`Период не больше ${ATTENDANCE_MAX_RANGE_DAYS} дней`)
      return
    }
    if (!from || !to) {
      setError('Укажите даты периода')
      return
    }
    setError(null)
    setAppliedFrom(from)
    setAppliedTo(to)
  }

  const resetFilters = () => {
    setPresetId(defaultPreset.id)
    setFrom(defaultPreset.from)
    setTo(defaultPreset.to)
    setAppliedFrom('')
    setAppliedTo('')
    setApiData(null)
    setError(null)
  }

  const toggleExpand = (row: AttendanceDay) => {
    if (!row.lessons?.length) return
    setExpandedId((prev) => (prev === row.id ? null : row.id))
  }

  return (
    <>
      <ScreenHeader title="Посещаемость" subtitle={subtitle} />

      <div className={styles.filters}>
        <Select
          label="Период"
          options={presetOptions}
          value={presetId}
          onChange={(e) => onPresetChange(e.target.value)}
        />
        <Input
          label="С даты"
          type="date"
          value={from}
          onChange={(e) => {
            setPresetId('custom')
            setFrom(e.target.value)
          }}
        />
        <Input
          label="По дату"
          type="date"
          value={to}
          onChange={(e) => {
            setPresetId('custom')
            setTo(e.target.value)
          }}
        />
        <div className={styles.filterActions}>
          <Button type="button" onClick={applyFilters} disabled={loading}>
            Показать
          </Button>
          <Button type="button" variant="ghost" onClick={resetFilters} disabled={loading}>
            Сбросить
          </Button>
        </div>
      </div>

      {loading ? <p>Загрузка…</p> : null}
      {error ? <p className={styles.error}>{error}</p> : null}

      {!loading && !error && showSummary ? (
        <section className={styles.summary} aria-label="Сводка за период">
          <div className={styles.summaryRow}>
            <span className={styles.summaryLabel}>Дней в вузе</span>
            <span className={styles.summaryValue}>{summary.days}</span>
          </div>
          <div className={styles.summaryRow}>
            <span className={styles.summaryLabel}>Дней без присутствия</span>
            <span className={`${styles.summaryValue} ${absentDays > 0 ? styles.summaryAbsent : ''}`}>
              {absentDays}
            </span>
          </div>
          <div className={styles.summaryRow}>
            <span className={styles.summaryLabel}>Опозданий на пары</span>
            <span className={`${styles.summaryValue} ${lateLessons > 0 ? styles.summaryLate : ''}`}>
              {lateLessons}
            </span>
          </div>
          <div className={styles.summaryRow}>
            <span className={styles.summaryLabel}>Без выхода</span>
            <span
              className={`${styles.summaryValue} ${unconfirmedLessons > 0 ? styles.summaryUnconfirmed : ''}`}
            >
              {unconfirmedLessons}
            </span>
          </div>
          <div className={styles.summaryRow}>
            <span className={styles.summaryLabel}>Самый ранний приход</span>
            <span className={styles.summaryValue}>{summary.earliest ?? '—'}</span>
          </div>
          <div className={styles.summaryRow}>
            <span className={styles.summaryLabel}>Самый поздний уход</span>
            <span className={styles.summaryValue}>{summary.latest ?? '—'}</span>
          </div>
        </section>
      ) : null}

      {!loading && !error && !hasAppliedPeriod ? (
        <NoData
          title="Выберите период"
          description="Укажите даты и нажмите «Показать», чтобы загрузить проходы."
        />
      ) : null}

      {!loading && !error && hasAppliedPeriod && rows.length === 0 ? (
        <NoData
          title="Нет данных"
          description={
            apiEnabled
              ? 'За выбранный период нет проходов СКУД и очных занятий по расписанию.'
              : 'За выбранный период отметок о приходе и уходе нет.'
          }
        />
      ) : null}

      {!loading && !error && hasAppliedPeriod && rows.length > 0 ? (
        <>
          <div className={styles.tableWrap}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeader className={styles.expandCol} />
                  <TableHeader>Дата</TableHeader>
                  <TableHeader>Пришёл в вуз</TableHeader>
                  <TableHeader>Ушёл из вуза</TableHeader>
                  <TableHeader>Время в вузе</TableHeader>
                  <TableHeader>КПП / пары</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((r) => {
                  const absent = isAttendanceAbsent(r)
                  const lessons = r.lessons ?? []
                  const expandable = lessons.length > 0
                  const expanded = expandedId === r.id
                  return (
                    <Fragment key={r.id}>
                      <TableRow
                        className={[
                          absent ? styles.rowAbsent : '',
                          expandable ? styles.rowExpandable : '',
                          expanded ? styles.rowExpanded : '',
                        ]
                          .filter(Boolean)
                          .join(' ')}
                        onClick={expandable ? () => toggleExpand(r) : undefined}
                      >
                        <TableCell className={styles.expandCol}>
                          {expandable ? (
                            <span className={styles.chevron} aria-hidden="true">
                              {expanded ? '▾' : '▸'}
                            </span>
                          ) : null}
                        </TableCell>
                        <TableCell>{formatAttendanceDate(r.date)}</TableCell>
                        {absent ? (
                          <TableCell className={styles.absentCell} colSpan={3}>
                            Отсутствовал
                          </TableCell>
                        ) : (
                          <>
                            <TableCell className={styles.timeCell}>{r.checkIn || '—'}</TableCell>
                            <TableCell className={styles.timeCell}>{r.checkOut || '—'}</TableCell>
                            <TableCell>{formatStayDuration(r.checkIn, r.checkOut)}</TableCell>
                          </>
                        )}
                        <TableCell className={absent ? styles.absentGate : styles.gateCell}>
                          <div className={styles.gateStack}>
                            {!absent ? <LessonDots lessons={lessons} /> : null}
                            <span>{absent ? (r.gate ?? '—') : displayGate(r.gate)}</span>
                          </div>
                        </TableCell>
                      </TableRow>
                      {expanded ? (
                        <TableRow className={styles.detailRow}>
                          <TableCell colSpan={6}>
                            <LessonDetails lessons={lessons} />
                          </TableCell>
                        </TableRow>
                      ) : null}
                    </Fragment>
                  )
                })}
              </TableBody>
            </Table>
          </div>

          <ul className={styles.cards}>
            {rows.map((r) => {
              const absent = isAttendanceAbsent(r)
              const lessons = r.lessons ?? []
              const expandable = lessons.length > 0
              const expanded = expandedId === r.id
              return (
                <li
                  key={r.id}
                  className={[
                    styles.card,
                    absent ? styles.cardAbsent : '',
                    expandable ? styles.cardExpandable : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                >
                  <button
                    type="button"
                    className={styles.cardToggle}
                    onClick={() => toggleExpand(r)}
                    disabled={!expandable}
                    aria-expanded={expanded}
                  >
                    <span className={styles.cardHead}>
                      {expandable ? (
                        <span className={styles.chevron} aria-hidden="true">
                          {expanded ? '▾' : '▸'}
                        </span>
                      ) : null}
                      <strong className={absent ? styles.absentTitle : undefined}>
                        {formatAttendanceDate(r.date)}
                      </strong>
                      {!absent && lessons.length > 0 ? <LessonDots lessons={lessons} /> : null}
                    </span>
                  </button>
                  {absent ? (
                    <>
                      <p className={styles.absentStatus}>Отсутствовал</p>
                      {r.gate ? <p className={styles.cardLine}>{r.gate}</p> : null}
                    </>
                  ) : (
                    <>
                      <p className={styles.cardLine}>
                        Пришёл: <span className={styles.timeCell}>{r.checkIn || '—'}</span>
                        {' · '}
                        Ушёл: <span className={styles.timeCell}>{r.checkOut || '—'}</span>
                      </p>
                      <p className={styles.cardLine}>
                        В вузе: {formatStayDuration(r.checkIn, r.checkOut)}
                      </p>
                      {r.gate ? <p className={styles.cardLine}>{displayGate(r.gate)}</p> : null}
                    </>
                  )}
                  {expanded ? <LessonDetails lessons={lessons} /> : null}
                </li>
              )
            })}
          </ul>
        </>
      ) : null}
    </>
  )
}
