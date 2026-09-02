import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ApiError } from '@/apiClient'
import { courseLabel, maskPhone } from '@/mocks/format'
import { formatShortDate } from '@/mocks/payment'
import { PARENT_CONSENT_MESSAGE } from '@/parent-consent'
import {
  fetchParentProfile,
  isParentProfileApiEnabled,
  universityContacts,
  type ParentProfileDto,
} from '@/parent-profile'
import { useParentAuth } from '@/parent-auth'
import { paths } from '@/paths'
import { Card, Loader, StudentAvatar } from '@/ui'
import styles from './parent-profile.module.css'

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.field}>
      <dt className={styles.fieldLabel}>{label}</dt>
      <dd className={styles.fieldValue}>{value || '—'}</dd>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.infoRow}>
      <dt className={styles.infoLabel}>{label}</dt>
      <dd className={styles.infoValue}>{value || '—'}</dd>
    </div>
  )
}

function profileFromSession(
  session: NonNullable<ReturnType<typeof useParentAuth.getState>['session']>,
): ParentProfileDto {
  return {
    relation: session.relation,
    parentFullName: session.parentFullName,
    parentEmail: null,
    parentPhone: null,
    isCustomer: session.isCustomer,
    studentAdult: false,
    studentId: session.studentId,
    studentFullName: session.studentFullName,
    dataAccessAllowed: session.dataAccessAllowed,
    consentRequiredMessage: session.consentRequiredMessage,
    student: null,
    academicDebtCount: -1,
    contract: null,
  }
}

function formatContractDate(date: string, displayDate: string): string {
  if (displayDate) return displayDate
  if (date) return formatShortDate(date)
  return '—'
}

export function ParentProfile() {
  const session = useParentAuth((s) => s.session)
  const [profile, setProfile] = useState<ParentProfileDto | null>(null)
  const [loading, setLoading] = useState(isParentProfileApiEnabled())
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!session) return

    if (!isParentProfileApiEnabled()) {
      setProfile(profileFromSession(session))
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)
    setError(null)
    void (async () => {
      try {
        const data = await fetchParentProfile()
        if (!cancelled) setProfile(data)
      } catch (e) {
        if (!cancelled) {
          setProfile(profileFromSession(session))
          setError(e instanceof ApiError ? e.message : 'Не удалось загрузить профиль')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [session])

  if (!session) return null
  if (loading) return <Loader />
  if (!profile) return null

  const student = profile.student
  const consentMessage = profile.consentRequiredMessage ?? PARENT_CONSENT_MESSAGE
  const hasDebts = profile.academicDebtCount > 0
  const contract = profile.contract

  return (
    <div className={styles.page}>
      {!profile.dataAccessAllowed ? (
        <div className={styles.alert} role="alert">
          {consentMessage}{' '}
          <Link to={paths.parentSurvey}>Пройти опрос</Link>
        </div>
      ) : null}

      {error ? <p className={styles.error}>{error}</p> : null}

      <Card padding="lg" className={styles.hero}>
        <div className={styles.heroInner}>
          <StudentAvatar size="lg" aria-hidden="true" />

          <div className={styles.heroBody}>
            <h1 className={styles.name}>{profile.parentFullName}</h1>

            <div className={styles.badges}>
              {profile.relation ? <span className={styles.relationBadge}>{profile.relation}</span> : null}
              {profile.isCustomer ? (
                <span className={styles.customerBadge}>Заказчик / плательщик</span>
              ) : null}
              <span className={styles.linkedBadge}>Связан со студентом</span>
            </div>

            <dl className={styles.metaGrid}>
              <Field label="Роль" value={profile.relation} />
              <Field label="Связанный студент" value={profile.studentFullName} />
              <Field label="Контактный телефон" value={maskPhone(profile.parentPhone)} />
              <Field label="Личная почта" value={profile.parentEmail ?? '—'} />
            </dl>
          </div>
        </div>

        <div className={styles.quickLinks}>
          <Link to={paths.parentSchedule} className={styles.quickLink}>
            <span className={styles.quickLinkTitle}>Обучение</span>
            <span className={styles.quickLinkHint}>Информация о студенте и процессе обучения</span>
          </Link>
          <Link to={paths.parentPayments} className={styles.quickLink}>
            <span className={styles.quickLinkTitle}>Финансы</span>
            <span className={styles.quickLinkHint}>Договоры и платежи</span>
          </Link>
          <Link to={paths.support} className={styles.quickLink}>
            <span className={styles.quickLinkTitle}>Связаться</span>
            <span className={styles.quickLinkHint}>Связь с университетом</span>
          </Link>
        </div>
      </Card>

      {profile.dataAccessAllowed ? (
        <>
          <div className={styles.midGrid}>
            <Card title="Обучающийся" padding="lg" className={styles.studentCard}>
              <h2 className={styles.studentName}>{student?.fullName || profile.studentFullName}</h2>
              <div className={styles.badges}>
                {student?.group ? <span className={styles.groupBadge}>{student.group}</span> : null}
                {student?.course ? (
                  <span className={styles.courseBadge}>Курс {courseLabel(student.course)}</span>
                ) : null}
                {student?.status ? (
                  <span className={styles.studentStatusBadge}>{student.status}</span>
                ) : (
                  <span className={styles.studentStatusBadge}>Является студентом</span>
                )}
              </div>
            </Card>

            <Card title="Статус" padding="lg" className={styles.statusCard}>
              {!hasDebts ? (
                <div className={styles.statusOk}>
                  <span className={styles.statusIcon} aria-hidden="true">
                    <svg viewBox="0 0 24 24" width="40" height="40">
                      <path
                        fill="currentColor"
                        d="M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"
                      />
                    </svg>
                  </span>
                  <p className={styles.statusTitle}>Нет академических задолженностей</p>
                  <p className={styles.statusHint}>Информация актуальна на сегодня</p>
                </div>
              ) : (
                <div className={styles.statusOk}>
                  <p className={styles.statusWarn}>Есть академические задолженности</p>
                  <p className={styles.statusHint}>
                    {profile.academicDebtCount}{' '}
                    {profile.academicDebtCount === 1 ? 'задолженность' : 'задолженности'}
                  </p>
                  <Link to={paths.parentRecordBook} className={styles.quickLinkHint}>
                    Открыть зачётную книжку
                  </Link>
                </div>
              )}
            </Card>
          </div>

          <div className={styles.lowerGrid}>
            <Card title="Информация об обучении" className={styles.educationCard}>
              <dl className={styles.infoList}>
                <InfoRow label="Факультет" value={student?.faculty ?? ''} />
                <InfoRow label="Направление" value={student?.direction ?? ''} />
                <InfoRow label="Уровень" value={student?.level ?? ''} />
                <InfoRow label="Форма обучения" value={student?.educationForm ?? ''} />
              </dl>
            </Card>

            <Card title="Договор и финансирование" className={styles.contractCard}>
              <dl className={styles.infoList}>
                <InfoRow label="Основа" value={contract?.funding ?? student?.funding ?? ''} />
                <InfoRow label="Договор" value={contract?.customerLabel ?? (profile.isCustomer ? 'Заказчик / плательщик' : '')} />
                <InfoRow label="Статус договора" value={contract?.paymentStatusLabel ?? ''} />
                <InfoRow
                  label="Дата заключения"
                  value={formatContractDate(contract?.contractDate ?? '', contract?.contractDisplayDate ?? '')}
                />
              </dl>

              <div className={styles.contactsBlock}>
                <h3 className={styles.contactsTitle}>Контакты университета</h3>
                <div className={styles.contactsList}>
                  <a href={universityContacts.phoneHref}>{universityContacts.phone}</a>
                  <a href={`mailto:${universityContacts.email}`}>{universityContacts.email}</a>
                </div>
              </div>
            </Card>
          </div>
        </>
      ) : (
        <Card padding="lg" className={styles.lockedCard}>
          <p className={styles.lockedText}>
            Подробные данные об обучении, задолженностях и договоре станут доступны после подписания
            согласия студентом.
          </p>
        </Card>
      )}
    </div>
  )
}
