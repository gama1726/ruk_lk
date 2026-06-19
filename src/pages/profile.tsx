import { Link } from 'react-router-dom'
import { student } from '@/mocks/student'
import { ageWithBirthDate, firstName, maskPhone, noticeDate } from '@/mocks/format'
import { activeDebts } from '@/mocks/debts'
import { notices } from '@/mocks/notices'
import { useCurrentProgram } from '@/study'
import { paths } from '@/paths'
import { Card } from '@/ui'
import styles from './profile.module.css'

type FieldProps = {
  label: string
  value: string
}

function Field({ label, value }: FieldProps) {
  return (
    <div className={styles.field}>
      <dt className={styles.fieldLabel}>{label}</dt>
      <dd className={styles.fieldValue}>{value}</dd>
    </div>
  )
}

type InfoRowProps = {
  label: string
  value: string
}

function InfoRow({ label, value }: InfoRowProps) {
  return (
    <div className={styles.infoRow}>
      <span className={styles.infoLabel}>{label}</span>
      <span className={styles.infoValue}>{value}</span>
    </div>
  )
}

/**
 * Профиль студента в раскладке портала: карточка ФИО, обучение, задолженности, уведомления.
 */
export function Profile() {
  const program = useCurrentProgram()
  const debts = activeDebts(program.id)
  const recentNotices = notices.slice(0, 5)

  return (
    <div className={styles.page}>
      <Card padding="lg" className={styles.hero}>
        <div className={styles.heroInner}>
          <div className={styles.avatar} aria-hidden="true">
            {firstName(student.fullName).charAt(0)}
          </div>

          <div className={styles.heroBody}>
            <h1 className={styles.name}>{student.fullName}</h1>

            <div className={styles.badges}>
              <span className={styles.groupBadge}>{program.group}</span>
              <span className={styles.badge}>Курс {program.course}</span>
              <span className={styles.badge}>{program.status}</span>
            </div>

            <dl className={styles.metaGrid}>
              <Field label="Логин" value={student.corporateEmail} />
              <Field label="Пол" value={student.gender} />
              <Field label="Личный номер" value={student.studentId} />
              <Field label="Личная почта" value={student.personalEmail} />
              <Field label="Возраст" value={ageWithBirthDate(student.birthDate)} />
              <Field label="Вид финансирования" value={student.funding} />
              <Field label="Контактный номер" value={maskPhone(student.phone)} />
            </dl>
          </div>
        </div>
      </Card>

      <div className={styles.lowerGrid}>
        <Card title="Информация об обучении" className={styles.educationCard}>
          <div className={styles.infoList}>
            <InfoRow label="Факультет" value={program.faculty} />
            <InfoRow label="Направление" value={program.direction} />
            <InfoRow label="Форма обучения" value={program.form} />
            <InfoRow label="Кафедра" value={program.department} />
            <InfoRow label="Уровень" value={program.level} />
            <InfoRow label="Код записи" value={program.recordCode} />
          </div>
        </Card>

        <div className={styles.sideStack}>
          <Card padding="lg" className={styles.debtCard}>
            {debts.length === 0 ? (
              <div className={styles.debtOk}>
                <span className={styles.debtIcon} aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="40" height="40">
                    <path
                      fill="currentColor"
                      d="M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"
                    />
                  </svg>
                </span>
                <p className={styles.debtTitle}>Нет академических задолженностей</p>
              </div>
            ) : (
              <div>
                <p className={styles.debtTitle}>Есть академические задолженности</p>
                <Link to={paths.debts} className={styles.debtLink}>
                  Перейти к задолженностям ({debts.length})
                </Link>
              </div>
            )}
          </Card>

          <Card className={styles.noticesCard}>
            <div className={styles.noticesHeader}>
              <h2 className={styles.noticesTitle}>Уведомления</h2>
              <Link to={paths.news} className={styles.allLink}>
                Все уведомления
              </Link>
            </div>
            <ul className={styles.noticeList}>
              {recentNotices.map((n) => (
                <li key={n.id} className={styles.noticeItem}>
                  <span className={styles.noticeIcon} aria-hidden="true" />
                  <div className={styles.noticeBody}>
                    <p className={styles.noticeTitle}>{n.title}</p>
                    <p className={styles.noticeDate}>{noticeDate(n.date)}</p>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  )
}
