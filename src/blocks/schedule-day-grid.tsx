/**
 * @file Почасовая сетка расписания на выбранный день.
 */

import { dayGridTitle } from '@/mocks/lessons'
import type { Lesson } from '@/mocks/lesson-types'
import { lessonKindShort } from '@/mocks/lesson-types'
import styles from './schedule-day-grid.module.css'

const HOUR_START = 8
const HOUR_END = 22
const HOUR_HEIGHT = 52

const hours = Array.from({ length: HOUR_END - HOUR_START + 1 }, (_, i) => HOUR_START + i)

function toMinutes(time: string) {
  const match = time.match(/(\d{1,2}):(\d{2})/)
  if (!match) return HOUR_START * 60
  return Number(match[1]) * 60 + Number(match[2])
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
            const slotHeight = ((end - start) / 60) * HOUR_HEIGHT - 4
            const cancelled = lesson.status === 'cancelled'
            const meta = [lessonPlace(lesson), lesson.teacher].filter(Boolean).join(' · ')

            return (
              <article
                key={lesson.id}
                className={[styles.event, cancelled ? styles.eventCancelled : ''].filter(Boolean).join(' ')}
                style={{ top, height: slotHeight }}
                title={[lesson.subject, meta].join('\n')}
              >
                <p className={styles.eventTime}>
                  {lesson.start}–{lesson.end} · {lessonKindShort[lesson.kind]}
                </p>
                <p className={styles.eventSubject}>{lesson.subject}</p>
                <p className={styles.eventMeta}>{meta}</p>
              </article>
            )
          })}
        </div>
      </div>
    </div>
  )
}
