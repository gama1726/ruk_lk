import { useEffect, useMemo, useState } from 'react'
import { ScheduleCalendar } from '@/blocks/schedule-calendar'
import { ScheduleDayGrid } from '@/blocks/schedule-day-grid'
import { ScheduleSources } from '@/blocks/schedule-sources'
import { isApiConfigured } from '@/apiClient'
import { parseLessonDate } from '@/mocks/lessons'
import { lessonCountsInMonthFromRows, lessonsOnDateFromRows } from '@/schedule'
import { todayIso } from '@/dates'
import { useSchedule } from '@/schedule-store'
import { useCurrentProgram } from '@/study'
import { Loader } from '@/ui'
import styles from './schedule.module.css'

/**
 * Расписание: календарь слева, почасовая сетка справа.
 */
export function Schedule() {
  const program = useCurrentProgram()
  const lessons = useSchedule((s) => s.lessons)
  const scheduleGroup = useSchedule((s) => s.group)
  const scheduleStatus = useSchedule((s) => s.status)
  const loadMonth = useSchedule((s) => s.loadMonth)

  const initialDate = isApiConfigured() ? todayIso() : '2026-06-19'
  const [picked, setPicked] = useState(initialDate)
  const initial = parseLessonDate(initialDate)
  const [year, setYear] = useState(initial.getFullYear())
  const [month, setMonth] = useState(initial.getMonth())

  useEffect(() => {
    void loadMonth(program.id, year, month)
  }, [loadMonth, month, program.id, year])

  const handlePick = (iso: string) => {
    setPicked(iso)
    const d = parseLessonDate(iso)
    setYear(d.getFullYear())
    setMonth(d.getMonth())
  }

  const dayLessons = useMemo(() => lessonsOnDateFromRows(lessons, picked), [lessons, picked])
  const lessonCounts = useMemo(
    () => lessonCountsInMonthFromRows(lessons, year, month),
    [lessons, month, year],
  )

  const loading = scheduleStatus === 'loading' || scheduleStatus === 'idle'
  const groupLabel = scheduleGroup || program.group

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Расписание</h1>

      <div className={styles.layout}>
        <aside className={styles.aside}>
          <ScheduleCalendar
            programId={program.id}
            year={year}
            month={month}
            picked={picked}
            today={isApiConfigured() ? todayIso() : '2026-06-19'}
            lessonCounts={lessonCounts}
            onMonthChange={(y, m, iso) => {
              setYear(y)
              setMonth(m)
              setPicked(iso)
            }}
            onPick={handlePick}
          />
          <ScheduleSources group={groupLabel} />
        </aside>

        <div className={styles.main}>
          {loading ? (
            <Loader />
          ) : dayLessons.length === 0 ? (
            <div className={styles.emptyWrap}>
              <div className={styles.emptyBar}>{picked.split('-').reverse().join('.')}</div>
              <p className={styles.empty}>На этот день занятий нет</p>
            </div>
          ) : (
            <ScheduleDayGrid date={picked} lessons={dayLessons} />
          )}
        </div>
      </div>
    </div>
  )
}
