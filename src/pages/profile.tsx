import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ageWithBirthDate, courseLabel, maskPhone, noticeDate } from '@/mocks/format'
import { resolveBranch } from '@/branch-display'
import { mockStudentProfile } from '@/profile'
import { useStudentProfile } from '@/student-profile-store'
import { academicDebtsFromRows } from '@/debts'
import { useRecordBook } from '@/record-book-store'
import { useCurrentProgram } from '@/study'
import { paths } from '@/paths'
import { isApiConfigured } from '@/apiClient'
import { fetchStudentNews, isNewsApiEnabled, type StudentNewsItemDto } from '@/news'
import {
  fetchPassPhotoSubmission,
  isPassPhotoApiEnabled,
  passPhotoImageUrl,
  passPhotoStatusLabel,
} from '@/pass-photo'
import { Card, StudentAvatar, BranchBanner } from '@/ui'
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
  const program = useCurrentProgram()
  const bookRows = useRecordBook((s) => s.rows)
  const bookStatus = useRecordBook((s) => s.status)
  const loadRecordBook = useRecordBook((s) => s.load)

  const [passPhotoSrc, setPassPhotoSrc] = useState<string | null>(null)
  const [passPhotoStatus, setPassPhotoStatus] = useState<string | null>(null)
  const [recentNews, setRecentNews] = useState<StudentNewsItemDto[]>([])

  const debts = useMemo(() => academicDebtsFromRows(bookRows), [bookRows])

  useEffect(() => {
    if (isApiConfigured() && profileStatus === 'idle') {
      void loadProfile()
    }
  }, [loadProfile, profileStatus])

  useEffect(() => {
    if (isApiConfigured() && bookStatus === 'idle') {
      void loadRecordBook(program.id)
    }
  }, [bookStatus, loadRecordBook, program.id])

  useEffect(() => {
    if (!isNewsApiEnabled()) return
    let cancelled = false
    fetchStudentNews()
      .then((dto) => {
        if (cancelled || dto.status === 'unavailable') return
        setRecentNews(
          [...dto.items].sort((a, b) => (b.date || '').localeCompare(a.date || '')),
        )
      })
      .catch(() => {
        if (!cancelled) setRecentNews([])
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!isPassPhotoApiEnabled()) return
    void (async () => {
      try {
        const sub = await fetchPassPhotoSubmission()
        setPassPhotoStatus(sub.status ? passPhotoStatusLabel[sub.status] : null)
        if (sub.status === 'PERCO_SYNCED' && sub.id && sub.useAsAvatar === true) {
          setPassPhotoSrc(passPhotoImageUrl(sub.id))
        } else {
          setPassPhotoSrc(null)
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
      <BranchBanner branch={resolveBranch(displayProfile.branch)} viewerType="student" className={styles.branchBanner} />

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
              <h2 className={styles.noticesTitle}>Новости</h2>
              <Link to={paths.news} className={styles.allLink}>
                Все новости
              </Link>
            </div>
            <ul className={styles.noticeList}>
              {recentNews.length === 0 ? (
                <li className={styles.noticeItem}>
                  <div className={styles.noticeBody}>
                    <p className={styles.noticeTitle}>Пока нет новостей</p>
                  </div>
                </li>
              ) : (
                recentNews.map((n) => (
                  <li key={n.id} className={styles.noticeItem}>
                    <a
                      href={n.url}
                      target="_blank"
                      rel="noreferrer"
                      className={styles.noticeLink}
                    >
                      <p className={styles.noticeTitle}>{n.title}</p>
                      <p className={styles.noticeDate}>{n.date ? noticeDate(n.date) : ''}</p>
                    </a>
                  </li>
                ))
              )}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  )
}
