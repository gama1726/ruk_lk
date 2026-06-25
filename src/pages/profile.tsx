import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ageWithBirthDate, firstName, maskPhone, noticeDate } from '@/mocks/format'
import { activeDebts } from '@/mocks/debts'
import { notices } from '@/mocks/notices'
import { fetchStudentProfile, mockStudentProfile, type StudentProfileDto } from '@/profile'
import { useCurrentProgram } from '@/study'
import { paths } from '@/paths'
import { Card } from '@/ui'
import { isApiConfigured } from '@/apiClient'
import styles from './profile.module.css'

type FieldProps = {
  label: string
  value: string
}

function Field({ label, value }: FieldProps) {
  return (
    <div className={styles.field}>
      <dt className={styles.fieldLabel}>{label}</dt>
      <dd className={styles.fieldValue}>{value || '—'}</dd>
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

  const [profile, setProfile] = useState<StudentProfileDto | null>(
    isApiConfigured() ? null : mockStudentProfile(),
  )
  const [loading, setLoading] = useState(isApiConfigured())
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isApiConfigured()) return

    let cancelled = false

    fetchStudentProfile()
      .then((data) => {
        if (!cancelled) setProfile(data)
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Не удалось загрузить профиль')
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  if (loading) {
    return (
      <div className={styles.page}>
        <Card padding="lg">
          <p>Загрузка профиля…</p>
        </Card>
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className={styles.page}>
        <Card padding="lg">
          <p>{error ?? 'Профиль недоступен'}</p>
        </Card>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <Card padding="lg" className={styles.hero}>
        <div className={styles.heroInner}>
          <div className={styles.avatar} aria-hidden="true">
            {firstName(profile.fullName).charAt(0)}
          </div>

          <div className={styles.heroBody}>
            <h1 className={styles.name}>{profile.fullName}</h1>

            <div className={styles.badges}>
              <span className={styles.groupBadge}>{profile.group}</span>
              <span className={styles.badge}>Курс {profile.course}</span>
              <span className={styles.badge}>{profile.status}</span>
            </div>

            <dl className={styles.metaGrid}>
              <Field label="Пол" value={profile.gender} />
              <Field label="Личный номер" value={profile.studentId} />
              <Field label="Личная почта" value={profile.email} />
              <Field label="Возраст" value={ageWithBirthDate(profile.birthDate)} />
              <Field label="Вид финансирования" value={profile.funding} />
              <Field label="Контактный номер" value={maskPhone(profile.phone)} />
            </dl>
          </div>
        </div>
      </Card>

      <div className={styles.lowerGrid}>
        <Card title="Информация об обучении" className={styles.educationCard}>
          <div className={styles.infoList}>
            <InfoRow label="Факультет" value={profile.faculty} />
            <InfoRow label="Направление" value={profile.direction} />
            <InfoRow label="Уровень образования" value={profile.level} />
            <InfoRow label="Форма обучения" value={profile.educationForm} />
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
