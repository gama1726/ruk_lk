import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { NoticeCategoryIcon } from '@/blocks/notice-category-icon'
import { ageWithBirthDate, courseLabel, maskPhone, noticeDate } from '@/mocks/format'
import { notices } from '@/mocks/notices'
import { mockStudentProfile } from '@/profile'
import { useStudentProfile } from '@/student-profile-store'
import { paths } from '@/paths'
import { isApiConfigured } from '@/apiClient'
import {
  fetchPassPhotoSubmission,
  isPassPhotoApiEnabled,
  passPhotoImageUrl,
  passPhotoStatusLabel,
} from '@/pass-photo'
import { Card, StudentAvatar } from '@/ui'
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
      <dt className={styles.infoLabel}>{label}</dt>
      <dd className={styles.infoValue}>{value || '—'}</dd>
    </div>
  )
}

/**
 * Профиль студента в раскладке портала: карточка ФИО, обучение, задолженности, уведомления.
 */
export function Profile() {
  const profile = useStudentProfile((s) => s.profile)
  const profileStatus = useStudentProfile((s) => s.status)
  const loadProfile = useStudentProfile((s) => s.load)

  const [passPhotoSrc, setPassPhotoSrc] = useState<string | null>(null)
  const [passPhotoStatus, setPassPhotoStatus] = useState<string | null>(null)

  // Задолженности и уведомления — моки до API; на профиле пока без долгов
  const debts = [] as const
  const recentNotices = notices.slice(0, 5)

  useEffect(() => {
    if (isApiConfigured() && profileStatus === 'idle') {
      void loadProfile()
    }
  }, [loadProfile, profileStatus])

  useEffect(() => {
    if (!isPassPhotoApiEnabled()) return
    void (async () => {
      try {
        const sub = await fetchPassPhotoSubmission()
        setPassPhotoStatus(sub.status ? passPhotoStatusLabel[sub.status] : null)
        if (sub.status === 'PERCO_SYNCED' && sub.id) {
          setPassPhotoSrc(passPhotoImageUrl(sub.id))
        }
      } catch {
        setPassPhotoSrc(null)
        setPassPhotoStatus(null)
      }
    })()
  }, [profileStatus])

  const loading = isApiConfigured() && (profileStatus === 'loading' || profileStatus === 'idle')
  const displayProfile = profile ?? (isApiConfigured() ? null : mockStudentProfile())

  if (loading) {
    return (
      <div className={styles.page}>
        <Card padding="lg">
          <p>Загрузка профиля…</p>
        </Card>
      </div>
    )
  }

  if (!displayProfile) {
    return (
      <div className={styles.page}>
        <Card padding="lg">
          <p>Профиль недоступен</p>
        </Card>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <Card padding="lg" className={styles.hero}>
        <div className={styles.heroInner}>
          <StudentAvatar
            gender={displayProfile.gender}
            photoSrc={passPhotoSrc}
            size="lg"
            aria-hidden="true"
          />

          <div className={styles.heroBody}>
            <h1 className={styles.name}>{displayProfile.fullName}</h1>

            <div className={styles.badges}>
              <span className={styles.groupBadge}>{displayProfile.group}</span>
              <span className={styles.courseBadge}>
                Курс {courseLabel(displayProfile.course)}
              </span>
              <span className={styles.statusBadge}>{displayProfile.status}</span>
            </div>

            <dl className={styles.metaGrid}>
              <Field label="Пол" value={displayProfile.gender} />
              <Field label="Личный номер" value={displayProfile.studentId} />
              {passPhotoStatus && (
                <Field label="Фото для пропуска" value={passPhotoStatus} />
              )}
              <Field label="Личная почта" value={displayProfile.email} />
              <Field label="Возраст" value={ageWithBirthDate(displayProfile.birthDate)} />
              <Field label="Вид финансирования" value={displayProfile.funding} />
              <Field label="Контактный номер" value={maskPhone(displayProfile.phone)} />
            </dl>

            {isPassPhotoApiEnabled() && (
              <p className={styles.passPhotoLink}>
                <Link to={paths.passPhoto}>Фото для пропуска</Link>
              </p>
            )}
          </div>
        </div>
      </Card>

      <div className={styles.lowerGrid}>
        <Card title="Информация об обучении" className={styles.educationCard}>
          <dl className={styles.infoList}>
            <InfoRow label="Факультет" value={displayProfile.faculty} />
            <InfoRow label="Кафедра" value={displayProfile.department} />
            <InfoRow label="Направление" value={displayProfile.direction} />
            <InfoRow label="Уровень образования" value={displayProfile.level} />
            <InfoRow label="Форма обучения" value={displayProfile.educationForm} />
          </dl>
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
                  <NoticeCategoryIcon category={n.category} />
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
