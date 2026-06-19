import { student } from '@/mocks/student'
import { maskPhone, programLabel } from '@/mocks/format'
import { useCurrentProgram, useStudy } from '@/study'
import { ScreenHeader, Card, Badge } from '@/ui'
import styles from './profile.module.css'

type RowProps = {
  label: string
  value: string
}

/**
 * @param props.label - подпись слева
 * @param props.value - значение справа
 */
function Row({ label, value }: RowProps) {
  return (
    <div className={styles.row}>
      <dt className={styles.dt}>{label}</dt>
      <dd className={styles.dd}>{value}</dd>
    </div>
  )
}

/**
 * Профиль студента.
 * Блок «Информация об обучении» читает {@link useCurrentProgram};
 * контакты общие для аккаунта.
 */
export function Profile() {
  const program = useCurrentProgram()
  const activeId = useStudy((s) => s.activeId)

  return (
    <>
      <ScreenHeader title="Профиль" subtitle={student.fullName} />

      <div className={styles.profileGrid}>
        <Card title="Контакты">
          <dl className={styles.dl}>
            <Row label="Корпоративная почта" value={student.corporateEmail} />
            <Row label="Личная почта" value={student.personalEmail} />
            <Row label="Телефон" value={maskPhone(student.phone)} />
          </dl>
        </Card>

        <Card title="Информация об обучении">
          <dl className={styles.dl}>
            <Row label="Номер студенческого" value={student.studentId} />
            <Row label="Группа" value={program.group} />
            <Row label="Курс" value={String(program.course)} />
            <Row label="Направление" value={program.direction} />
            <Row label="Форма обучения" value={program.form} />
            <Row label="Статус" value={program.status} />
            <Row label="Факультет" value={program.faculty} />
            <Row label="Кафедра" value={program.department} />
            <Row label="Код записи" value={program.recordCode} />
          </dl>
        </Card>

        {student.programs.length > 1 ? (
          <Card title="Мои образовательные программы">
            <ul className={styles.programList}>
              {student.programs.map((p) => {
                const active = p.id === activeId
                return (
                  <li
                    key={p.id}
                    className={[styles.programItem, active ? styles.programItemActive : ''].filter(Boolean).join(' ')}
                  >
                    <div>{programLabel(p)}</div>
                    <p className={styles.programMeta}>
                      {p.recordCode} · {p.status}
                      {active ? (
                        <>
                          {' '}
                          <Badge variant="primary">текущая</Badge>
                        </>
                      ) : null}
                    </p>
                  </li>
                )
              })}
            </ul>
          </Card>
        ) : null}
      </div>
    </>
  )
}
