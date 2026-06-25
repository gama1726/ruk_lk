import { Link } from 'react-router-dom'
import { useAuth } from '@/auth'
import { programLabel, courseLabel } from '@/mocks/format'
import { useCurrentProgram } from '@/study'
import { useStudentProfile } from '@/student-profile-store'
import { isApiConfigured } from '@/apiClient'
import { paths } from '@/paths'
import { Card } from '@/ui'
import styles from './home.module.css'

/**
 * Краткая карточка студента на главной.
 */
export function StudentStrip() {
  const program = useCurrentProgram()
  const session = useAuth((s) => s.session)
  const profile = useStudentProfile((s) => s.profile)

  const fullName = session?.name ?? profile?.fullName ?? ''
  const studentId = profile?.studentId ?? session?.studentId ?? ''
  const group = profile?.group ?? program.group
  const course = profile?.course ?? program.course
  const courseText = courseLabel(course)

  return (
    <Card className={styles.wide}>
      <div className={styles.studentCard}>
        <div>
          <p className={styles.studentName}>{fullName}</p>
          <p className={styles.studentMeta}>
            {group}
            {courseText ? ` · Курс ${courseText}` : ''}
            {studentId ? ` · № ${studentId}` : ''}
          </p>
          <p className={styles.studentMeta}>
            {isApiConfigured() && profile
              ? `${profile.level} · ${profile.direction}`
              : programLabel(program)}
          </p>
        </div>
        <Link to={paths.profile}>Профиль</Link>
      </div>
    </Card>
  )
}
