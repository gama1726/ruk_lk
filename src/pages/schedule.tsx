import { useState } from 'react'
import { programLabel } from '@/mocks/format'
import {
  DEMO_TODAY,
  dayCaption,
  lessonsInWeek,
  lessonsOnDate,
  mondayOf,
  shiftWeek,
  weekCaption,
  weekDays,
} from '@/mocks/lessons'
import { lessonStatusLabel } from '@/mocks/lesson-types'
import { useCurrentProgram } from '@/study'
import { ScreenHeader, Button, Select, NoData, StatusBadge } from '@/ui'
import styles from './schedule.module.css'

type View = 'week' | 'day'

/**
 * Раздел «Расписание»: недельная сетка и список на день.
 * Данные зависят от {@link useCurrentProgram}.
 */
export function Schedule() {
  const program = useCurrentProgram()
  const [weekStart, setWeekStart] = useState(() => mondayOf(DEMO_TODAY))
  const [view, setView] = useState<View>('week')
  const [pickedDay, setPickedDay] = useState(DEMO_TODAY)

  const days = weekDays(weekStart)
  const dayLessons = lessonsOnDate(program.id, pickedDay)

  const dayOptions = days.map((d) => ({ value: d, label: dayCaption(d) }))

  return (
    <>
      <ScreenHeader title="Расписание" subtitle={programLabel(program)} />

      <div className={styles.scheduleToolbar}>
        <div className={styles.weekNav}>
          <Button variant="ghost" size="sm" type="button" onClick={() => setWeekStart((w) => shiftWeek(w, -1))}>
            ←
          </Button>
          <span className={styles.weekLabel}>{weekCaption(weekStart)}</span>
          <Button variant="ghost" size="sm" type="button" onClick={() => setWeekStart((w) => shiftWeek(w, 1))}>
            →
          </Button>
        </div>

        <div className={styles.viewTabs} role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={view === 'week'}
            className={[styles.viewTab, view === 'week' ? styles.viewTabActive : ''].filter(Boolean).join(' ')}
            onClick={() => setView('week')}
          >
            Неделя
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={view === 'day'}
            className={[styles.viewTab, view === 'day' ? styles.viewTabActive : ''].filter(Boolean).join(' ')}
            onClick={() => setView('day')}
          >
            День
          </button>
        </div>
      </div>

      {view === 'week' ? (
        lessonsInWeek(program.id, weekStart).length === 0 ? (
          <NoData title="На этой неделе занятий нет" />
        ) : (
          <div className={styles.weekGrid}>
            {days.map((date) => {
              const items = lessonsOnDate(program.id, date)
              const isToday = date === DEMO_TODAY
              return (
                <div
                  key={date}
                  className={[styles.dayCol, isToday ? styles.dayColToday : ''].filter(Boolean).join(' ')}
                >
                  <div className={styles.dayHead}>{dayCaption(date)}</div>
                  <div className={styles.dayBody}>
                    {items.length === 0 ? (
                      <span className={styles.lessonSub}>—</span>
                    ) : (
                      items.map((lesson) => (
                        <div key={lesson.id} className={styles.lessonCard}>
                          <div className={styles.lessonTime}>
                            {lesson.start} · {lesson.subject}
                          </div>
                          <div className={styles.lessonSub}>
                            {lesson.kind} · {lesson.room}
                          </div>
                          <StatusBadge status={lesson.status} label={lessonStatusLabel[lesson.status]} />
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )
      ) : (
        <>
          <div className={styles.dayPick}>
            <Select
              label="День"
              options={dayOptions}
              value={pickedDay}
              onChange={(e) => setPickedDay(e.target.value)}
            />
          </div>
          {dayLessons.length === 0 ? (
            <NoData title="В этот день пар нет" />
          ) : (
            <ul className={styles.dayList}>
              {dayLessons.map((lesson) => (
                <li key={lesson.id} className={styles.dayRow}>
                  <div className={styles.dayRowHead}>
                    <strong>
                      {lesson.start}–{lesson.end} · {lesson.subject}
                    </strong>
                    <StatusBadge status={lesson.status} label={lessonStatusLabel[lesson.status]} />
                  </div>
                  <p className={styles.lessonSub}>
                    {lesson.kind} · {lesson.room} · {lesson.teacher}
                  </p>
                  {lesson.note ? <p className={styles.lessonSub}>{lesson.note}</p> : null}
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </>
  )
}
