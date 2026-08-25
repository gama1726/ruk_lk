/**
 * @file Почасовая сетка расписания на выбранный день.
 */

import { dayGridTitle } from '@/mocks/lessons'
import type { Lesson } from '@/mocks/lesson-types'
import { lessonKindShort } from '@/mocks/lesson-types'
import styles from './schedule-day-grid.module.css'

/** Высота одного часа — достаточно для читаемого текста в паре ~45–90 мин */
const HOUR_HEIGHT = 100
const DAY_HOUR_START = 8
const DAY_HOUR_END = 22
/** Минимальная высота карточки, чтобы не схлопывался текст */
const MIN_EVENT_HEIGHT = 72

function toMinutes(time: string) {
  const match = time.match(/(\d{1,2})[:.](\d{2})/)
  if (!match) return DAY_HOUR_START * 60
  return Number(match[1]) * 60 + Number(match[2])
}

function lessonPlace(lesson: Lesson) {
  if (lesson.status === 'remote') return 'Дистанционно (СДО)'
  if (lesson.room === '—') return 'Дистанционно'
  return lesson.room
}

function hourRange(lessons: Lesson[]): { start: number; end: number } {
  if (lessons.length === 0) {
    return { start: DAY_HOUR_START, end: Math.min(DAY_HOUR_START + 8, DAY_HOUR_END) }
  }

  let minMin = Infinity
  let maxMin = -Infinity
  for (const lesson of lessons) {
    minMin = Math.min(minMin, toMinutes(lesson.start))
    maxMin = Math.max(maxMin, toMinutes(lesson.end))
  }

  const start = Math.max(DAY_HOUR_START, Math.floor(minMin / 60) - 1)
  const end = Math.min(DAY_HOUR_END, Math.ceil(maxMin / 60) + 1)
  return { start, end: Math.max(end, start + 1) }
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
  const { start: hourStart, end: hourEnd } = hourRange(lessons)
  const hours = Array.from({ length: hourEnd - hourStart + 1 }, (_, i) => hourStart + i)
  const gridHeight = hours.length * HOUR_HEIGHT

  return (
    <div className={styles.wrap}>
      <div className={styles.bar}>{dayGridTitle(date)}</div>

      <div className={styles.body}>
        <div className={styles.times} style={{ height: gridHeight }}>
          {hours.map((h) => (
            <div key={h} className={styles.timeRow} style={{ height: HOUR_HEIGHT }}>
              <span>{String(h).padStart(2, '0')}:00</span>
            </div>
          ))}
        </div>

        <div className={styles.grid} style={{ height: gridHeight }}>
          {hours.map((h) => (
            <div
              key={h}
              className={styles.hourLine}
              style={{ top: (h - hourStart) * HOUR_HEIGHT }}
            />
          ))}

          {lessons.map((lesson) => {
            const start = toMinutes(lesson.start)
            const end = Math.max(toMinutes(lesson.end), start + 45)
            const top = ((start - hourStart * 60) / 60) * HOUR_HEIGHT
            const naturalHeight = ((end - start) / 60) * HOUR_HEIGHT - 6
            const slotHeight = Math.max(naturalHeight, MIN_EVENT_HEIGHT)
            const cancelled = lesson.status === 'cancelled'
            const meta = [lessonPlace(lesson), lesson.teacher].filter(Boolean).join(' · ')

            return (
              <article
                key={lesson.id}
                className={[styles.event, cancelled ? styles.eventCancelled : ''].filter(Boolean).join(' ')}
                style={{ top, height: slotHeight }}
                title={[lesson.subject, `${lesson.start}–${lesson.end}`, meta].join('\n')}
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
