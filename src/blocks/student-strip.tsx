import { Link } from 'react-router-dom'
import { student } from '@/mocks/student'
import { programLabel } from '@/mocks/format'
import { useCurrentProgram } from '@/study'
import { paths } from '@/paths'
import { Card } from '@/ui'
import styles from './home.module.css'

/**
 * Краткая карточка студента на главной.
 */
export function StudentStrip() {
  const program = useCurrentProgram()

  return (
    <Card className={styles.wide}>
      <div className={styles.studentCard}>
        <div>
          <p className={styles.studentName}>{student.fullName}</p>
          <p className={styles.studentMeta}>
            {program.group} · {program.course} курс · № {student.studentId}
          </p>
          <p className={styles.studentMeta}>{programLabel(program)}</p>
        </div>
        <Link to={paths.profile}>Профиль</Link>
      </div>
    </Card>
  )
}
