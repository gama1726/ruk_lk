import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ApiError } from '@/apiClient'
import { courseLabel, maskPhone } from '@/mocks/format'
import { PARENT_CONSENT_MESSAGE } from '@/parent-consent'
import {
  fetchParentProfile,
  isParentProfileApiEnabled,
  type ParentProfileDto,
} from '@/parent-profile'
import { useParentAuth } from '@/parent-auth'
import { paths } from '@/paths'
import { Loader } from '@/ui'
import styles from './parent-profile.module.css'

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.row}>
      <dt>{label}</dt>
      <dd>{value || '—'}</dd>
    </div>
  )
}

function profileFromSession(session: NonNullable<ReturnType<typeof useParentAuth.getState>['session']>): ParentProfileDto {
  return {
    relation: session.relation,
    parentFullName: session.parentFullName,
    isCustomer: session.isCustomer,
    studentAdult: false,
    studentId: session.studentId,
    studentFullName: session.studentFullName,
    dataAccessAllowed: session.dataAccessAllowed,
    consentRequiredMessage: session.consentRequiredMessage,
    student: null,
  }
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

  return (
    <div className={styles.wrap}>
      <h1 className={styles.title}>Профиль</h1>

      {error ? <p className={styles.error}>{error}</p> : null}

      {!profile.dataAccessAllowed ? (
        <div className={styles.alert} role="alert">
          {consentMessage}{' '}
          <Link to={paths.parentSurvey}>Пройти опрос</Link>
        </div>
      ) : null}

      <section className={styles.section} aria-labelledby="parent-profile-you">
        <h2 id="parent-profile-you" className={styles.sectionTitle}>
          Вы
        </h2>
        <dl className={styles.list}>
          <Field label="Роль" value={profile.relation} />
          <Field label="ФИО" value={profile.parentFullName} />
          {profile.isCustomer ? <Field label="Договор" value="Заказчик / плательщик" /> : null}
        </dl>
      </section>

      <section className={styles.section} aria-labelledby="parent-profile-student">
        <h2 id="parent-profile-student" className={styles.sectionTitle}>
          Обучающийся
        </h2>
        <dl className={styles.list}>
          <Field label="ФИО" value={student?.fullName || profile.studentFullName} />
          <Field label="Номер зачётки" value={student?.studentId || profile.studentId} />
          {profile.studentAdult ? <Field label="Статус" value="Совершеннолетний" /> : null}
          {student ? (
            <>
              <Field label="Группа" value={student.group} />
              <Field label="Курс" value={courseLabel(student.course)} />
              <Field label="Форма обучения" value={student.educationForm} />
              <Field label="Направление" value={student.direction} />
              <Field label="Уровень" value={student.level} />
              <Field label="Факультет" value={student.faculty} />
              {student.branch ? <Field label="Филиал" value={student.branch} /> : null}
              <Field label="Статус обучения" value={student.status} />
              <Field label="Основа" value={student.funding} />
              {student.email ? <Field label="Email" value={student.email} /> : null}
              {student.phone ? <Field label="Телефон" value={maskPhone(student.phone)} /> : null}
            </>
          ) : !profile.dataAccessAllowed ? (
            <Field
              label="Данные об обучении"
              value="Доступны после подписания согласия студентом"
            />
          ) : null}
        </dl>
      </section>
    </div>
  )
}
