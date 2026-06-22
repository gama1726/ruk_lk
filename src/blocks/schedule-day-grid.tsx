/**
 * @file Почасовая сетка расписания на выбранный день.
 */

import { dayGridTitle } from '@/mocks/lessons'
import type { Lesson } from '@/mocks/lesson-types'
import { lessonKindShort } from '@/mocks/lesson-types'
import styles from './schedule-day-grid.module.css'

const HOUR_START = 9
const HOUR_END = 22
const HOUR_HEIGHT = 52

const hours = Array.from({ length: HOUR_END - HOUR_START + 1 }, (_, i) => HOUR_START + i)

function toMinutes(time: string) {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

function lessonPlace(lesson: Lesson) {
  if (lesson.status === 'remote') return 'Дистанционно (СДО)'
  if (lesson.room === '—') return 'Дистанционно'
  return lesson.room
}

type Props = {
  date: string
  lessons: Lesson[]
}

/**
 * @param props.date - выбранный день
 * @param props.lessons - пары на этот день
 */
export function ScheduleDayGrid({ date, lessons }: Props) {
  const gridHeight = hours.length * HOUR_HEIGHT

  return (
    <div className={styles.wrap}>
      <div className={styles.bar}>{dayGridTitle(date)}</div>

      <div className={styles.body}>
        <div className={styles.times} style={{ height: gridHeight }}>
          {hours.map((h) => (
            <div key={h} className={styles.timeRow} style={{ height: HOUR_HEIGHT }}>
              <span>{h}</span>
            </div>
          ))}
        </div>

        <div className={styles.grid} style={{ height: gridHeight }}>
          {hours.map((h) => (
            <div key={h} className={styles.hourLine} style={{ top: (h - HOUR_START) * HOUR_HEIGHT }} />
          ))}

          {lessons.map((lesson) => {
            const start = toMinutes(lesson.start)
            const end = toMinutes(lesson.end)
            const top = ((start - HOUR_START * 60) / 60) * HOUR_HEIGHT
            const height = Math.max(((end - start) / 60) * HOUR_HEIGHT - 4, 56)
            const cancelled = lesson.status === 'cancelled'

            return (
              <article
                key={lesson.id}
                className={[styles.event, cancelled ? styles.eventCancelled : ''].filter(Boolean).join(' ')}
                style={{ top, height }}
              >
                <p className={styles.eventTime}>
                  {lesson.start} - {lesson.end} | {lessonKindShort[lesson.kind]} |
                </p>
                <p className={styles.eventSubject}>{lesson.subject}</p>
                <p className={styles.eventPlace}>{lessonPlace(lesson)}</p>
                <p className={styles.eventTeacher}>{lesson.teacher}</p>
              </article>
            )
          })}
        </div>
      </div>
    </div>
  )
}
