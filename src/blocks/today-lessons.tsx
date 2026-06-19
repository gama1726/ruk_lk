import { Link } from 'react-router-dom'
import { todayLessons } from '@/mocks/lessons'
import { lessonStatusLabel } from '@/mocks/lesson-types'
import { useCurrentProgram } from '@/study'
import { paths } from '@/paths'
import { Card, StatusBadge, NoData } from '@/ui'
import styles from './home.module.css'

/**
 * Расписание на сегодня — компактный список.
 */
export function TodayLessons() {
  const program = useCurrentProgram()
  const lessons = todayLessons(program.id)

  return (
    <Card
      title="Сегодня"
      className={styles.wide}
    >
      {lessons.length === 0 ? (
        <NoData title="Занятий нет" />
      ) : (
        <>
          <ul className={styles.lessonList}>
            {lessons.map((lesson) => (
              <li key={lesson.id} className={styles.lessonRow}>
                <span className={styles.lessonTime}>
                  {lesson.start}–{lesson.end} · {lesson.subject}
                </span>
                <span className={styles.lessonMeta}>
                  {lesson.kind} · {lesson.room}
                </span>
                <StatusBadge status={lesson.status} label={lessonStatusLabel[lesson.status]} />
              </li>
            ))}
          </ul>
          <p className={styles.note}>
            <Link to={paths.schedule}>Полное расписание</Link>
          </p>
        </>
      )}
    </Card>
  )
}
