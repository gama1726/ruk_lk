import { useState } from 'react'
import { ScheduleCalendar } from '@/blocks/schedule-calendar'
import { ScheduleDayGrid } from '@/blocks/schedule-day-grid'
import { ScheduleSources } from '@/blocks/schedule-sources'
import { DEMO_TODAY, lessonsOnDate, parseLessonDate } from '@/mocks/lessons'
import { useCurrentProgram } from '@/study'
import styles from './schedule.module.css'

/**
 * Расписание: календарь слева, почасовая сетка справа.
 * Данные зависят от {@link useCurrentProgram}.
 */
export function Schedule() {
  const program = useCurrentProgram()
  const [picked, setPicked] = useState(DEMO_TODAY)
  const initial = parseLessonDate(DEMO_TODAY)
  const [year, setYear] = useState(initial.getFullYear())
  const [month, setMonth] = useState(initial.getMonth())

  const dayLessons = lessonsOnDate(program.id, picked)

  const handlePick = (iso: string) => {
    setPicked(iso)
    const d = parseLessonDate(iso)
    setYear(d.getFullYear())
    setMonth(d.getMonth())
  }

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
            onMonthChange={(y, m) => {
              setYear(y)
              setMonth(m)
            }}
            onPick={handlePick}
          />
          <ScheduleSources group={program.group} />
        </aside>

        <div className={styles.main}>
          {dayLessons.length === 0 ? (
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
