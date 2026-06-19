import { pickNextLesson } from '@/mocks/lessons'
import { lessonStatusLabel } from '@/mocks/lesson-types'
import { useCurrentProgram } from '@/study'
import { Card, StatusBadge, NoData } from '@/ui'
import styles from './home.module.css'

/**
 * Ближайшая пара на сегодня.
 */
export function NextLesson() {
  const program = useCurrentProgram()
  const lesson = pickNextLesson(program.id)

  return (
    <Card title="Ближайшая пара">
      {!lesson ? (
        <NoData title="На сегодня пар нет" />
      ) : (
        <>
          <p className={styles.lessonTime}>
            {lesson.start}–{lesson.end} · {lesson.subject}
          </p>
          <p className={styles.muted}>
            {lesson.kind} · {lesson.room} · {lesson.teacher}
          </p>
          <StatusBadge status={lesson.status} label={lessonStatusLabel[lesson.status]} />
          {lesson.note ? <p className={styles.note}>{lesson.note}</p> : null}
        </>
      )}
    </Card>
  )
}
