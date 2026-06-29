/**
 * @file Месячный календарь для раздела «Расписание».
 */

import {
  calendarMonth,
  DEMO_TODAY,
  lessonCountsInMonth,
  monthCaption,
  parseLessonDate,
} from '@/mocks/lessons'
import { shiftMonthKeepingDay } from '@/dates'
import styles from './schedule-calendar.module.css'

type Props = {
  programId: string
  year: number
  month: number
  picked: string
  today?: string
  lessonCounts?: Map<string, number>
  onMonthChange: (year: number, month: number, picked: string) => void
  onPick: (iso: string) => void
}

const weekdays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'] as const

/**
 * @param props.programId - активная программа
 * @param props.picked - выбранный день `YYYY-MM-DD`
 */
export function ScheduleCalendar({
  programId,
  year,
  month,
  picked,
  today = DEMO_TODAY,
  lessonCounts,
  onMonthChange,
  onPick,
}: Props) {
  const cells = calendarMonth(year, month)
  const counts = lessonCounts ?? lessonCountsInMonth(programId, year, month)

  return (
    <div className={styles.wrap}>
      <div className={styles.head}>
        <button
          type="button"
          className={styles.navBtn}
          aria-label="Предыдущий месяц"
          onClick={() => {
            const next = shiftMonthKeepingDay(picked, -1)
            onMonthChange(next.year, next.month, next.picked)
          }}
        >
          ‹
        </button>
        <span className={styles.caption}>{monthCaption(year, month)}</span>
        <button
          type="button"
          className={styles.navBtn}
          aria-label="Следующий месяц"
          onClick={() => {
            const next = shiftMonthKeepingDay(picked, 1)
            onMonthChange(next.year, next.month, next.picked)
          }}
        >
          ›
        </button>
      </div>

      <div className={styles.weekdays}>
        {weekdays.map((d) => (
          <span key={d} className={styles.weekday}>
            {d}
          </span>
        ))}
      </div>

      <div className={styles.grid}>
        {cells.map((cell) => {
          const count = counts.get(cell.date) ?? 0
          const selected = cell.date === picked
          const todayMark = cell.date === today
          return (
            <button
              key={cell.date}
              type="button"
              className={[
                styles.day,
                !cell.inMonth ? styles.dayOutside : '',
                selected ? styles.daySelected : '',
                todayMark ? styles.dayToday : '',
              ]
                .filter(Boolean)
                .join(' ')}
              onClick={() => onPick(cell.date)}
            >
              <span className={styles.dayNum}>{parseLessonDate(cell.date).getDate()}</span>
              {count > 0 ? <span className={styles.dayCount}>{count}</span> : null}
            </button>
          )
        })}
      </div>
    </div>
  )
}
