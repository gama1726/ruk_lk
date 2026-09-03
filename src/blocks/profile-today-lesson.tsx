/**
 * @file Блок «Сегодня» на профиле: следующая / текущая пара.
 */

import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { todayIso } from '@/dates'
import { DEMO_TODAY, pickNextLesson, todayLessons } from '@/mocks/lessons'
import type { Lesson } from '@/mocks/lesson-types'
import { paths } from '@/paths'
import {
  apiDateToIso,
  fetchSchedule,
  isScheduleApiEnabled,
  lessonTimingLabel,
  mapScheduleLesson,
  nowHm,
  pickNextLessonFromRows,
  remainingLessonsToday,
} from '@/schedule'
import { useCurrentProgram } from '@/study'
import { Card } from '@/ui'
import styles from './profile-today-lesson.module.css'

type LoadState = 'loading' | 'ready' | 'empty' | 'error'

function normalizeLessonDate(date: string): string {
  return date.includes('.') ? apiDateToIso(date) : date
}

export function ProfileTodayLesson() {
  const program = useCurrentProgram()
  const [lesson, setLesson] = useState<Lesson | null>(null)
  const [remaining, setRemaining] = useState(0)
  const [timing, setTiming] = useState('')
  const [state, setState] = useState<LoadState>(isScheduleApiEnabled() ? 'loading' : 'ready')

  useEffect(() => {
    let cancelled = false

    if (!isScheduleApiEnabled()) {
      const clock = '11:45'
      const day = todayLessons(program.id)
      const next = pickNextLesson(program.id)
      setLesson(next)
      setRemaining(remainingLessonsToday(day, DEMO_TODAY, clock))
      setTiming(next ? lessonTimingLabel(next, clock) : '')
      setState(next ? 'ready' : 'empty')
      return
    }

    setState('loading')
    void (async () => {
      try {
        const dto = await fetchSchedule()
        if (cancelled) return

        const dateIso = todayIso()
        const clock = nowHm()
        const rows = dto.lessons.map((row) => {
          const mapped = mapScheduleLesson(row, program.id)
          return { ...mapped, date: normalizeLessonDate(mapped.date) }
        })
        const next = pickNextLessonFromRows(rows, dateIso, clock)

        setLesson(next)
        setRemaining(remainingLessonsToday(rows, dateIso, clock))
        setTiming(next ? lessonTimingLabel(next, clock) : '')
        setState(next ? 'ready' : 'empty')
      } catch {
        if (!cancelled) {
          setLesson(null)
          setRemaining(0)
          setTiming('')
          setState('error')
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [program.id])

  return (
    <Card title="Сегодня" className={styles.card}>
      {state === 'loading' ? (
        <p className={styles.hint}>Загружаем расписание…</p>
      ) : null}

      {state === 'error' ? (
        <div className={styles.empty}>
          <p className={styles.emptyTitle}>Не удалось загрузить расписание</p>
          <Link to={paths.schedule} className={styles.link}>
            Открыть расписание
          </Link>
        </div>
      ) : null}

      {state === 'empty' ? (
        <div className={styles.empty}>
          <p className={styles.emptyTitle}>На сегодня пар больше нет</p>
          <p className={styles.hint}>Можно посмотреть расписание на другие дни</p>
          <Link to={paths.schedule} className={styles.link}>
            Полное расписание
          </Link>
        </div>
      ) : null}

      {state === 'ready' && lesson ? (
        <div className={styles.body}>
          <div className={styles.timingRow}>
            <span className={styles.timing}>{timing}</span>
            {remaining > 1 ? (
              <span className={styles.remaining}>ещё {remaining} сегодня</span>
            ) : remaining === 1 ? (
              <span className={styles.remaining}>последняя сегодня</span>
            ) : null}
          </div>

          <p className={styles.time}>
            {lesson.start}–{lesson.end}
          </p>
          <h3 className={styles.subject}>{lesson.subject}</h3>
          <p className={styles.meta}>
            {lesson.kind}
            {lesson.room ? ` · ${lesson.room}` : ''}
            {lesson.teacher ? ` · ${lesson.teacher}` : ''}
          </p>

          <Link to={paths.schedule} className={styles.link}>
            Открыть расписание
          </Link>
        </div>
      ) : null}
    </Card>
  )
}
